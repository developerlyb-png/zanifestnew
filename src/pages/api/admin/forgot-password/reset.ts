import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import { clearPasswordResetOtp, isPasswordResetOtpValid } from "@/lib/passwordResetOtp";

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

    if (!(await isPasswordResetOtpValid("admin", email, otp))) {
      return res.status(400).json({ message: "OTP is invalid or expired. Please start again." });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      await clearPasswordResetOtp("admin", email);
      return res.status(404).json({ message: "Account not found" });
    }

    // Plain password is hashed by the Admin model's pre-save hook
    admin.password = newPassword;
    await admin.save();

    await clearPasswordResetOtp("admin", email);

    return res.status(200).json({ message: "Password updated successfully. Please login." });
  } catch (error) {
    console.error("Admin forgot-password reset error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
