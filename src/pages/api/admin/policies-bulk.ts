import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";
import Manager from "@/models/Manager";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
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

const REQUIRED_KEYS = ["policyNumber", "insurer", "lineOfBusiness", "premium"];

const num = (v: any): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const str = (v: any): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
};

const date = (v: any): Date | undefined => {
  const s = str(v);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const rowIsBlank = (row: Record<string, any>) =>
  Object.values(row).every((v) => v === undefined || v === null || String(v).trim() === "");

function mapRow(row: Record<string, any>, managersByName: Map<string, any>) {
  const lineOfBusiness = str(row.lineOfBusiness);
  const isMotor = lineOfBusiness === "Motor";
  const manager = str(row.reportingManagerName)
    ? managersByName.get(String(row.reportingManagerName).trim().toLowerCase())
    : undefined;

  return {
    policyNumber: str(row.policyNumber),
    insurer: str(row.insurer),
    policyType: lineOfBusiness,
    lineOfBusiness,
    product: str(row.product),
    transactionType: str(row.transactionType),
    paymentReceivedDate: date(row.paymentReceivedDate),
    policyTypeStructure: str(row.policyTypeStructure),
    mediumOfIssuance: str(row.mediumOfIssuance),
    subInsured: str(row.subInsuredName),
    endorsementNo: "-",
    pospPartner: str(row.pospPartner) || "Direct Business",
    policyRemark: str(row.policyRemark) || "",
    status: str(row.status) || "Active",
    startDate: date(row.startDate),
    endDate: date(row.endDate),
    customer: {
      fullName: str(row.insuredName) || "",
      email: str(row.insuredEmail),
      mobile: str(row.insuredMobile),
      address: str(row.address),
    },
    vehicle: isMotor
      ? {
          number: str(row.registrationNumber),
          make: str(row.motorMake),
          model: str(row.product),
          vehicleType: str(row.vehicleType),
          fuelType: str(row.fuelType),
          modelYear: str(row.modelYear),
          itemsCovered: str(row.itemsCovered),
          ncbApplicable: str(row.ncbApplicable),
        }
      : undefined,
    assignment: {
      branchName: str(row.branchName),
      reportingManager: manager ? { id: manager._id, name: manager.name } : undefined,
      pospPartner: str(row.pospPartner),
    },
    premium: num(row.premium),
    grossPremium: num(row.grossPremium),
    commissionAmount: num(row.commissionAmount) ?? null,
    payoutAmount: num(row.payoutAmount) ?? null,
    payoutStatus: str(row.payoutStatus) || "PENDING",
    rewardStatus: str(row.rewardStatus),
    commissionRemark: str(row.commissionRemark),
    source: "manual",
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const adminName =
    `${(admin as any).userFirstName ?? ""} ${(admin as any).userLastName ?? ""}`.trim() ||
    (admin as any).email;

  try {
    const rows: Record<string, any>[] = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "No rows to process" });
    }

    await dbConnect();

    const managers = await Manager.find({}, { firstName: 1, lastName: 1, managerId: 1 });
    const managersByName = new Map(
      managers.map((m: any) => [
        `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim().toLowerCase(),
        { _id: m._id, name: `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() },
      ])
    );

    const policyNumbersInFile = rows
      .map((row) => str(row.policyNumber))
      .filter((v): v is string => !!v);

    const existingPolicies = await IssuedPolicy.find(
      { policyNumber: { $in: policyNumbersInFile } },
      { policyNumber: 1 }
    );
    const existingPolicyNumbers = new Set(existingPolicies.map((p: any) => p.policyNumber));
    const seenInFile = new Set<string>();

    const docs: any[] = [];
    const skipped: { row: number; reason: string }[] = [];

    rows.forEach((row, i) => {
      const rowNumber = i + 2; // account for the header row in the sheet
      if (rowIsBlank(row)) return;

      const missing = REQUIRED_KEYS.filter((k) => {
        const v = row[k];
        return v === undefined || v === null || String(v).trim() === "";
      });
      if (missing.length) {
        skipped.push({ row: rowNumber, reason: `Missing required field(s): ${missing.join(", ")}` });
        return;
      }

      const policyNumber = str(row.policyNumber) as string;
      if (existingPolicyNumbers.has(policyNumber)) {
        skipped.push({ row: rowNumber, reason: `Policy Number "${policyNumber}" already exists` });
        return;
      }
      if (seenInFile.has(policyNumber)) {
        skipped.push({ row: rowNumber, reason: `Duplicate Policy Number "${policyNumber}" within this file` });
        return;
      }
      seenInFile.add(policyNumber);

      docs.push({ ...mapRow(row, managersByName), createdBy: adminName });
    });

    let inserted = 0;
    if (docs.length) {
      const result = await IssuedPolicy.insertMany(docs, { ordered: false });
      inserted = result.length;
    }

    return res.status(201).json({ success: true, inserted, skipped });
  } catch (err: any) {
    console.log("ADMIN POLICIES BULK ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
