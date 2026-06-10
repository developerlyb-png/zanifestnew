import { NextApiRequest, NextApiResponse } from "next";
import cookie, { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Set-Cookie", serialize("userToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  }));

  res.status(200).json({ message: "Logged out" });
}