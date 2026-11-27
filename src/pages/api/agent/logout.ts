import { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Set-Cookie", [
    serialize("agentToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    }),
    // Also end "agent selling" mode (set by the agent portal's Buy Insurance
    // tab) so the next person on this browser isn't shown as selling for them.
    serialize("agentSellMode", "", { path: "/", sameSite: "lax", expires: new Date(0) }),
  ]);
  console.log("Agent logged out successfully");
  res.status(200).json({ message: "Logged out successfully" });
}
