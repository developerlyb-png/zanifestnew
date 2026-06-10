// pages/api/carinsuranceapi.ts
import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import InsuranceModel from "@/models/insurance";

/**
 * Minimal mongoose connection helper inside this file so you don't need extra files.
 * Requires process.env.MONGODB_URI to be set.
 */
const MONGODB_URI = process.env.MONGODB_URI || "";

async function connectToDatabase() {
  if (!MONGODB_URI) throw new Error("Please define MONGODB_URI in env");
  if (mongoose.connection.readyState === 1) {
    return;
  }
  // reuse connection if possible
  await mongoose.connect(MONGODB_URI);
}

const DEFAULT_INSURANCE_NAMES = [
  "Family Health Insurance",
  "Marine Insurance",
  "Travel Insurance",
  "Car Insurance",
  "⁠2 wheeler Insurance",
  "Shop Insurance",
  "Third Party Insurance",
  "Commercial Vehicle",
  "Home Insurance",
  "Office Package Policy",
  "Doctor Indemnity Insurance",
  "Director & Officer Liability Insurance",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connectToDatabase();
  } catch (err: any) {
    console.error("DB connect error:", err);
    return res.status(500).json({ error: "Database connection failed" });
  }
if (req.method === "GET") {
  let doc = await InsuranceModel.findOne().lean();
  if (!doc) {
    const newDoc = await InsuranceModel.create({
      heading: "Click to buy an Insurance",
      order: DEFAULT_INSURANCE_NAMES,
    });
    return res.status(200).json(newDoc.toObject());
  }
  return res.status(200).json(doc);
}

if (req.method === "POST") {
  const { heading, order } = req.body;
  let doc = await InsuranceModel.findOne();
  if (!doc) {
    doc = new InsuranceModel({
      heading: heading ?? "Click to buy an Insurance",
      order: order ?? DEFAULT_INSURANCE_NAMES,
    });
  } else {
    if (typeof heading === "string") doc.heading = heading;
    if (Array.isArray(order)) doc.order = order;
  }
  await doc.save();

  // return fresh object
  return res.status(200).json(doc.toObject());
}


  return res.status(405).json({ error: "Method not allowed" });
}
