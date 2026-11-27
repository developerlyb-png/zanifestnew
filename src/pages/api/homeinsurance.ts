import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import HomeInsurance from "@/models/Homeinsurance";
import User from "@/models/User";
import Agent from "@/models/Agent";
import { verifyToken } from "@/utils/verifyToken";
import { friendlyMessage, errorStatus } from "@/utils/friendlyError";
import { getSellingAgent, agentLeadFields } from "@/lib/agentAttribution";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  let email = null;

  const token = req.cookies?.userToken;
  if (token) {
    const decoded: any = await verifyToken(token);
    if (decoded?.id) {
      const user = await User.findById(decoded.id).select("email");
      if (user) email = user.email;
    }
  }

  // ⭐ ASSIGN LOGIC
  if (req.method === "POST" && req.query.assign === "true") {
    try {
      const { recordId, agentId } = req.body;

      const agent = await Agent.findById(agentId).select("email");
      if (!agent)
        return res.status(404).json({ success: false, message: "Agent not found" });

      const updated = await HomeInsurance.findByIdAndUpdate(
        recordId,
        {
          assignedAgent: agentId,
          assignedTo: agent.email,
          assignedAt: new Date(),
        },
        { new: true }
      );

      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(errorStatus(err, 500)).json({ success: false, error: friendlyMessage(err) });
    }
  }

  // ⭐ CREATE NEW RECORD
  if (req.method === "POST") {
    try {
      const sellingAgent = await getSellingAgent(req);
      const newRecord = await HomeInsurance.create({
        ...req.body,
        email,
        assignedTo: null,
        assignedAgent: null,
        // Enquiry raised by an agent from the agent portal -> straight into their Lead tab.
        assignedAt: null,
        ...(sellingAgent ? agentLeadFields(sellingAgent) : {}),
      });

      return res.status(201).json({ success: true, data: newRecord });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: friendlyMessage(err) });
    }
  }

  // ⭐ GET LIST
  if (req.method === "GET") {
    const records = await HomeInsurance.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: records });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
