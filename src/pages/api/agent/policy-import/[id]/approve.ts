import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import PolicyImport from "@/models/PolicyImport";
import IssuedPolicy from "@/models/IssuedPolicy";
import { findDuplicatePolicy, buildPolicyFromExtraction } from "@/utils/aiPolicyExtractor";

// Agent's "submit this reviewed PDF as a policy" step. Unlike the admin
// equivalent (which creates the policy already visible/active), this always
// lands the policy with createdByAgentId set — adminApprovalStatus defaults
// to "Pending" on IssuedPolicy, so it's hidden from the Customer Dashboard
// and queued in the admin's existing Agent Policies review panel until
// approved/rejected, exactly like a bulk-Excel or manually-created agent
// policy already is.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
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

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Import id is required" });
  }

  await dbConnect();

  try {
    const imp: any = await PolicyImport.findOne({ _id: id, agentId: agent.id });
    if (!imp) {
      return res.status(404).json({ success: false, message: "Import not found" });
    }

    const edits = req.body?.data && typeof req.body.data === "object" ? req.body.data : {};
    const merged = { ...(imp.extracted || {}), ...edits };

    const agentName = agent.fullName || agent.email;

    // Already submitted once — this is an edit + resubmit, only allowed
    // while admin has rejected it (mirrors PUT /api/agent/policies/[id]'s
    // same "only when Rejected" rule for manually/bulk-created policies).
    if (imp.status === "saved") {
      if (!imp.savedPolicyId) {
        return res.status(409).json({ success: false, message: "Submitted policy reference is missing" });
      }
      const existing: any = await IssuedPolicy.findOne({
        _id: imp.savedPolicyId,
        createdByAgentId: agent.id,
      });
      if (!existing) {
        return res.status(404).json({ success: false, message: "Submitted policy not found" });
      }
      if (existing.adminApprovalStatus !== "Rejected") {
        return res.status(403).json({
          success: false,
          message: "Only a rejected submission can be edited and resubmitted",
        });
      }

      const policyFields: any = await buildPolicyFromExtraction(merged, {
        createdBy: agentName,
        importId: String(imp._id),
        createdByAgentId: agent.id,
      });
      delete policyFields.source;
      delete policyFields.createdBy;
      delete policyFields.createdByAgentId;
      delete policyFields.aiImportId;
      delete policyFields.policyDocuments;
      delete policyFields.policyDocumentStatus;

      // Resubmitting resets the review cycle — fresh Pending, remark
      // cleared — exactly like editing a rejected bulk/manual policy does.
      policyFields.adminApprovalStatus = "Pending";
      policyFields.adminApprovalRemark = "";
      policyFields.adminApprovalReviewedBy = "";
      policyFields.adminApprovalReviewedAt = null;

      const policy = await IssuedPolicy.findByIdAndUpdate(imp.savedPolicyId, { $set: policyFields }, { new: true });
      if (!policy) {
        return res.status(404).json({ success: false, message: "Submitted policy not found" });
      }

      imp.extracted = merged;
      imp.confidence = merged.confidence ?? imp.confidence;
      await imp.save();

      return res.status(200).json({ success: true, policy, updated: true });
    }

    const dup = await findDuplicatePolicy(merged);
    if (dup) {
      return res.status(409).json({ success: false, message: "Duplicate policy detected", duplicate: dup });
    }

    const policyFields = await buildPolicyFromExtraction(merged, {
      createdBy: agentName,
      importId: String(imp._id),
      fileData: imp.fileData,
      originalName: imp.originalName,
      createdByAgentId: agent.id,
    });

    const policy = await IssuedPolicy.create(policyFields);

    imp.status = "saved";
    imp.extracted = merged;
    imp.confidence = merged.confidence ?? imp.confidence;
    imp.error = undefined;
    imp.savedPolicyId = policy._id;
    await imp.save();

    return res.status(200).json({ success: true, policy });
  } catch (err: any) {
    console.log("AGENT POLICY IMPORT APPROVE ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
