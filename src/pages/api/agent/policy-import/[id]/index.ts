import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import PolicyImport from "@/models/PolicyImport";
import IssuedPolicy from "@/models/IssuedPolicy";

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

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Import id is required" });
  }

  await dbConnect();

  if (req.method === "DELETE") {
    try {
      const existing = await PolicyImport.findOne({ _id: id, agentId: agent.id });
      if (!existing) {
        return res.status(404).json({ success: false, message: "Import not found" });
      }

      // Once submitted, only a rejected submission can be deleted — same
      // rule as DELETE /api/agent/policies/[id] for manually/bulk-created
      // policies. A Pending or Approved submission stays put.
      if (existing.status === "saved") {
        const policy = existing.savedPolicyId
          ? await IssuedPolicy.findOne({ _id: existing.savedPolicyId, createdByAgentId: agent.id })
          : null;
        if (!policy || policy.adminApprovalStatus !== "Rejected") {
          return res.status(403).json({
            success: false,
            message: "Only a rejected submission can be deleted",
          });
        }
      }

      // Only removes this import record (and the PDF stored on it) — the
      // linked policy (when rejected) is left for the agent's own
      // Pending Policies panel to delete, which is the flow that already
      // exists for that.
      await PolicyImport.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("AGENT POLICY IMPORT DELETE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
