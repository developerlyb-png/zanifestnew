import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Only GET" });
  }

  try {
    const token = req.cookies.userToken;
    if (!token) {
      return res.status(200).json({ success: true, policies: [] });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    await dbConnect();

    const policies = await IssuedPolicy.find({ userId: decoded.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ success: true, policies });
  } catch (err: any) {
    console.log("MY POLICIES ERROR", err);
    return res.status(200).json({ success: true, policies: [] });
  }
}
