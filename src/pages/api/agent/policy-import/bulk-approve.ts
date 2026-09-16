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
import { loadReferenceLists } from "@/utils/policyBulkMapping";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

async function requireAgent(req: NextApiRequest) {
  const token = req.cookies["agentToken"];
  const data = token ? await verifyToken(token) : null;

  if (!data || typeof data !== "object" || (data as any).role !== "agent") {
    return null;
  }
  return data as any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const agent = await requireAgent(req);
  if (!agent) {
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

    const agentName = agent.fullName || agent.email;

    // Duplicates *within this batch* (compared against each other, before
    // any of them exist in the database yet).
    const withinBatch = batchDuplicateMap(rows.map((r) => ({ id: r.id, data: r.data || {} })));

    // Loaded once for the whole batch rather than per-row inside
    // buildPolicyFromExtraction — same branch/motor-make/insurer lists apply
    // to every row in this request.
    const refs = await loadReferenceLists();

    const saved: { id: string; policyId: string }[] = [];
    const duplicates: { id: string; originalName?: string; duplicate: any }[] = [];
    const skipped: { id: string; reason: string }[] = [];

    for (const row of rows) {
      const imp: any = await PolicyImport.findOne({ _id: row.id, agentId: agent.id });
      if (!imp) {
        skipped.push({ id: row.id, reason: "Import not found" });
        continue;
      }
      if (imp.status === "saved") {
        continue; // already submitted earlier — not an error, just nothing to do
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

      const policyFields = await buildPolicyFromExtraction(merged, {
        createdBy: agentName,
        importId: String(imp._id),
        fileData: imp.fileData,
        originalName: imp.originalName,
        createdByAgentId: agent.id,
        refs,
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
    console.log("AGENT POLICY IMPORT BULK APPROVE ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
