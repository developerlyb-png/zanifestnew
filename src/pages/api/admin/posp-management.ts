import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import TrainingProgress from "@/models/TrainingProgress";

// "Training Completed" (all 3 video modules watched) and "Assessment
// Completed" (exam passed) are tracked in two different places: module
// watch-time lives in the TrainingProgress collection, while exam-pass is
// Agent.trainingCompleted (only ever set true from complete-training.ts's
// exam-pass branch) — so both are joined here rather than being the same
// flag shown twice.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const agents = await Agent.find({})
      .select("_id firstName lastName email phone city district state pinCode status trainingCompleted createdAt")
      .lean();

    const progressDocs = await TrainingProgress.find({
      agentId: { $in: agents.map((a: any) => a._id) },
    })
      .select("agentId modules")
      .lean();

    const progressByAgentId = new Map(
      progressDocs.map((p: any) => [String(p.agentId), p])
    );

    const rows = agents.map((agent: any) => {
      const progress = progressByAgentId.get(String(agent._id));
      const modulesTrainingCompleted =
        !!progress &&
        Array.isArray(progress.modules) &&
        progress.modules.length > 0 &&
        progress.modules.every((m: any) => m.completed);

      return {
        _id: String(agent._id),
        name: `${agent.firstName || ""} ${agent.lastName || ""}`.trim(),
        email: agent.email || "",
        phone: agent.phone || "",
        address: [agent.city, agent.district, agent.state, agent.pinCode]
          .filter(Boolean)
          .join(", "),
        kycStatus: agent.status || "pending",
        trainingCompleted: modulesTrainingCompleted,
        assessmentCompleted: !!agent.trainingCompleted,
        createdAt: agent.createdAt,
      };
    });

    return res.status(200).json({ success: true, agents: rows });
  } catch (error) {
    console.error("POSP MANAGEMENT ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
