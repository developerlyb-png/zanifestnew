// pages/api/auth/fetchLogin.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import AgentLogin from "@/models/AgentLogin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();

    const loginId = req.query.loginId as string;
    if (!loginId) return res.status(400).json({ error: "Missing loginId" });

    const record = await AgentLogin.findOne({ loginId });
    if (!record) return res.status(404).json({ error: "Record not found" });

    return res.status(200).json({
      name: record.name,
      email: record.email,
      password: record.password,
    });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
