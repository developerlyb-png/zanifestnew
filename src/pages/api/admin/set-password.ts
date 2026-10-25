import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

// Reset Password from the admin panel profile menu: the admin is already
// logged in, so no current password or OTP is needed — just a new password.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const cookies = parse(req.headers.cookie || "");
    const token = cookies.adminToken;
    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required." });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    // The target is always the logged-in admin's own account, taken from the
    // auth cookie — never from the request body.
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    admin.password = newPassword; // hashed by the Admin model's pre-save hook
    await admin.save();

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Set password error:", error);
    return res.status(500).json({ message: "Server error. Try again later." });
  }
}
