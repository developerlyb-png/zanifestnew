import type { NextApiRequest, NextApiResponse } from "next";
import AllInsurance from "@/models/Allinsurance";
import dbConnect from "@/lib/dbConnect"; // make sure you have this helper

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      let data = await AllInsurance.findOne({});
      if (!data) {
        data = await AllInsurance.create({});
      }
      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  } else if (req.method === "POST") {
    try {
      let data = await AllInsurance.findOne({});

      const { heading, serviceIndex, name, desc, image, link } = req.body;

      if (!data) {
        data = await AllInsurance.create({});
      }

      if (heading) {
        data.heading = heading;
      }

      if (serviceIndex !== undefined && data.services[serviceIndex]) {
        const service = data.services[serviceIndex];
        if (name !== undefined) service.name = name;
        if (desc !== undefined) service.desc = desc;
        if (image !== undefined) service.image = image;
        if (link !== undefined) service.link = link;
      }

      await data.save();
      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update data" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
