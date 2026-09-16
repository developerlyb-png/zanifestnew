import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import PolicyImport from "@/models/PolicyImport";
import { runExtractionJob } from "@/utils/aiPolicyExtractor";

// Agent's own "Upload PDF" flow — mirrors /api/admin/policy-import exactly
// (same one-file-per-request upload architecture, same 25-file/15MB limits),
// scoped to the agent's own imports via agentId instead of being admin-wide.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "22mb",
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

const MAX_FILES_PER_BATCH = 25;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const agent = await requireAgent(req);
  if (!agent) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const items: any[] = await PolicyImport.find({ agentId: agent.id }, { fileData: 0 })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("savedPolicyId", "adminApprovalStatus adminApprovalRemark")
        .lean();

      // Flatten the populated policy's review status onto the row so the
      // frontend can tell "submitted, pending review" apart from
      // "submitted, rejected — edit and resubmit" without a second request.
      const shaped = items.map((it: any) => ({
        ...it,
        savedPolicyId: it.savedPolicyId?._id ?? it.savedPolicyId,
        approvalStatus: it.savedPolicyId?.adminApprovalStatus,
        approvalRemark: it.savedPolicyId?.adminApprovalRemark,
      }));

      return res.status(200).json({ success: true, items: shaped });
    } catch (err: any) {
      console.log("AGENT POLICY IMPORT LIST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const files = Array.isArray(req.body?.files) ? req.body.files : [];
      if (files.length === 0) {
        return res.status(400).json({ success: false, message: "No PDFs uploaded" });
      }
      if (files.length > MAX_FILES_PER_BATCH) {
        return res
          .status(400)
          .json({ success: false, message: `Maximum ${MAX_FILES_PER_BATCH} PDFs per batch` });
      }

      const agentName = agent.fullName || agent.email;

      const ids: string[] = [];
      const skipped: string[] = [];

      for (const f of files) {
        const fileName = String(f?.fileName || "").trim();
        const fileData = String(f?.fileData || "");
        if (!fileName || !fileData.startsWith("data:application/pdf")) {
          skipped.push(fileName || "unknown file");
          continue;
        }
        const approxBytes = (fileData.length * 3) / 4;
        if (approxBytes > MAX_FILE_BYTES) {
          skipped.push(fileName);
          continue;
        }

        const doc = await PolicyImport.create({
          originalName: fileName,
          fileData,
          status: "processing",
          createdBy: agentName,
          agentId: agent.id,
        });
        ids.push(String(doc._id));
        runExtractionJob(String(doc._id));
      }

      if (ids.length === 0) {
        return res.status(400).json({ success: false, message: "No valid PDF files in this batch" });
      }

      return res.status(202).json({ success: true, ids, skipped });
    } catch (err: any) {
      console.log("AGENT POLICY IMPORT UPLOAD ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
