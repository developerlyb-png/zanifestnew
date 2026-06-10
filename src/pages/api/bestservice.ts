import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import BestService from "@/models/BestService";

const DEFAULT_SERVICES = [
  {
    type: "support",
    name: "24X7 Support",
    desc: "Our dedicated customer support team is available 24/7 to guide you at every step of your insurance journey.",
  },
  {
    type: "claim",
    name: "Easy Claim System",
    desc: "Hassle-free claim process designed to get you quick resolutions when you need them the most.",
  },
  {
    type: "installment",
    name: "Easy Installments",
    desc: "Flexible and easy premium installment options to suit every budget and keep you worry-free.",
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      let data = await BestService.findOne({}).lean();
      if (!data) {
        data = await BestService.create({
          heading: "Best Service",
          services: DEFAULT_SERVICES,
        });
      }
      return res.status(200).json(data);
    } catch (err) {
      console.error("GET /api/bestservice error:", err);
      return res.status(500).json({ error: "Failed to fetch service data" });
    }
  } else if (req.method === "POST") {
    try {
      const { heading, services } = req.body;

      if (!heading || !Array.isArray(services)) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      let data = await BestService.findOne({});
      if (data) {
        data.heading = heading;
        data.services = services;
        await data.save();
      } else {
        data = await BestService.create({ heading, services });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error("POST /api/bestservice error:", err);
      return res.status(500).json({ error: "Failed to update service data" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
