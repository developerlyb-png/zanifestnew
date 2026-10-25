// pages/api/admin/agentApplications.ts
// Review Application dashboard: every agent application (without the heavy
// base64 document fields) plus status counts.
// GET ?countOnly=1 returns just the counts (used by the sidebar badge).
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import { requireAdminOrAgent } from "@/utils/requireAdminOrAgent";

const LIST_FIELDS =
  "firstName lastName email phone agentCode city district state status assignedTo " +
  "trainingCompleted rejectionRemark adminSeenAt createdAt updatedAt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const auth = await requireAdminOrAgent(req);
  if (!auth || auth.role !== "admin") {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    await dbConnect();

    const [pending, newCount, approved, rejected, total] = await Promise.all([
      Agent.countDocuments({ status: "pending" }),
      Agent.countDocuments({ status: "pending", adminSeenAt: null }),
      Agent.countDocuments({ status: { $in: ["reviewed", "approved"] } }),
      Agent.countDocuments({ status: "rejected" }),
      Agent.countDocuments({}),
    ]);
    const counts = { total, new: newCount, pending, approved, rejected };

    if (req.query.countOnly) {
      return res.status(200).json({ counts });
    }

    const applications = await Agent.find({})
      .select(LIST_FIELDS)
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({ counts, applications });
  } catch (err) {
    console.error("agentApplications error:", err);
    return res.status(500).json({ message: "Failed to load applications" });
  }
}
