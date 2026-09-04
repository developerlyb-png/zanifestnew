import type { NextApiRequest, NextApiResponse } from "next";
import { generateAgentCertificate } from "@/lib/generateAgentCertificate";

// Admin's manual "Generate Certificate" button (src/components/superadminsidebar/showresult.tsx)
// — kept as a manual override/regenerate path. Automatic generation on exam
// pass now happens via the same shared logic in src/pages/api/agent/complete-training.ts.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { agentId } = req.body;
    if (!agentId) {
      return res.status(400).json({ message: "Agent ID required" });
    }

    const { url } = await generateAgentCertificate(agentId);

    return res.status(200).json({ success: true, url });
  } catch (error: any) {
    console.error("CREATE CERTIFICATE ERROR:", error);
    if (error?.message === "Agent not found") {
      return res.status(404).json({ message: "Agent not found" });
    }
    return res.status(500).json({ message: "Server Error" });
  }
}
