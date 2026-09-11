import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import PolicyImport from "@/models/PolicyImport";
import IssuedPolicy from "@/models/IssuedPolicy";
import {
  findDuplicatePolicy,
  batchDuplicateMap,
  buildPolicyFromExtraction,
} from "@/utils/aiPolicyExtractor";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();

  try {
    const rows: { id: string; data?: any }[] = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "No rows to save" });
    }

    const adminName =
      `${(admin as any).userFirstName ?? ""} ${(admin as any).userLastName ?? ""}`.trim() ||
      (admin as any).email;

    // Duplicates *within this batch* (compared against each other, before
    // any of them exist in the database yet).
    const withinBatch = batchDuplicateMap(rows.map((r) => ({ id: r.id, data: r.data || {} })));

    const saved: { id: string; policyId: string }[] = [];
    const duplicates: { id: string; originalName?: string; duplicate: any }[] = [];
    const skipped: { id: string; reason: string }[] = [];

    for (const row of rows) {
      const imp: any = await PolicyImport.findById(row.id);
      if (!imp) {
        skipped.push({ id: row.id, reason: "Import not found" });
        continue;
      }
      if (imp.status === "saved") {
        continue; // already saved earlier — not an error, just nothing to do
      }
      if (imp.status !== "review") {
        skipped.push({ id: row.id, reason: `${imp.originalName} is not ready for review` });
        continue;
      }

      const merged = { ...(imp.extracted || {}), ...(row.data || {}) };

      const batchDup = withinBatch.get(row.id);
      if (batchDup) {
        duplicates.push({
          id: row.id,
          originalName: imp.originalName,
          duplicate: { reason: batchDup.reason, reasonLabel: batchDup.reasonLabel, withinBatch: true },
        });
        continue;
      }

      const dup = await findDuplicatePolicy(merged);
      if (dup) {
        duplicates.push({ id: row.id, originalName: imp.originalName, duplicate: dup });
        continue;
      }

      const policyFields = buildPolicyFromExtraction(merged, {
        createdBy: adminName,
        importId: String(imp._id),
        fileData: imp.fileData,
        originalName: imp.originalName,
      });
      const policy = await IssuedPolicy.create(policyFields);

      imp.status = "saved";
      imp.extracted = merged;
      imp.confidence = merged.confidence ?? imp.confidence;
      imp.error = undefined;
      imp.savedPolicyId = policy._id;
      await imp.save();

      saved.push({ id: row.id, policyId: String(policy._id) });
    }

    return res.status(200).json({
      success: true,
      saved: saved.length,
      skippedDuplicates: duplicates.length,
      saved_ids: saved,
      duplicates,
      skipped,
    });
  } catch (err: any) {
    console.log("POLICY IMPORT BULK APPROVE ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
