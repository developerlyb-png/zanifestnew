import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body;

  await dbConnect();

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Compare password
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Create JWT token
  const token = jwt.sign(
    { id: user._id, email: user.email, userName: user.userName },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );

  // Set cookie
  res.setHeader(
    "Set-Cookie",
    serialize("userToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    })
  );

  // Successful response
  return res.status(200).json({
    email: user.email,
    name: user.userName || "",
    message: "Login successful",
  });
}
