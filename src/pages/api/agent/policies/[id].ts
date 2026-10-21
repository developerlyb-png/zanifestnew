import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Deliberately agentToken-only, same as /api/agent/policies — an agent
  // must never be able to touch another agent's (or the admin's) policies.
  const agent = await requireAgent(req);
  if (!agent) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Policy id is required" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const policy = await IssuedPolicy.findOne({ _id: id, createdByAgentId: agent.id });
      if (!policy) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }
      return res.status(200).json({ success: true, policy });
    } catch (err: any) {
      console.log("AGENT POLICY GET ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PATCH") {
    try {
      const fileData = String(req.body?.fileData || "");
      const fileName = String(req.body?.fileName || "");

      if (!fileData || !fileName) {
        return res.status(400).json({ success: false, message: "File is required" });
      }
      if (!fileData.startsWith("data:application/pdf")) {
        return res.status(400).json({ success: false, message: "Only PDF files are allowed" });
      }

      const policy = await IssuedPolicy.findOneAndUpdate(
        { _id: id, createdByAgentId: agent.id },
        {
          $push: { policyDocuments: { data: fileData, fileName } },
          $set: { policyDocumentStatus: "Received" },
        },
        { new: true }
      );

      if (!policy) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }

      return res.status(200).json({ success: true, policy });
    } catch (err: any) {
      console.log("AGENT POLICY DOCUMENT UPLOAD ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const existing = await IssuedPolicy.findOne({ _id: id, createdByAgentId: agent.id });
      if (!existing) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }
      if (existing.adminApprovalStatus !== "Rejected") {
        return res.status(400).json({
          success: false,
          message: "Only rejected policies can be edited and resubmitted",
        });
      }

      const fields = req.body?.fields && typeof req.body.fields === "object" ? req.body.fields : {};

      const EDITABLE_TOP_FIELDS = [
        "policyNumber",
        "insurer",
        "lineOfBusiness",
        "product",
        "policyTypeStructure",
        "transactionType",
        "premium",
        "grossPremium",
        "subInsured",
        "policyRemark",
      ];
      const NUMERIC_FIELDS = ["premium", "grossPremium"];
      const EDITABLE_CUSTOMER_FIELDS = ["fullName", "email", "mobile", "address"];

      const update: Record<string, any> = {};

      for (const key of EDITABLE_TOP_FIELDS) {
        if (fields[key] === undefined) continue;
        update[key] = NUMERIC_FIELDS.includes(key) ? Number(fields[key]) || 0 : String(fields[key]).trim();
      }
      if (update.lineOfBusiness) update.policyType = update.lineOfBusiness;

      if (fields.startDate) {
        const d = new Date(fields.startDate);
        if (!Number.isNaN(d.getTime())) update.startDate = d;
      }
      if (fields.endDate) {
        const d = new Date(fields.endDate);
        if (!Number.isNaN(d.getTime())) update.endDate = d;
      }

      if (fields.customer && typeof fields.customer === "object") {
        for (const key of EDITABLE_CUSTOMER_FIELDS) {
          if (fields.customer[key] !== undefined) {
            update[`customer.${key}`] = String(fields.customer[key]).trim();
          }
        }
      }

      // Resubmitting always resets the review cycle — clear the old
      // rejection so it goes back into the admin's queue as a fresh Pending
      // item rather than looking like a still-open rejection.
      update.adminApprovalStatus = "Pending";
      update.adminApprovalRemark = "";
      update.adminApprovalReviewedBy = "";
      update.adminApprovalReviewedAt = null;

      const policy = await IssuedPolicy.findOneAndUpdate(
        { _id: id, createdByAgentId: agent.id },
        { $set: update },
        { new: true }
      );

      return res.status(200).json({ success: true, policy });
    } catch (err: any) {
      console.log("AGENT POLICY EDIT/RESUBMIT ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const existing = await IssuedPolicy.findOne({ _id: id, createdByAgentId: agent.id });
      if (!existing) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }
      if (existing.adminApprovalStatus !== "Rejected") {
        return res.status(400).json({
          success: false,
          message: "Only rejected policies can be deleted from here",
        });
      }

      await IssuedPolicy.deleteOne({ _id: id, createdByAgentId: agent.id });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("AGENT POLICY DELETE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
