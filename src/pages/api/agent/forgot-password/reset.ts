import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import {
  clearPasswordResetOtp,
  findAgentByEmail,
  isPasswordResetOtpValid,
} from "@/lib/passwordResetOtp";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const otp = String(req.body?.otp || "").trim();
  const newPassword = String(req.body?.newPassword || "");

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    await dbConnect();

    if (!(await isPasswordResetOtpValid("agent", email, otp))) {
      return res.status(400).json({ message: "OTP is invalid or expired. Please start again." });
    }

    const agent = await findAgentByEmail(email);
    if (!agent) {
      await clearPasswordResetOtp("agent", email);
      return res.status(404).json({ message: "Account not found" });
    }

    // The Agent model has no hashing hook, so hash here. updateOne avoids
    // re-validating unrelated required fields on older agent records.
    const hashed = await bcrypt.hash(newPassword, 10);
    await Agent.updateOne({ _id: agent._id }, { $set: { password: hashed } });

    await clearPasswordResetOtp("agent", email);

    return res.status(200).json({ message: "Password updated successfully. Please login." });
  } catch (error) {
    console.error("Agent forgot-password reset error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
