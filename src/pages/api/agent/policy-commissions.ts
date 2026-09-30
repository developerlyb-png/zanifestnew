import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";
import PayInPayOutRule from "@/models/PayInPayOutRule";
import { computeCommission, ruleSummary, policyDate } from "@/utils/payInPayOutMatch";

async function requireAgent(req: NextApiRequest) {
  const token = req.cookies["agentToken"];
  const data = token ? await verifyToken(token) : null;
  if (!data || typeof data !== "object" || (data as any).role !== "agent") {
    return null;
  }
  return data as any;
}

// Agents only ever see their own PayOut (what they earn) — never PayIn
// (what the company earns from the insurer), which is a margin figure.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  const agent = await requireAgent(req);
  if (!agent) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    await dbConnect();
    const { from, to } = req.query;

    const query: any = {
      $or: [{ createdByAgentId: agent.id }, { "assignment.pospAgent.id": agent.id }],
    };
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
        "customer.fullName": 1,
      })
        .sort({ createdAt: -1 })
        .lean(),
      PayInPayOutRule.find({}).lean(),
    ]);

    const rows = (policies as any[]).map((p) => {
      const result = computeCommission(p, rules as any);
      return {
        _id: p._id,
        policyNumber: p.policyNumber,
        insuredName: p.customer?.fullName,
        insurer: p.insurer,
        lineOfBusiness: p.lineOfBusiness,
        product: p.product,
        premium: p.premium || 0,
        date: policyDate(p),
        payOutPercent: result.rule?.payOutPercent ?? null,
        payOutAmount: result.payOutAmount,
        matchedRule: result.rule ? ruleSummary(result.rule) : null,
      };
    });

    const totalPayOut = rows.reduce((sum, r) => sum + r.payOutAmount, 0);

    return res.status(200).json({ success: true, rows, summary: { totalPayOut, count: rows.length } });
  } catch (err: any) {
    console.log("AGENT POLICY COMMISSIONS ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
