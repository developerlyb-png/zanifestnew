import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method !== "POST") {
    return res.status(405).json({ success:false });
  }

  try {

    await dbConnect();

    const { id, status } = req.body;

    if (!id) {
      return res.status(400).json({
        success:false,
        message:"Agent ID missing"
      });
    }

    const agent = await Agent.findById(id);

    if (!agent) {
      return res.status(404).json({
        success:false,
        message:"Agent not found"
      });
    }

    let updateData:any = {};

    // REVIEWED
    if (status === "reviewed") {
      updateData.status = "reviewed";
    }

    // APPROVED
    if (status === "approved") {

      if (!agent.certificate2) {
        return res.status(400).json({
          success:false,
          message:"Generate certificate before approval"
        });
      }

      updateData.status = "approved";

      // fallback agent code generator
      if (!agent.agentCode) {

      // Find last ZIP agent
// Find last ZIP agent
const lastAgent = await Agent.findOne({
  agentCode: { $regex: /^ZIP\d+$/ }
})
.sort({ createdAt: -1 })   // safer than string sort
.select("agentCode");

let nextNumber = 1309; // default start

if (lastAgent?.agentCode) {
  const num = parseInt(lastAgent.agentCode.replace("ZIP", ""), 10);
  if (!isNaN(num)) {
    nextNumber = num + 1;
  }
}

// Generate ZIP format
updateData.agentCode = `ZIP${nextNumber}`;
      }
    }

    // REJECT
    if (status === "rejected") {
      updateData.status = "rejected";
    }

    const updated = await Agent.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new:true }
    );

    return res.status(200).json({
      success:true,
      data: updated
    });

  } catch (error:any) {

    console.log("❌ STATUS UPDATE ERROR:", error);

    return res.status(500).json({
      success:false,
      message:error.message
    });
  }
}
