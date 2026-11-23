import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import { generateAgentCertificate } from "@/lib/generateAgentCertificate";
import { friendlyMessage, errorStatus } from "@/utils/friendlyError";

// Admin "Regenerate Certificate" — for when an agent's IRDAI POSP code
// (agentCode) has been corrected after their certificate was already made.
// The saved certificate is a PDF with the code printed into it, so it never
// picks up the change on its own. generateAgentCertificate() re-reads the
// agent fresh from the DB, keeps the *current* agentCode (it only creates
// one when the field is empty), redraws the PDF and overwrites the stored
// certificate — so the agent's own download gets the new one too.
async function requireAdmin(req: NextApiRequest) {
  const token = req.cookies["adminToken"];
  const data = token ? await verifyToken(token) : null;
  if (
    !data ||
    typeof data !== "object" ||
    !("role" in data) ||
    !["superadmin", "admin"].includes((data as any).role)
  ) {
    return null;
  }
  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    const agentId = String(req.body?.agentId || "").trim();
    if (!agentId) return res.status(400).json({ success: false, message: "Agent ID is required" });

    await dbConnect();
    const agent: any = await Agent.findById(agentId).select("agentCode firstName lastName").lean();
    if (!agent) return res.status(404).json({ success: false, message: "Agent not found" });

    const previousCode = agent.agentCode || null;
    const { url, agentCode } = await generateAgentCertificate(agentId);

    return res.status(200).json({ success: true, url, agentCode, previousCode });
  } catch (err: any) {
    console.error("REGENERATE CERTIFICATE ERROR:", err);
    return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
  }
}
