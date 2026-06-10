import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import Agent from "@/models/Agent";
import dbConnect from "@/lib/dbConnect";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") return res.status(405).end();

  await dbConnect();

  try {

    const token = req.cookies.agentToken;
    if (!token) return res.status(401).json({ passed: false });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const agent = await Agent.findById(decoded.id).select(
      "firstName lastName agentCode certificate2 trainingCompleted trainingScore trainingTotal trainingCompletedAt status"
    );

    if (!agent) {
      return res.status(404).json({ passed: false });
    }

    // ⭐ allow if certificate exists OR approved
    if (!agent.certificate2 && agent.status !== "approved") {
      return res.json({
        passed: false,
        message: "Certificate not available yet"
      });
    }

    return res.json({
      passed: true,
      agentName: `${agent.firstName} ${agent.lastName}`,
      agentCode: agent.agentCode,
      certificate: agent.certificate2 || null,
      score: agent.trainingScore,
      total: agent.trainingTotal,
      completedAt: agent.trainingCompletedAt,
    });

  } catch (error) {

    console.error("CERT CHECK ERROR:", error);

    return res.status(500).json({
      passed:false,
      message:"Server error"
    });
  }
}
