import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect"; // adjust path if needed
import Admin from "@/models/Admin"; // adjust path if needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await dbConnect();

    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log("Admin not found with email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordMatch) {
      console.log("Current password mismatch for admin:", email);
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    // console.log("New password hashed successfully for admin:", email);

    admin.password = newPassword;
    console.log("Password reset successful for admin:", email);

    await admin.save();

    return res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}