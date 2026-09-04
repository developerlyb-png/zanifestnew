import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import TrainingProgress from "@/models/TrainingProgress";
import { MODULE_SECONDS } from "@/constants/moduleTraining";

const MAX_DELTA_PER_HEARTBEAT = 120; // guard against runaway/bogus deltas

// Advances the current module using real wall-clock time since it started,
// not just accumulated heartbeat deltas — so progress never pauses for tab
// switches, and keeps advancing even if the agent closes the browser or
// logs out entirely mid-module and comes back later.
function applyWallClock(doc: any) {
  const idx = doc.currentModule - 1;
  if (idx < 0 || idx >= doc.modules.length || doc.modules[idx].completed) return;

  const mod = doc.modules[idx];
  const now = new Date();
  if (!mod.startedAt) {
    mod.startedAt = now;
    return;
  }

  const wallSeconds = Math.floor((now.getTime() - new Date(mod.startedAt).getTime()) / 1000);
  mod.secondsSpent = Math.min(Math.max(mod.secondsSpent, wallSeconds), MODULE_SECONDS);

  if (mod.secondsSpent >= MODULE_SECONDS) {
    mod.completed = true;
    mod.completedAt = now;
    if (doc.currentModule < 3) {
      doc.currentModule += 1;
      // Next module's clock starts fresh the next time this runs, not now —
      // startedAt stays null until it's actually reached.
    }
  }
}

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
    // Catch up on wall-clock time even if no heartbeat ever ran (e.g. the
    // agent logged out mid-module and this GET is the first thing to run
    // when they come back), and start the clock on this module if it's the
    // very first time it's being loaded.
    applyWallClock(doc);
    await doc.save();
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
      // Reconcile against real elapsed time too, in case it's raced ahead of
      // the heartbeat-accumulated total (missed heartbeats, throttled tab).
      applyWallClock(doc);
      await doc.save();
    }

    return res.status(200).json(shapeResponse(doc));
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
