import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.adminToken;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // This endpoint only ever edits the logged-in admin's own profile —
    // the target is derived from the token, never from the request body.
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const { userFirstName, userLastName, email, password, role } = req.body;

    if (userFirstName !== undefined) admin.userFirstName = String(userFirstName).trim();
    if (userLastName !== undefined) admin.userLastName = String(userLastName).trim();
    if (email !== undefined) admin.email = String(email).trim().toLowerCase();
    if (password) admin.password = password; // hashed by the Admin model's pre-save hook

    // Only someone who is already a superadmin can change their own role —
    // a plain admin's request to self-promote is silently ignored here even
    // if the UI that sent it was tampered with.
    if (role !== undefined && admin.role === "superadmin") {
      admin.role = role === "superadmin" ? "superadmin" : "admin";
    }

    await admin.save();

    const updated = admin.toObject();
    delete updated.password;

    return res.status(200).json({ message: "Profile updated successfully", admin: updated });
  } catch (error) {
    console.error("PATCH /api/admin/updateadmin Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
