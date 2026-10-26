import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import { verifyPasswordResetOtp } from "@/lib/passwordResetOtp";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const otp = String(req.body?.otp || "").trim();

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    await dbConnect();

    const result = await verifyPasswordResetOtp("admin", email, otp);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error("Admin forgot-password verify OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
