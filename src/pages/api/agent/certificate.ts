import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import { generateAgentCertificate } from "@/lib/generateAgentCertificate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method !== "GET") return res.status(405).end();

  await dbConnect();

  try {

    const token = req.cookies.agentToken;
    if (!token) {
      return res.status(401).json({ success:false, message:"Unauthorized" });
    }

    let decoded:any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return res.status(401).json({ success:false, message:"Invalid token" });
    }

    const agent = await Agent.findById(decoded.id).select(
      "firstName lastName agentCode certificate2 status trainingCompleted"
    );

    if (!agent) {
      return res.status(404).json({ success:false, message:"Agent not found" });
    }

    // Self-heal: the agent already passed their exam (trainingCompleted) but
    // for some reason no certificate was saved yet — e.g. the auto-generation
    // at pass-time hit a transient error. Rather than leave them permanently
    // stuck on "not generated yet" with no way to retry, generate it right
    // here the moment they check for it.
    if (!agent.certificate2 && agent.trainingCompleted) {
      try {
        const cert = await generateAgentCertificate(String(agent._id));
        agent.certificate2 = cert.url;
        agent.agentCode = cert.agentCode;
      } catch (err) {
        console.error("ON-DEMAND CERTIFICATE GENERATION ERROR:", err);
      }
    }

    if (!agent.certificate2) {
      return res.json({
        success:false,
        message:"Certificate not generated yet"
      });
    }

    return res.json({
      success:true,
      agentName:`${agent.firstName} ${agent.lastName}`,
      agentCode:agent.agentCode,
      certificate:agent.certificate2
    });

  } catch (error) {

    console.error("CERTIFICATE API ERROR:", error);

    return res.status(500).json({
      success:false,
      message:"Server error"
    });
  }
}
