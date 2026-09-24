import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import Claim from "@/models/Claim";
import IssuedPolicy from "@/models/IssuedPolicy";
import {
  CLAIM_TYPES,
  CLAIM_STATUSES,
  REPORTED_CHANNELS,
  DEFAULT_CLAIM_STATUS,
  TEMP_CLAIM_PREFIX,
} from "@/constants/claims";

export const config = { api: { bodyParser: { sizeLimit: "15mb" } } };

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
  return data as any;
}

const str = (v: any) => {
  const s = v === undefined || v === null ? "" : String(v).trim();
  return s || undefined;
};

const amount = (v: any) => {
  const n = Number(String(v ?? "").replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

// Accepts YYYY-MM-DD / ISO, DD/MM/YYYY, and Excel serial numbers.
function parseDate(v: any): Date | undefined | null {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(v).trim();
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const d = new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

const matchEnum = (v: any, list: readonly string[]) => {
  const s = String(v ?? "").trim().toLowerCase();
  return list.find((x) => x.toLowerCase() === s);
};

const toProductCode = (v: string) =>
  String(v || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: "Not authorized" });

  const adminName = `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email;

  try {
    const rows: Record<string, any>[] = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "No rows to process" });
    }
    await dbConnect();

    const policyNumbers = Array.from(
      new Set(rows.map((r) => str(r.policyNumber)).filter((v): v is string => !!v))
    );
    const policies = await IssuedPolicy.find(
      { policyNumber: { $in: policyNumbers } },
      { policyNumber: 1, insurer: 1, lineOfBusiness: 1, policyType: 1, product: 1, customer: 1 }
    ).lean();
    const policyByNumber = new Map((policies as any[]).map((p) => [p.policyNumber, p]));

    // Claim numbers already taken (typed ones in the file + DB) and the auto sequence.
    const typedNumbers = rows.map((r) => str(r.claimNumber)).filter((v): v is string => !!v);
    const existingTyped = await Claim.find({ claimNumber: { $in: typedNumbers } }, { claimNumber: 1 }).lean();
    const taken = new Set((existingTyped as any[]).map((c) => c.claimNumber));

    const tempRows = await Claim.find(
      { claimNumber: new RegExp("^" + TEMP_CLAIM_PREFIX + "\\d+$") },
      { claimNumber: 1 }
    ).lean();
    let seq = 0;
    for (const r of tempRows as any[]) {
      const n = Number(String(r.claimNumber).slice(TEMP_CLAIM_PREFIX.length));
      if (n > seq) seq = n;
    }

    const docs: any[] = [];
    const skipped: { row: number; reason: string }[] = [];
    const seenInFile = new Set<string>();

    rows.forEach((row, i) => {
      const rowNumber = i + 2; // header is row 1
      if (Object.values(row).every((v) => v === undefined || v === null || String(v).trim() === "")) return;
      const fail = (reason: string) => skipped.push({ row: rowNumber, reason });

      const policyNumber = str(row.policyNumber);
      if (!policyNumber) return fail("Policy Number is required");
      const policy: any = policyByNumber.get(policyNumber);
      if (!policy) return fail(`Policy "${policyNumber}" not found`);

      const claimType = matchEnum(row.claimType, CLAIM_TYPES);
      if (!claimType) return fail(`Claim Type must be one of: ${CLAIM_TYPES.join(", ")}`);
      const reportedChannel = matchEnum(row.reportedChannel, REPORTED_CHANNELS);
      if (!reportedChannel) return fail(`Reported Channel must be one of: ${REPORTED_CHANNELS.join(", ")}`);
      const specialRemark = str(row.specialRemark);
      if (!specialRemark) return fail("Special Remark is required");

      let status = DEFAULT_CLAIM_STATUS;
      if (str(row.status)) {
        const m = matchEnum(row.status, CLAIM_STATUSES);
        if (!m) return fail(`Claim Status must be one of: ${CLAIM_STATUSES.join(", ")}`);
        status = m;
      }

      const required =
        claimType === "Non Employee Benefit"
          ? ["lossCause", "lossDetails", "siteAddress", "sitePinCode", "state", "city"]
          : ["patientName", "hospitalName", "diagnosis"];
      const missing = required.filter((k) => !str(row[k]));
      if (missing.length) return fail(`Missing required field(s): ${missing.join(", ")}`);

      const dates: Record<string, Date | undefined> = {};
      for (const k of ["dateOfLoss", "reportedOn", "admissionDate", "dischargeDate"]) {
        const d = parseDate(row[k]);
        if (d === null) return fail(`Invalid date in ${k}`);
        dates[k] = d;
      }

      let claimNumber = str(row.claimNumber);
      if (claimNumber) {
        if (taken.has(claimNumber)) return fail(`Claim No "${claimNumber}" already exists`);
        if (seenInFile.has(claimNumber)) return fail(`Duplicate Claim No "${claimNumber}" within this file`);
      } else {
        do {
          claimNumber = TEMP_CLAIM_PREFIX + ++seq;
        } while (taken.has(claimNumber) || seenInFile.has(claimNumber));
      }
      seenInFile.add(claimNumber);

      docs.push({
        claimNumber,
        claimType,
        status,
        policyId: policy._id,
        policyNumber,
        insuredName: policy.customer?.fullName,
        contactMobile: policy.customer?.mobile,
        contactEmail: policy.customer?.email,
        insurer: policy.insurer,
        lineOfBusiness: policy.lineOfBusiness || policy.policyType,
        productCode: toProductCode(policy.product || policy.policyType || policy.lineOfBusiness),
        reportedChannel,
        dateOfLoss: dates.dateOfLoss,
        reportedOn: dates.reportedOn,
        specialRemark,
        claimDetails: str(row.claimDetails),
        estimatedAmount: amount(row.estimatedAmount),
        claimedAmount: amount(row.claimedAmount),
        approvedAmount: amount(row.approvedAmount),
        lossCause: str(row.lossCause),
        lossDetails: str(row.lossDetails),
        siteAddress: str(row.siteAddress),
        sitePinCode: str(row.sitePinCode),
        state: str(row.state),
        city: str(row.city),
        patientName: str(row.patientName),
        hospitalName: str(row.hospitalName),
        diagnosis: str(row.diagnosis),
        admissionDate: dates.admissionDate,
        dischargeDate: dates.dischargeDate,
        notify: true,
        createdBy: adminName,
        timeline: [{ status, by: adminName, note: specialRemark }],
      });
    });

    let inserted = 0;
    if (docs.length) {
      const result = await Claim.insertMany(docs, { ordered: false });
      inserted = result.length;
    }
    return res.status(201).json({ success: true, inserted, skipped });
  } catch (err: any) {
    console.log("CLAIMS BULK ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
