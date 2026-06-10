import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    console.log("Invalid method:", req.method);
    return res.status(405).json({ message: "Method Not Allowed" });}

  const { userName, email, password } = req.body;
  console.log(req.body);

  if (!userName || !email || !password) {
    console.log("Missing fields:", { userName, email, password });
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    console.log("Connecting to database...");
    await dbConnect();
    console.log("Database connected - in signup.ts");

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
       userName, 
       email, 
       password: hashedPassword });

    await newUser.save();

    return res.status(201).json({ message: "User created", user: { email: newUser.email, userName: newUser.userName } });

  } catch (err) 
  {
    console.log("Signup error:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
