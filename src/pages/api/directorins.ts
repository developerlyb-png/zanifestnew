import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Director from "@/models/Director";
import User from "@/models/User";
import { verifyToken } from "@/utils/verifyToken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  try {
    // ================= SAVE DIRECTOR =================
    if (req.method === "POST") {
      let email = req.body.email || null;
      let isGuest = true;

      const token = req.cookies?.userToken;

      if (token) {
        const decoded: any = await verifyToken(token);
        if (decoded?.id) {
          const user = await User.findById(decoded.id).select("email");
          if (user) {
            email = user.email;
            isGuest = false;
          }
        }
      }

      const saved = await Director.create({
        ...req.body,
        email,
        isGuest,
      });

      return res.status(201).json({ success: true, data: saved });
    }

    // ================= ASSIGN AGENT =================
   if (req.method === "POST") {
  let email: string | null = null;
  let isGuest = true;

  const token = req.cookies?.userToken;

  if (token) {
    try {
      const decoded: any = await verifyToken(token);
      if (decoded?.id) {
        const user = await User.findById(decoded.id).select("email");
        if (user) {
          email = user.email;     // ✅ LOGIN EMAIL
          isGuest = false;
        }
      }
    } catch {
      console.log("Token verify failed");
    }
  }

  const payload = {
    ...req.body,
    email,
    isGuest,
  };

  const saved = await Director.create(payload);

  return res.status(201).json({
    success: true,
    data: saved,
  });
}
if (req.method === "PUT") {
  const {
    directorId,
    email,
    agentId,
    agentName,
  } = req.body;

  // 🔹 CASE 1: AGENT ASSIGN
  if (directorId && agentId) {
    const updated = await Director.findByIdAndUpdate(
      directorId,
      {
        assignedAgentId: agentId,
        assignedAgentName: agentName,
        assignedAt: new Date(),
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Agent assigned successfully",
      data: updated,
    });
  }

  // 🔹 CASE 2: EMAIL UPDATE AFTER LOGIN
  if (directorId && email) {
    const updated = await Director.findByIdAndUpdate(
      directorId,
      {
        email,
        isGuest: false,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: updated,
    });
  }

  return res.status(400).json({
    success: false,
    message: "Invalid PUT payload",
  });
}

    // ================= LIST =================
    if (req.method === "GET") {
      const list = await Director.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: list });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    res.status(405).end();
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
