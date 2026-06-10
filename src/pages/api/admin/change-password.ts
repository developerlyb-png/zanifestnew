import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Manager from "@/models/Manager";
import Agent from "@/models/Agent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, newPassword } = req.body;
  console.log("Change password API called:", req.body);

  if (!email || !newPassword) {
    return res.status(400).json({ message: "Email and new password are required." });
  }

  try {
    await dbConnect();

    const person = (await Agent.findOne({ email })) || (await Manager.findOne({email})) ;

    if (!person) {
      console.log("Admin/Agent/Manager not found with email:", email);
      return res.status(404).json({ message: "Admin/Agent/Manager not found." });
    }

    person.password = newPassword;
    await person.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } 
  
  catch (error) {
    console.error("Password change error:", error);
    return res.status(500).json({ message: "Server error. Try again later." });
  }
}