import Policy from "@/models/Policy";
import { getAgentFromReq } from "@/utils/getAgentFromReq";
import connectDB from "@/lib/dbConnect";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const agent = await getAgentFromReq(req);
  if (!agent) {
    return res.status(401).json({ success: false });
  }

  await connectDB();

  const policies = await Policy.find({
    agentId: agent._id, 
    verified: true,
  }).sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: policies,
  });
 

} 

