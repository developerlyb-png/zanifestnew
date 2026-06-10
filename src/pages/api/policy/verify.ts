import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/dbConnect";
import Policy from "@/models/Policy";
import { getAgentFromReq } from "@/utils/getAgentFromReq";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // 🔐 Get logged-in agent
    const agent = await getAgentFromReq(req);
    if (!agent) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await connectDB();

    // ✅ IMPORTANT: destructure pdfUrl also
    const {
      policyNo,
      insuredName,
      companyName,
      amount,
      expiryDate,
      pdfUrl, // ✅ THIS FIXES YOUR ERROR
    } = req.body;

    if (!policyNo) {
      return res.status(400).json({
        success: false,
        message: "Policy number is required",
      });
    }

    // 🔴 Duplicate check (same agent + same policy)
    const alreadyExists = await Policy.findOne({
      policyNo,
      agentId: agent._id,
    });

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Policy already exists for this agent",
      });
    }

    // ✅ Save policy (pdfUrl + assignedAt included)
    const policy = await Policy.create({
      agentId: agent._id,
      policyNo,
      insuredName,
      companyName,
      amount,
      expiryDate,
      pdfUrl: pdfUrl || null, // ✅ SAFE
      assignedAt: new Date(),
      verified: true,
    });

    return res.status(200).json({
      success: true,
      policy,
    });
  } catch (error) {
    console.error("VERIFY POLICY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}
