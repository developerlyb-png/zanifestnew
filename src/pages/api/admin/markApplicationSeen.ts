// pages/api/admin/markApplicationSeen.ts
// Called when an admin opens an application, so it stops showing as "New".
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import { requireAdminOrAgent } from "@/utils/requireAdminOrAgent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const auth = await requireAdminOrAgent(req);
  if (!auth || auth.role !== "admin") {
    return res.status(401).json({ message: "Not authorized" });
  }

  const { agentId } = req.body || {};
  if (!agentId) {
    return res.status(400).json({ message: "agentId is required" });
  }

  try {
    await dbConnect();

    // timestamps: false so opening an application doesn't change its "last updated" time
    await Agent.updateOne(
      { _id: agentId, adminSeenAt: null },
      { $set: { adminSeenAt: new Date() } },
      { timestamps: false }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("markApplicationSeen error:", err);
    return res.status(500).json({ message: "Failed to update application" });
  }
}
