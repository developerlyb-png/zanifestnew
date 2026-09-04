import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import Agent from "@/models/Agent";
import dbConnect from "@/lib/dbConnect";
import { generateAgentCertificate } from "@/lib/generateAgentCertificate";

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

  if (typeof score !== "number" || typeof total !== "number" || total <= 0) {
    return res.status(400).json({ message: "Score & total required" });
  }

  // The client only calls this from the exam's pass branch today, but
  // nothing previously stopped a modified client from calling it with a
  // failing score — trainingCompleted (and now certificate generation) must
  // never be granted without the server independently checking the same
  // 40% threshold the exam UI itself uses.
  const passed = score >= total * 0.4;
  if (!passed) {
    return res.status(400).json({
      success: false,
      message: "Score does not meet the passing threshold",
    });
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

  // Auto-generate the POS appointment-letter certificate right away — the
  // agent shouldn't have to wait on an admin to manually click "Generate
  // Certificate" before they can download it from their own dashboard.
  let certificateUrl: string | null = null;
  let agentCode: string | null = null;
  try {
    const cert = await generateAgentCertificate(String(agent._id));
    certificateUrl = cert.url;
    agentCode = cert.agentCode;
  } catch (err) {
    // Don't fail the whole training-completion response over a PDF-render
    // hiccup — the admin's manual "Generate Certificate" button still works
    // as a fallback, and the agent dashboard will just show "not generated
    // yet" until it's retried.
    console.error("AUTO CERTIFICATE GENERATION ERROR:", err);
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
    certificate: certificateUrl,
    agentCode,
  });
}
