import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";
import PayInPayOutRule from "@/models/PayInPayOutRule";
import LineOfBusiness from "@/models/LineOfBusiness";
import Claim from "@/models/Claim";
import { computeCommission } from "@/utils/payInPayOutMatch";

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

const norm = (v?: string | null) => String(v || "").trim().toLowerCase();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    await dbConnect();

    const insuranceType = String(req.query.insuranceType || "all"); // all | GI | LI
    const groupBy = String(req.query.groupBy || "client"); // client | insurer | irdaiGroup | claim
    const { from, to } = req.query;
    const fromDate = from ? new Date(String(from)) : undefined;
    const toDate = to ? new Date(`${String(to)}T23:59:59`) : undefined;

    // Every configured Line of Business maps a product/LOB name to an IRDAI
    // Group + Type (GI/LI). A policy whose product/LOB has no matching
    // config here shows as "UNMAPPED" — same as the reference report.
    const lobs = await LineOfBusiness.find({}).lean();
    const lobMap = new Map<string, any>();
    for (const l of lobs as any[]) lobMap.set(norm(l.name), l);
    const resolveLob = (primary?: string, fallback?: string) =>
      (primary && lobMap.get(norm(primary))) || (fallback && lobMap.get(norm(fallback))) || null;

    // ---------------- Group By: Claim ----------------
    if (groupBy === "claim") {
      const query: any = {};
      if (fromDate || toDate) {
        query.dateOfLoss = {};
        if (fromDate) query.dateOfLoss.$gte = fromDate;
        if (toDate) query.dateOfLoss.$lte = toDate;
      }
      const claims = await Claim.find(query).sort({ dateOfLoss: -1 }).limit(2000).lean();

      const rows = (claims as any[])
        .map((c) => {
          const lob = resolveLob(c.productCode, c.lineOfBusiness);
          return {
            name: c.insuredName || "—",
            insurer: c.insurer || "—",
            irdaiGroup: lob ? lob.irdaiGroup : "UNMAPPED",
            irdaiType: lob ? lob.irdaiType : null,
            claimNumber: c.claimNumber,
            status: c.status,
            claimedAmount: c.claimedAmount || 0,
            approvedAmount: c.approvedAmount || 0,
          };
        })
        .filter((r) => insuranceType === "all" || r.irdaiType === insuranceType);

      const totals = rows.reduce(
        (acc, r) => {
          acc.count += 1;
          acc.claimedAmount += r.claimedAmount;
          acc.approvedAmount += r.approvedAmount;
          return acc;
        },
        { count: 0, claimedAmount: 0, approvedAmount: 0 }
      );

      return res.status(200).json({ success: true, groupBy, rows, totals, from: fromDate, to: toDate });
    }

    // ---------------- Group By: Client / Insurer / IRDAI Group ----------------
    const query: any = {};
    if (fromDate || toDate) {
      query.startDate = {};
      if (fromDate) query.startDate.$gte = fromDate;
      if (toDate) query.startDate.$lte = toDate;
    }

    const [policies, rules] = await Promise.all([
      IssuedPolicy.find(query, {
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
        createdByAgentId: 1,
        assignment: 1,
        "customer.fullName": 1,
      })
        .limit(5000)
        .lean(),
      PayInPayOutRule.find({}).lean(),
    ]);

    const enriched = (policies as any[])
      .map((p) => {
        const commission = computeCommission(p, rules as any);
        const lob = resolveLob(p.product, p.lineOfBusiness);
        return {
          clientName: p.customer?.fullName || "Unknown",
          insurer: p.insurer || "Unknown",
          irdaiGroup: lob ? lob.irdaiGroup : null,
          irdaiType: lob ? lob.irdaiType : null,
          remuneration: commission.payInAmount,
          premium: p.premium || 0,
        };
      })
      .filter((r) => insuranceType === "all" || r.irdaiType === insuranceType);

    if (groupBy === "irdaiGroup") {
      const map = new Map<string, { irdaiGroup: string; policyCount: number; remuneration: number; premium: number }>();
      for (const r of enriched) {
        const key = r.irdaiGroup || "UNMAPPED";
        const cur = map.get(key) || { irdaiGroup: key, policyCount: 0, remuneration: 0, premium: 0 };
        cur.policyCount += 1;
        cur.remuneration += r.remuneration;
        cur.premium += r.premium;
        map.set(key, cur);
      }
      const rows = Array.from(map.values()).sort((a, b) => a.irdaiGroup.localeCompare(b.irdaiGroup));
      const totals = rows.reduce(
        (acc, r) => {
          acc.policyCount += r.policyCount;
          acc.remuneration += r.remuneration;
          acc.premium += r.premium;
          return acc;
        },
        { policyCount: 0, remuneration: 0, premium: 0 }
      );
      return res.status(200).json({ success: true, groupBy, rows, totals, from: fromDate, to: toDate });
    }

    // client or insurer — two-level: (name -> IRDAI group) rows, then a
    // "<name> Total" row rolling up every group under that name.
    const primaryField: "clientName" | "insurer" = groupBy === "insurer" ? "insurer" : "clientName";
    const byPrimary = new Map<string, Map<string, { policyCount: number; remuneration: number; premium: number }>>();
    for (const r of enriched) {
      const primary = (r as any)[primaryField] || "Unknown";
      const group = r.irdaiGroup || "UNMAPPED";
      if (!byPrimary.has(primary)) byPrimary.set(primary, new Map());
      const sub = byPrimary.get(primary)!;
      const cur = sub.get(group) || { policyCount: 0, remuneration: 0, premium: 0 };
      cur.policyCount += 1;
      cur.remuneration += r.remuneration;
      cur.premium += r.premium;
      sub.set(group, cur);
    }

    const rows: any[] = [];
    const names = Array.from(byPrimary.keys()).sort((a, b) => a.localeCompare(b));
    for (const name of names) {
      const sub = byPrimary.get(name)!;
      const groups = Array.from(sub.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      let totalPolicyCount = 0;
      let totalRemuneration = 0;
      let totalPremium = 0;
      for (const [group, agg] of groups) {
        rows.push({ kind: "row", name, irdaiGroup: group, policyCount: agg.policyCount, remuneration: agg.remuneration, premium: agg.premium });
        totalPolicyCount += agg.policyCount;
        totalRemuneration += agg.remuneration;
        totalPremium += agg.premium;
      }
      rows.push({ kind: "total", name, policyCount: totalPolicyCount, remuneration: totalRemuneration, premium: totalPremium });
    }

    const totals = enriched.reduce(
      (acc, r) => {
        acc.policyCount += 1;
        acc.remuneration += r.remuneration;
        acc.premium += r.premium;
        return acc;
      },
      { policyCount: 0, remuneration: 0, premium: 0 }
    );

    return res.status(200).json({
      success: true,
      groupBy,
      primaryLabel: groupBy === "insurer" ? "Insurer" : "Client Name",
      rows,
      totals,
      from: fromDate,
      to: toDate,
    });
  } catch (err: any) {
    console.log("IRDAI REPORTS ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
