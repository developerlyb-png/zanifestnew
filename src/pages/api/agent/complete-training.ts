import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import Agent from "@/models/Agent";
import dbConnect from "@/lib/dbConnect";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  /* =========================
     AUTH
  ========================= */
  const token = req.cookies.agentToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

  /* =========================
     BODY DATA
  ========================= */
  const { score, total } = req.body;

  if (typeof score !== "number" || typeof total !== "number") {
    return res.status(400).json({ message: "Score & total required" });
  }

  /* =========================
     UPDATE AGENT
  ========================= */
  const agent = await Agent.findByIdAndUpdate(
    decoded.id,
    {
      trainingCompleted: true,
      trainingScore: score,              // 🔥 SAVE SCORE
      trainingTotal: total,              // 🔥 SAVE TOTAL
      trainingCompletedAt: new Date(),   // 🔥 SAVE DATE
    },
    { new: true }
  );

  if (!agent) {
    return res.status(404).json({ message: "Agent not found" });
  }

  /* =========================
     ISSUE NEW JWT
  ========================= */
  const newToken = jwt.sign(
    {
      id: agent._id,
      email: agent.email,
      role: "agent",
      accountStatus: agent.accountStatus,
      trainingCompleted: true, // 🔥 dashboard access
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );

  res.setHeader(
    "Set-Cookie",
    `agentToken=${newToken}; Path=/; HttpOnly; SameSite=Lax`
  );

  return res.status(200).json({
    success: true,
    score: agent.trainingScore,
    total: agent.trainingTotal,
  });
}
