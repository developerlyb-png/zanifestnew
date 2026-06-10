import jwt from "jsonwebtoken";
import Agent from "@/models/Agent";
import connectDB from "@/lib/dbConnect";
import { NextApiRequest } from "next";

export async function getAgentFromReq(req: NextApiRequest) {
  await connectDB();

  const token = req.cookies.agentToken;
  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    return await Agent.findById(decoded.id).select("_id");
  } catch {
    return null;
  }
}
