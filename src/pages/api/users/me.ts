import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ✅ FIXED COOKIE NAME
    const token = req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

   const userData = {
  userFirstName: decoded.userFirstName || "", // ✅ IMPORTANT
  email: decoded.email || "",
  role: decoded.role || "",
};


    return res.status(200).json(userData);
  } catch (err) {
    console.error("Error verifying token:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
