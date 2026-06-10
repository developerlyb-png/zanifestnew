import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import AgentLogin from "@/models/AgentLogin";
import crypto from "crypto";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { userName, email, password } = req.body;

    // ✅ basic validation (existing logic kept)
    if (!userName || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔍 check existing email
    const existingUser = await AgentLogin.findOne({ email });

    if (existingUser) {
      // 🟡 case 1: incomplete signup
      if (existingUser.accountStatus === "INCOMPLETE") {
        const createdAt = new Date(existingUser.createdAt).getTime();
        const now = Date.now();
        const diffSeconds = (now - createdAt) / 1000;

        // ⛔ block before 1 minute
        if (diffSeconds < 60) {
          return res.status(400).json({
            message:
              "You did not complete your previous signup. Please wait 1 minute before trying again.",
          });
        }

        // ✅ after 1 minute → delete old record
        await AgentLogin.deleteOne({ email });
      } else {
        // ⛔ completed account already exists
        return res
          .status(400)
          .json({ message: "Email already registered" });
      }
    }

    // 🔑 generate loginId (existing logic)
    const loginId = crypto.randomBytes(12).toString("hex");

    // ✅ create fresh signup
    const newUser = new AgentLogin({
      name: userName,           // full name
      email,
      password,
      loginId,
      accountStatus: "INCOMPLETE", // important
    });

    await newUser.save();

    return res.status(200).json({ loginId });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
