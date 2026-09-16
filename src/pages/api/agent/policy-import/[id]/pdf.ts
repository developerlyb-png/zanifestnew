import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import PolicyImport from "@/models/PolicyImport";

async function requireAgent(req: NextApiRequest) {
  const token = req.cookies["agentToken"];
  const data = token ? await verifyToken(token) : null;

  if (!data || typeof data !== "object" || (data as any).role !== "agent") {
    return null;
  }
  return data as any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const agent = await requireAgent(req);
  if (!agent) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Import id is required" });
  }

  await dbConnect();

  try {
    const imp = await PolicyImport.findOne({ _id: id, agentId: agent.id }, { fileData: 1 });
    if (!imp) {
      return res.status(404).json({ success: false, message: "Import not found" });
    }
    return res.status(200).json({ success: true, fileData: imp.fileData });
  } catch (err: any) {
    console.log("AGENT POLICY IMPORT PDF ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
