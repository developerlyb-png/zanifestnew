import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import DoctorInsurance from "@/models/Doctor";
import Agent from "@/models/Agent";
import User from "@/models/User";
import { verifyToken } from "@/utils/verifyToken";

const MONGODB_URI = process.env.MONGODB_URI || "";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  let email = null;

  // ---------------- AUTH EMAIL (SAFE) ----------------
  try {
    const token = req.cookies?.userToken;
    if (token) {
      const decoded: any = await verifyToken(token);
      if (decoded?.id) {
        const user = await User.findById(decoded.id).select("email");
        if (user) email = user.email;
      }
    }
  } catch (err) {
    console.log("Email fetch failed:", err);
  }

  // ===================================================
  // ASSIGN AGENT (POST ?assign=true)  ✅ FIX
  // ===================================================
  if (req.method === "POST" && req.query.assign === "true") {
    try {
      const { policyId, agentId } = req.body;

      if (!policyId || !agentId) {
        return res.status(400).json({
          success: false,
          message: "policyId and agentId required",
        });
      }

      const agent = await Agent.findById(agentId);
      if (!agent) {
        return res.status(400).json({
          success: false,
          message: "Agent not found",
        });
      }

      const updated = await DoctorInsurance.findByIdAndUpdate(
        policyId,
        {
          assignedAgent: agent._id,
          assignedTo: `${agent.firstName} ${agent.lastName}`,
          assignedAt: new Date(),
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Doctor record not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Assigned successfully",
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  // ===================================================
  // CREATE RECORD (POST)
  // ===================================================
  if (req.method === "POST") {
    try {
      const newRecord = await DoctorInsurance.create({
        ...req.body,
        email,
      });

      return res.status(201).json({
        success: true,
        data: newRecord,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  // ===================================================
  // UPDATE RECORD (PUT)
  // ===================================================
  if (req.method === "PUT") {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Missing ID",
        });
      }

      const updated = await DoctorInsurance.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  // ===================================================
  // GET ALL
  // ===================================================
  if (req.method === "GET") {
    const list = await DoctorInsurance.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: list });
  }

  return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed`,
  });
}
