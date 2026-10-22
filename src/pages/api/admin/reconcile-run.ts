import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import * as XLSX from "xlsx";
import InsuranceCompanyConfig from "@/models/InsuranceCompanyConfig";
import InsuranceReconcileMapping from "@/models/InsuranceReconcileMapping";
import ReconciliationBatch from "@/models/ReconciliationBatch";
import IssuedPolicy from "@/models/IssuedPolicy";
import PayInPayOutRule from "@/models/PayInPayOutRule";
import { computeCommission } from "@/utils/payInPayOutMatch";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "12mb", // commission statements can run a few MB
    },
  },
};

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

const normPolicyNo = (v: any) => String(v ?? "").trim().toUpperCase().replace(/\s+/g, "");
const toNumber = (v: any): number => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// Column headers in a real-world uploaded file rarely match the configured
// mapping byte-for-byte (extra spaces, different casing) — look them up
// case/whitespace-insensitively instead of requiring an exact key match.
function buildRowReader(row: Record<string, any>) {
  const normalized = new Map<string, any>();
  for (const key of Object.keys(row)) {
    normalized.set(String(key).trim().toLowerCase(), row[key]);
  }
  return (headerName: string) => {
    if (!headerName) return undefined;
    return normalized.get(String(headerName).trim().toLowerCase());
  };
}

// Within this tolerance, small rounding differences don't count as a mismatch.
const AMOUNT_TOLERANCE = 1; // ₹1
const PERCENT_TOLERANCE = 0.1; // 0.1%
const closeEnough = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= tolerance;

