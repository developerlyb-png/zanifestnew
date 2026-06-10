import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import OfficePackagePolicy from "@/models/OfficePackagePolicy";
import User from "@/models/User";
import Agent from "@/models/Agent";
import { verifyToken } from "@/utils/verifyToken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  /* ---------------- ASSIGN LEAD ---------------- */
  if (req.method === "POST" && req.query.assign === "true") {
    try {
      const { policyId, agentId } = req.body;

      if (!policyId || !agentId) {
        return res.status(400).json({ success: false, message: "Missing fields" });
      }

      const agent = await Agent.findById(agentId);
      if (!agent) return res.status(404).json({ success: false, message: "Agent not found" });

      const updated = await OfficePackagePolicy.findByIdAndUpdate(
        policyId,
        {
          assignedAgent: agentId,
          assignedTo: `${agent.firstName} ${agent.lastName}`,
          assignedAt: new Date(),
        },
        { new: true }
      );

      if (!updated)
        return res.status(404).json({ success: false, message: "Policy not found" });

      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /* ---------------- CREATE RECORD ---------------- */
  if (req.method === "POST") {
    let email = req.body.email || null;

    try {
      const token = req.cookies?.userToken;
      if (token) {
        const decoded: any = await verifyToken(token);
        const user = await User.findById(decoded.id).select("email");
        if (user) email = user.email;
      }
    } catch {}

    const data = req.body;

    const created = await OfficePackagePolicy.create({
      companyName: data.companyName,
      mobile: data.mobile,
      email,
      options: data.options,
      pincode: data.pincode,
      firstTimeBuying: data.firstTimeBuying,
      lossHistory: data.lossHistory,
      assignedAgent: null,
      assignedTo: null,
      assignedAt: null,
    });

    return res.status(201).json({ success: true, data: created });
  }

  /* ---------------- GET ALL RECORDS ---------------- */
  if (req.method === "GET") {
    const all = await OfficePackagePolicy.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: all });
  }

  return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
