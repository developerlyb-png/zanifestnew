import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method Not Allowed" });

  try {
    await dbConnect();

    /** ✅ Read JWT from cookie or Authorization header */
    const token =
      req.cookies.userToken ||             // ✅ Correct cookie name
      req.headers.authorization?.replace("Bearer ", "");

    console.log("📌 TOKEN RECEIVED:", token);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // @ts-ignore
    const userId = decoded.id;

    const { aadhaar_number, name, dob } = req.body;

    if (!aadhaar_number) {
      return res.status(400).json({ message: "Missing Aadhaar Number" });
    }

    const last4 = aadhaar_number.slice(-4);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          aadhaarKyc: {
            aadhaarLast4: last4,
            name,
            dob,
            verified: true,
            verifiedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "✅ Aadhaar saved successfully", user: updatedUser });
  } catch (err: any) {
    console.log("❌ SAVE AADHAAR ERROR:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