// IssuedPolicy's own premium breakdown rows are labeled "Net Premium" / "OD"
// / "TP" / "Others" / "Add On" / "OD+Add on Premium" (see
// PREMIUM_ROW_LABELS in src/constants/policyFormOptions.ts) — there's no
// "Basic" or "Terrorism" row at all, so only OD/TP ever get an expected
// value from this; "Basic" and "Terrorism" are actual (CS)-only.
function breakdownAmount(breakdown: any[] | undefined, labelPattern: RegExp): number | null {
  if (!Array.isArray(breakdown)) return null;
  const row = breakdown.find((r) => labelPattern.test(String(r?.label || "")));
  return row ? Number(row.premiumAmount) || 0 : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  const admin: any = await requireAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    await dbConnect();
    const adminName = `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email;

    const { insuranceCompanyConfigId, fileName, fileData, dryRun } = req.body || {};
    if (!insuranceCompanyConfigId) {
      return res.status(400).json({ success: false, message: "Select an insurance company" });
    }
    if (!fileData) {
      return res.status(400).json({ success: false, message: "Upload a commission statement file" });
    }

    const company: any = await InsuranceCompanyConfig.findById(insuranceCompanyConfigId);
    if (!company) return res.status(400).json({ success: false, message: "Insurance company not found" });

    const mapping: any = await InsuranceReconcileMapping.findOne({ insuranceCompanyConfig: company._id }).lean();
    if (!mapping) {
      return res.status(400).json({
        success: false,
        message: `Commission reconcile mapping has not been set up for insurer "${company.name}". Configure it under Admin, Configuration Management, Mapping (Insurance Data Mapper): select this insurer and map MIS fields (including "policy_no") to the spreadsheet column headers used in its commission statements, then save.`,
      });
    }

    // ---------------- Parse the uploaded commission statement (CS) ----------------
    const mappedFields = (["basicPremiumAmount", "odPremiumAmount", "tpPremiumAmount", "terrorismPremiumAmount"] as const).filter(
      (f) => !!mapping.fieldMap[f]
    );

    const base64 = String(fileData).includes(",") ? String(fileData).split(",")[1] : String(fileData);
    const buffer = Buffer.from(base64, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const csRows = rawRows
      .map((row) => {
        const read = buildRowReader(row);
        const policyNo = String(read(mapping.fieldMap.policyNo) ?? "").trim();
        if (!policyNo) return null;
        return {
          policyNo,
          policyNoKey: normPolicyNo(policyNo),
          insuredName: mapping.fieldMap.insuredName ? String(read(mapping.fieldMap.insuredName) ?? "").trim() : "",
          premium: mapping.fieldMap.premium ? toNumber(read(mapping.fieldMap.premium)) : 0,
          commissionAmount: mapping.fieldMap.commissionAmount ? toNumber(read(mapping.fieldMap.commissionAmount)) : 0,
          commissionPercentage: mapping.fieldMap.commissionPercentage
            ? toNumber(read(mapping.fieldMap.commissionPercentage))
            : 0,
          basicPremium: mapping.fieldMap.basicPremiumAmount ? toNumber(read(mapping.fieldMap.basicPremiumAmount)) : null,
          odPremium: mapping.fieldMap.odPremiumAmount ? toNumber(read(mapping.fieldMap.odPremiumAmount)) : null,
          tpPremium: mapping.fieldMap.tpPremiumAmount ? toNumber(read(mapping.fieldMap.tpPremiumAmount)) : null,
          terrorismPremium: mapping.fieldMap.terrorismPremiumAmount
            ? toNumber(read(mapping.fieldMap.terrorismPremiumAmount))
            : null,
        };
      })
      .filter(Boolean) as {
      policyNo: string;
      policyNoKey: string;
      insuredName: string;
      premium: number;
      commissionAmount: number;
      commissionPercentage: number;
      basicPremium: number | null;
      odPremium: number | null;
      tpPremium: number | null;
      terrorismPremium: number | null;
    }[];

    // ---------------- Load our own expected data (MIS) ----------------
    const [policies, rules] = await Promise.all([
      IssuedPolicy.find(
        { insurer: { $regex: `^${company.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        {
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
          createdByAgentId: 1,
          assignment: 1,
          "customer.fullName": 1,
          premiumBreakdown: 1,
        }
      ).lean(),
      PayInPayOutRule.find({}).lean(),
    ]);

    const misByKey = new Map<
      string,
      {
        policyNo: string;
        insuredName: string;
        premium: number;
        commissionAmount: number;
        commissionPercentage: number;
        basicPremium: number | null;
        odPremium: number | null;
        tpPremium: number | null;
      }
    >();
    for (const p of policies as any[]) {
      if (!p.policyNumber) continue;
      const commission = computeCommission(p, rules as any);
      const premium = p.premium || 0;
      misByKey.set(normPolicyNo(p.policyNumber), {
        policyNo: p.policyNumber,
        insuredName: p.customer?.fullName || "",
        premium,
        commissionAmount: commission.payInAmount,
        commissionPercentage: commission.rule?.payInPercent ?? 0,
        // No "Basic" row exists in our premium breakdown at all — left null
        // intentionally rather than guessing it's the same as "Net Premium".
        basicPremium: null,
        odPremium: breakdownAmount(p.premiumBreakdown, /^od(\s*\+\s*add\s*on\s*premium)?$/i),
        tpPremium: breakdownAmount(p.premiumBreakdown, /^tp$/i),
      });
    }

    // ---------------- Compare ----------------
    const results: any[] = [];
    const consumedMisKeys = new Set<string>();

    for (const cs of csRows) {
      const mis = misByKey.get(cs.policyNoKey);
      if (!mis) {
        results.push({
          policyNo: cs.policyNo,
          insuredName: cs.insuredName,
          category: "missing_in_mis",
          expectedPremium: null,
          actualPremium: cs.premium,
          expectedCommissionAmount: null,
          actualCommissionAmount: cs.commissionAmount,
          expectedCommissionPercentage: null,
          actualCommissionPercentage: cs.commissionPercentage,
          actualBasicPremium: cs.basicPremium,
          actualOdPremium: cs.odPremium,
          actualTpPremium: cs.tpPremium,
          actualTerrorismPremium: cs.terrorismPremium,
        });
        continue;
      }
      consumedMisKeys.add(cs.policyNoKey);

      const premiumOk = !mapping.fieldMap.premium || closeEnough(mis.premium, cs.premium, AMOUNT_TOLERANCE);
      const amountOk =
        !mapping.fieldMap.commissionAmount || closeEnough(mis.commissionAmount, cs.commissionAmount, AMOUNT_TOLERANCE);
      const percentOk =
        !mapping.fieldMap.commissionPercentage ||
        closeEnough(mis.commissionPercentage, cs.commissionPercentage, PERCENT_TOLERANCE);

      results.push({
        policyNo: cs.policyNo,
        insuredName: cs.insuredName || mis.insuredName,
        category: premiumOk && amountOk && percentOk ? "matched" : "mismatched",
        expectedPremium: mis.premium,
        actualPremium: cs.premium,
        expectedCommissionAmount: mis.commissionAmount,
        actualCommissionAmount: cs.commissionAmount,
        expectedCommissionPercentage: mis.commissionPercentage,
        actualCommissionPercentage: cs.commissionPercentage,
        expectedBasicPremium: mis.basicPremium,
        actualBasicPremium: cs.basicPremium,
        expectedOdPremium: mis.odPremium,
        actualOdPremium: cs.odPremium,
        expectedTpPremium: mis.tpPremium,
        actualTpPremium: cs.tpPremium,
        actualTerrorismPremium: cs.terrorismPremium,
      });
    }

    for (const [key, mis] of misByKey.entries()) {
      if (consumedMisKeys.has(key)) continue;
      results.push({
        policyNo: mis.policyNo,
        insuredName: mis.insuredName,
        category: "missing_in_cs",
        expectedPremium: mis.premium,
        actualPremium: null,
        expectedCommissionAmount: mis.commissionAmount,
        actualCommissionAmount: null,
        expectedCommissionPercentage: mis.commissionPercentage,
        actualCommissionPercentage: null,
        expectedBasicPremium: mis.basicPremium,
        actualBasicPremium: null,
        expectedOdPremium: mis.odPremium,
        actualOdPremium: null,
        expectedTpPremium: mis.tpPremium,
        actualTpPremium: null,
        actualTerrorismPremium: null,
      });
    }

    const counts = results.reduce(
      (acc, r) => {
        if (r.category === "matched") acc.matchedCount++;
        else if (r.category === "mismatched") acc.mismatchedCount++;
        else if (r.category === "missing_in_mis") acc.missingInMisCount++;
        else if (r.category === "missing_in_cs") acc.missingInCsCount++;
        return acc;
      },
      { matchedCount: 0, mismatchedCount: 0, missingInMisCount: 0, missingInCsCount: 0 }
    );

    const batchPayload = {
      insuranceCompanyConfig: company._id,
      insurerName: company.name,
      insurerBranch: company.branch,
      fileName: fileName || "commission-statement.xlsx",
      fileData,
      reconciledBy: adminName,
      policiesInDb: policies.length,
      recordsInExcel: csRows.length,
      ...counts,
      mappedFields,
      results,
    };

    // "Preview only (dry run)" — compute and return, but never persist the
    // statement or create a batch in the reconciliation history.
    if (dryRun) {
      return res.status(200).json({ success: true, batch: { ...batchPayload, _id: null, batchNo: null } });
    }

    const lastBatch = await ReconciliationBatch.findOne({}).sort({ batchNo: -1 }).select("batchNo").lean();
    const batchNo = ((lastBatch as any)?.batchNo || 0) + 1;

    const batch = await ReconciliationBatch.create({ ...batchPayload, batchNo });
    return res.status(201).json({ success: true, batch });
  } catch (err: any) {
    console.log("RECONCILE RUN ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
