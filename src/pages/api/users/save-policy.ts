import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST" });
  }

  try {
    const token = req.cookies.userToken;
    if (!token) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const { policyNumber, premium, vehicle, customer } = req.body;

    await dbConnect();

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const policy = await IssuedPolicy.create({
      policyNumber,
      premium,
      vehicle,
      customer,
      userId: decoded.id,
      userEmail: decoded.email,
      policyType: "Car Insurance",
      insurer: "Zuno General Insurance",
      status: "Active",
      startDate,
      endDate,
    });

    return res.status(200).json({ success: true, policy });
  } catch (err: any) {
    console.log("SAVE POLICY ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
