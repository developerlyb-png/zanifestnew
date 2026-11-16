import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";

async function requireAdmin(req: NextApiRequest) {
  const token = req.cookies["adminToken"];
  const data = token ? await verifyToken(token) : null;

  if (
    !data ||
    typeof data !== "object" ||
    !("role" in data) ||
    !["superadmin", "admin"].includes((data as any).role)
  ) {
    return null;
  }
  return data;
}

// Thin proxy over India Post's free pincode API — kept server-side so the
// client never calls a third-party domain directly (CORS, and so a key
// could be added here later without touching the frontend).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: "Not authorized" });

  const pincode = String(req.query.pincode || "").trim();
  if (!/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ success: false, message: "Enter a valid 6-digit pincode" });
  }

  try {
    const upstream = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (!upstream.ok) {
      return res.status(502).json({ success: false, message: "Pincode lookup failed" });
    }
    const data = await upstream.json();
    const entry = Array.isArray(data) ? data[0] : null;
    const postOffice = entry?.PostOffice?.[0];
    if (entry?.Status !== "Success" || !postOffice) {
      return res.status(404).json({ success: false, message: "Pincode not found" });
    }

    return res.status(200).json({
      success: true,
      city: postOffice.District || "",
      state: postOffice.State || "",
    });
  } catch (err: any) {
    console.log("PINCODE LOOKUP ERROR", err);
    return res.status(500).json({ success: false, message: "Pincode lookup failed" });
  }
}
