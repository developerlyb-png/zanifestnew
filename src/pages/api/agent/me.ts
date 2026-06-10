 import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    // Read the token from cookie
    const token = req.cookies.agentToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token found" });
    }

    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Find agent by ID
    const agent = await Agent.findById(decoded.id).select("-password");

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    return res.status(200).json({
      success: true,
      agent,
    });

  } catch (error: any) {
    console.error("Error in /agents/me:", error);

    // Token expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    return res.status(500).json({ message: "Server error" });
  }
}
