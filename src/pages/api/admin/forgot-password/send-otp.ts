import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import { GENERIC_OTP_MESSAGE, sendPasswordResetOtp } from "@/lib/passwordResetOtp";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    await dbConnect();

    const admin = await Admin.findOne({ email }).select("userFirstName email accountStatus role");
    if (!admin || (admin.role === "admin" && admin.accountStatus === "inactive")) {
      return res.status(200).json({ message: GENERIC_OTP_MESSAGE });
    }

    const result = await sendPasswordResetOtp("admin", email, admin.userFirstName);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error("Admin forgot-password send OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
