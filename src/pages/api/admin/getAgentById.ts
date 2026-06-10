// pages/api/admin/getAgentById.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    const id = req.query.id as string;
    const agent = await Agent.findById(id);
    return res.status(200).json(agent);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load agent" });
  }
}
