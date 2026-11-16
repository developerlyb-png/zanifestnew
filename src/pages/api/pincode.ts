import type { NextApiRequest, NextApiResponse } from "next";
import pincodeTable from "@/lib/shriramMaster/pincode.json";

// GET /api/pincode?pin=201017 -> { city: "Ghaziabad", state: "Uttar Pradesh" }
// Backed by the 22k-row pincode master from Shriram's kit (pin -> [district,
// state code]); served from here so pages don't bundle the 600 KB table.

const STATES: Record<string, string> = {
  AN: "Andaman and Nicobar Islands", AP: "Andhra Pradesh", AR: "Arunachal Pradesh",
  AS: "Assam", BH: "Bihar", BR: "Bihar", UL: "Ladakh", CG: "Chhattisgarh", CH: "Chandigarh", CT: "Chhattisgarh",
  DD: "Daman and Diu", DH: "Dadra and Nagar Haveli and Daman and Diu", DL: "Delhi",
  DN: "Dadra and Nagar Haveli", GA: "Goa", GJ: "Gujarat", HP: "Himachal Pradesh",
  HR: "Haryana", JH: "Jharkhand", JK: "Jammu and Kashmir", KA: "Karnataka", KL: "Kerala",
  LA: "Ladakh", LD: "Lakshadweep", MH: "Maharashtra", ML: "Meghalaya", MN: "Manipur",
  MP: "Madhya Pradesh", MZ: "Mizoram", NL: "Nagaland", OD: "Odisha", OR: "Odisha",
  PB: "Punjab", PY: "Puducherry", RJ: "Rajasthan", SK: "Sikkim", TG: "Telangana",
  TN: "Tamil Nadu", TR: "Tripura", TS: "Telangana", UK: "Uttarakhand", UP: "Uttar Pradesh",
  UT: "Uttarakhand", WB: "West Bengal",
};

const titleCase = (s: string) =>
  String(s || "").toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const pin = String(req.query.pin || "");
  if (!/^\d{6}$/.test(pin)) {
    return res.status(400).json({ success: false, message: "pin must be 6 digits" });
  }
  const hit = (pincodeTable as Record<string, string[]>)[pin];
  if (!hit) return res.status(200).json({ success: false, message: "Pincode not found" });

  const [district, stateCode] = hit;
  return res.status(200).json({
    success: true,
    city: titleCase(district),
    state: STATES[stateCode] || stateCode,
  });
}
