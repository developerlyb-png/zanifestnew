import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";
import PayInPayOutRule from "@/models/PayInPayOutRule";
import { computeCommission, ruleSummary, policyDate } from "@/utils/payInPayOutMatch";

async function requireAdmin(req: NextApiRequest) {
  const token = req.cookies["adminToken"];
  const data = token ? await verifyToken(token) : null;
  if (
    !data ||
    typeof data !== "object" ||
    !("role" in data) ||
    !["superadmin", "admin"].includes((data as any).role)
  ) {
    return null;
  }
  return data;
}

const agentNameOf = (p: any) =>
  p.assignment?.pospAgent?.name || p.pospPartner || p.assignment?.pospPartner || p.createdBy || "Direct Business";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    await dbConnect();
    const { from, to } = req.query;

    const query: any = {};
    if (from || to) {
      query.startDate = {};
      if (from) query.startDate.$gte = new Date(String(from));
      if (to) query.startDate.$lte = new Date(String(to));
    }

    const [policies, rules] = await Promise.all([
      IssuedPolicy.find(query, {
        policyNumber: 1,
        insurer: 1,
        businessSegment: 1,
        lineOfBusiness: 1,
        product: 1,
        policyTypeStructure: 1,
        transactionType: 1,
        mediumOfIssuance: 1,
        premium: 1,
        startDate: 1,
        paymentReceivedDate: 1,
        createdAt: 1,
        vehicle: 1,
        assignment: 1,
        pospPartner: 1,
        createdBy: 1,
        "customer.fullName": 1,
      })
        .sort({ createdAt: -1 })
        .limit(2000)
        .lean(),
      PayInPayOutRule.find({}).lean(),
    ]);

    const rows = (policies as any[]).map((p) => {
      const result = computeCommission(p, rules as any);
      return {
        _id: p._id,
        policyNumber: p.policyNumber,
        insuredName: p.customer?.fullName,
        agentName: agentNameOf(p),
        insurer: p.insurer,
        lineOfBusiness: p.lineOfBusiness,
        product: p.product,
        premium: p.premium || 0,
        date: policyDate(p),
        payInPercent: result.rule?.payInPercent ?? null,
        payOutPercent: result.rule?.payOutPercent ?? null,
        payInAmount: result.payInAmount,
        payOutAmount: result.payOutAmount,
        matchedRule: result.rule ? ruleSummary(result.rule) : null,
      };
    });

    const summary = rows.reduce(
      (acc, r) => {
        acc.totalPayIn += r.payInAmount;
        acc.totalPayOut += r.payOutAmount;
        if (r.matchedRule) acc.matched += 1;
        else acc.unmatched += 1;
        return acc;
      },
      { totalPayIn: 0, totalPayOut: 0, matched: 0, unmatched: 0 }
    );

    return res.status(200).json({ success: true, rows, summary });
  } catch (err: any) {
    console.log("ADMIN POLICY COMMISSIONS ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
