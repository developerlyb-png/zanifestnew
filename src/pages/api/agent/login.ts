import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password } = req.body;

  try {

    await dbConnect();

    const agent = await Agent.findOne({ email });

    if (!agent) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ PASSWORD CHECK (single validation)
    const isValid =
      agent.password === password ||
      bcrypt.compareSync(password, agent.password);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    /* =================================================
       STATUS BASED LOGIN CONTROL
    ================================================= */

    // 🚫 Pending
    if (agent.status === "pending") {
      return res.status(403).json({
        message: "Your application is under review",
      });
    }

    // "reviewed" is what admin/reviewAgent.ts's "accept" action actually sets
    // when an admin approves an application (its own email says "You can now
    // login") — a further "approved" status only exists later, once a
    // certificate already exists (see updateStatus.ts). So "reviewed" must
    // be allowed to log in and go straight to training, not blocked here.

    // Note: an approved agent with no certificate yet is the NORMAL case for
    // a first login — the certificate is only generated after training/exam
    // completion (see complete-training.ts). Login must succeed here so
    // agentpage.tsx's trainingCompleted check can route them to
    // /videolectures instead of being blocked before ever reaching it.

    // 🔁 Rejected → redirect to edit form
    if (agent.status === "rejected") {
      return res.status(200).json({
        redirect: `/createagent?loginId=${agent.loginId}&mode=edit`,
      });
    }

    /* =================================================
       LOGIN SUCCESS
    ================================================= */

    const token = jwt.sign(
      {
        id: agent._id,
        email: agent.email,
        fullName: `${agent.firstName} ${agent.lastName}`,
        role: "agent",
        accountStatus: agent.accountStatus,
        trainingCompleted: agent.trainingCompleted,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    // ⭐ Set cookie
    res.setHeader(
      "Set-Cookie",
      serialize("agentToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      })
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      agent: {
        name: `${agent.firstName} ${agent.lastName}`,
        email: agent.email,
      },
    });

  } catch (err) {

    console.error("Login error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
}
