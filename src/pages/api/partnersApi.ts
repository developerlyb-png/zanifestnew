import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Partner from "@/models/partners";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // 👈 increase body limit
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();

    if (req.method === "GET") {
      const partners = await Partner.find({});
      return res.status(200).json({
        categories: partners.map(p => ({
          category: p.category,
          heading: p.heading,
          images: p.images,
        })),
      });
    }

    if (req.method === "POST") {
      const { categories } = req.body;

      for (const cat of categories) {
        await Partner.findOneAndUpdate(
          { category: cat.category },
          {
            heading: cat.heading,
            images: cat.images,
          },
          { upsert: true }
        );
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}