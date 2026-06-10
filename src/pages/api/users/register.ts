import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, email, password } = req.body;

  // DB Connection
  await dbConnect();

  // Check existing email
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already exists" });
  }

  // Hash password
  const hashed = await bcrypt.hash(password, 10);

  // Create user
  const newUser = await User.create({
    userName: username,
    email,
    password: hashed,
  });

  return res.status(200).json({
    email: newUser.email,
    message: "Registration successful",
  });
}
