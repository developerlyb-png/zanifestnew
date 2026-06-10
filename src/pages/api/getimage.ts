import type { NextApiRequest, NextApiResponse } from "next";
import Image from "@/models/Home";
import connectDB from "@/lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectDB();
      console.log("Connected to DB for get image api");
      const images = await Image.find().sort({ createdAt: -1 });
      console.log("Fetched images:", images);
      res.status(200).json({ success: true, images });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
}
