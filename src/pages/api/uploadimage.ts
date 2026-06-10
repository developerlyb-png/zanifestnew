import type { NextApiRequest, NextApiResponse } from "next";
import Image from "@/models/Home";
import connectDB from "@/lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      await connectDB();

      // ✅ Limit: Only 10 images allowed
      const count = await Image.countDocuments();
      if (count >= 10) {
        return res.status(400).json({ success: false, error: "Max 10 images allowed" });
      }

      const { title, imageUrl } = req.body;
      const newImage = new Image({ title, imageUrl });
      await newImage.save();

      res.status(201).json({ success: true, image: newImage });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
}
