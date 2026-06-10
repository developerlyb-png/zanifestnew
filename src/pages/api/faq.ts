import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import FAQ from "@/models/Faq";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const faq = await FAQ.findOne({});
      res.status(200).json(faq);
    } catch (err) {
      console.error("GET /api/faq error:", err);
      res.status(500).json({ error: "Failed to fetch FAQ" });
    }
  } else if (req.method === "PUT") {
    try {
      const { heading, questions } = req.body;

      if (!heading || !Array.isArray(questions)) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      const faq = await FAQ.findOneAndUpdate({}, { heading, questions }, { new: true, upsert: true });
      res.status(200).json(faq);
    } catch (err) {
      console.error("PUT /api/faq error:", err);
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
