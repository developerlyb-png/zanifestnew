import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import Claim from "@/models/Claim";
import {
  CLAIM_TYPES,
  CLAIM_STATUSES,
  REPORTED_CHANNELS,
  DEFAULT_CLAIM_STATUS,
  TEMP_CLAIM_PREFIX,
} from "@/constants/claims";

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

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

// Next number in the TEMP_CL-No_<n> sequence (max existing + 1).
async function nextTempClaimNumber() {
  const rows = await Claim.find(
    { claimNumber: new RegExp("^" + TEMP_CLAIM_PREFIX + "\\d+$") },
    { claimNumber: 1 }
  ).lean();
  let max = 0;
  for (const r of rows as any[]) {
    const n = Number(String(r.claimNumber).slice(TEMP_CLAIM_PREFIX.length));
    if (n > max) max = n;
  }
  return TEMP_CLAIM_PREFIX + (max + 1);
}

const adminNameOf = (admin: any) =>
  `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email;

function validateBody(b: any): string | null {
  if (!b.policyNumber) return "Policy number is required";
  if (!CLAIM_TYPES.includes(b.claimType)) return "Valid claim type is required";
  if (!REPORTED_CHANNELS.includes(b.reportedChannel)) return "Reported channel is required";
  if (!b.specialRemark || !String(b.specialRemark).trim()) return "Special remark is required";
  const required =
    b.claimType === "Non Employee Benefit"
      ? ["lossCause", "lossDetails", "siteAddress", "sitePinCode", "state", "city"]
      : ["patientName", "hospitalName", "diagnosis"];
  const missing = required.filter((f) => !b[f] || !String(b[f]).trim());
  return missing.length ? `Missing required field(s): ${missing.join(", ")}` : null;
}

const FIELDS = [
  "claimType", "policyId", "policyNumber", "insuredName", "contactMobile", "contactEmail",
  "insurer", "lineOfBusiness", "productCode", "reportedChannel", "dateOfLoss", "reportedOn",
  "specialRemark", "claimDetails", "lossCause", "lossDetails", "siteAddress", "sitePinCode",
  "state", "city", "patientName", "hospitalName", "diagnosis", "admissionDate", "dischargeDate",
];

function pickFields(b: any) {
  const out: any = {};
  for (const f of FIELDS) {
    if (b[f] === undefined) continue;
    out[f] = b[f] === "" ? undefined : b[f];
  }
  out.estimatedAmount = num(b.estimatedAmount);
  out.claimedAmount = num(b.claimedAmount);
  out.approvedAmount = num(b.approvedAmount);
  if (b.notify !== undefined) out.notify = b.notify !== false;
  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin: any = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const { from, to, id, docId } = req.query;

      if (id) {
        if (docId) {
          const c: any = await Claim.findById(String(id), { documents: 1 }).lean();
          const doc = c?.documents?.find((d: any) => String(d._id) === String(docId));
          if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
          return res.status(200).json({ success: true, document: doc });
        }
        const claim = await Claim.findById(String(id), { "documents.data": 0 }).lean();
        if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
        return res.status(200).json({ success: true, claim });
      }

      const query: any = {};
      if (from || to) {
        query.reportedOn = {};
        if (from) query.reportedOn.$gte = new Date(String(from));
        if (to) query.reportedOn.$lte = new Date(String(to));
      }
      const claims = await Claim.find(query, { documents: 0, timeline: 0 })
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, claims });
    } catch (err: any) {
      console.log("CLAIMS GET ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const b = req.body || {};
      const invalid = validateBody(b);
      if (invalid) return res.status(400).json({ success: false, message: invalid });

      const adminName = adminNameOf(admin);
      const status = CLAIM_STATUSES.includes(b.status) ? b.status : DEFAULT_CLAIM_STATUS;
      const typed = String(b.claimNumber || "").trim();

      let claim: any = null;
      // Auto numbers can race; retry a few times on duplicate key.
      for (let attempt = 0; attempt < 5 && !claim; attempt++) {
        const claimNumber = typed || (await nextTempClaimNumber());
        try {
          claim = await Claim.create({
            ...pickFields(b),
            claimNumber,
            status,
            createdBy: adminName,
            timeline: [{ status, by: adminName, note: b.specialRemark }],
          });
        } catch (e: any) {
          if (e?.code === 11000 && !typed) continue;
          throw e;
        }
      }

      return res.status(201).json({ success: true, claim });
    } catch (err: any) {
      if (err?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A claim with this Claim No already exists",
        });
      }
      console.log("CLAIMS POST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const b = req.body || {};
      const { id } = b;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      const invalid = validateBody(b);
      if (invalid) return res.status(400).json({ success: false, message: invalid });

      const existing: any = await Claim.findById(id, { status: 1 }).lean();
      if (!existing) return res.status(404).json({ success: false, message: "Claim not found" });

      const update: any = pickFields(b);
      const typed = String(b.claimNumber || "").trim();
      if (typed) update.claimNumber = typed;

      const ops: any = { $set: update };
      if (CLAIM_STATUSES.includes(b.status) && b.status !== existing.status) {
        update.status = b.status;
        ops.$push = {
          timeline: { status: b.status, by: adminNameOf(admin), note: "Claim updated" },
        };
      }

      const claim = await Claim.findByIdAndUpdate(id, ops, {
        new: true,
        projection: { "documents.data": 0 },
      }).lean();
      return res.status(200).json({ success: true, claim });
    } catch (err: any) {
      if (err?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A claim with this Claim No already exists",
        });
      }
      console.log("CLAIMS PUT ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id, status, remark } = req.body || {};
      if (!id || !CLAIM_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Valid id and status are required" });
      }
      const claim = await Claim.findByIdAndUpdate(
        id,
        {
          $set: { status },
          $push: {
            timeline: {
              status,
              by: adminNameOf(admin),
              note: String(remark || "").trim() || undefined,
            },
          },
        },
        { new: true, projection: { "documents.data": 0 } }
      ).lean();
      if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
      return res.status(200).json({ success: true, claim });
    } catch (err: any) {
      console.log("CLAIMS PATCH ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
