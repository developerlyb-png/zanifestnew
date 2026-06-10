import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { loginId } = req.query;
    if (!loginId || typeof loginId !== "string") {
      return res.status(400).json({ error: "Missing loginId" });
    }

    const agent = await Agent.findOne({ loginId }).lean();
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    return res.status(200).json({ agent });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
