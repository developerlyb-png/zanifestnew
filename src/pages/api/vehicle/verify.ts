import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRC } from "@/lib/cashfree";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  console.log("========================================");
  console.log("📥 Incoming RC Verify API Request");
  console.log("Method:", req.method);
  console.log("Request Body:", req.body);
  console.log("========================================");

  if (req.method !== "POST")
    return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { registration_number } = req.body;

    if (!registration_number) {
      return res.status(400).json({
        status: "FAILED",
        message: "Registration number required"
      });
    }

    console.log("🔎 Checking RC for:", registration_number);

    const response = await verifyRC(registration_number);

    return res.status(200).json({
      status: "SUCCESS",
      data: response.data?.data || response.data,
    });

  } catch (err: any) {
    console.log("❌ ERROR IN BACKEND:", err?.response?.data);

    return res.status(500).json({
      status: "FAILED",
      message: err?.response?.data?.message || "RTO lookup failed",
      error: err?.response?.data || err,
    });
  }
}
