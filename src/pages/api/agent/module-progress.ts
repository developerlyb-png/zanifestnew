import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import TrainingProgress from "@/models/TrainingProgress";
import { MODULE_SECONDS } from "@/constants/moduleTraining";

const MAX_DELTA_PER_HEARTBEAT = 120; // guard against runaway/bogus deltas

function shapeResponse(doc: any) {
  const modules = doc.modules;
  return {
    success: true,
    modules,
    currentModule: doc.currentModule,
    allModulesComplete: modules.every((m: any) => m.completed),
    moduleSeconds: MODULE_SECONDS,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const token = req.cookies.agentToken;
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  if (req.method === "GET") {
    const doc = await TrainingProgress.findOneAndUpdate(
      { agentId: decoded.id },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json(shapeResponse(doc));
  }

  if (req.method === "POST") {
    const deltaSeconds = Math.max(0, Math.min(Number(req.body?.deltaSeconds) || 0, MAX_DELTA_PER_HEARTBEAT));

    const doc = await TrainingProgress.findOneAndUpdate(
      { agentId: decoded.id },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const idx = doc.currentModule - 1;
    if (idx >= 0 && idx < doc.modules.length && !doc.modules[idx].completed) {
      doc.modules[idx].secondsSpent = Math.min(doc.modules[idx].secondsSpent + deltaSeconds, MODULE_SECONDS);

      if (doc.modules[idx].secondsSpent >= MODULE_SECONDS) {
        doc.modules[idx].completed = true;
        doc.modules[idx].completedAt = new Date();
        if (doc.currentModule < 3) {
          doc.currentModule += 1;
        }
      }

      await doc.save();
    }

    return res.status(200).json(shapeResponse(doc));
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
