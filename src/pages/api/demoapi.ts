// File: pages/api/demoapi.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import DemoSection from "@/models/DemoSection";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const demo = await DemoSection.findOne({});
      if (!demo) {
        // If no document exists, create one with default values
        const newDemo = new DemoSection({});
        await newDemo.save();
        return res.status(200).json(newDemo);
      }
      return res.status(200).json(demo);
    } catch (err) {
      console.error("Error fetching:", err);
      return res.status(500).json({ message: "Failed to fetch data" });
    }
  }

  if (req.method === "POST") {
    const { heading, subheading, itemId, name, desc, image, color } = req.body;

    try {
      let demo = await DemoSection.findOne({});
      if (!demo) {
        demo = new DemoSection({});
        await demo.save();
      }

      // Update heading or subheading if provided
      if (heading !== undefined) demo.heading = heading;
      if (subheading !== undefined) demo.subheading = subheading;

      // Update a specific item if itemId is provided
      if (itemId !== undefined && demo.items[itemId]) {
        const item = demo.items[itemId];
        if (name !== undefined) item.name = name;
        if (desc !== undefined) item.desc = desc;
        if (image !== undefined) item.image = image;
        if (color !== undefined) item.color = color;
      } else if (itemId !== undefined) {
        return res.status(404).json({ message: "Item not found" });
      }

      await demo.save();
      return res.status(201).json({ message: "Saved successfully" });
    } catch (err) {
      console.error("Error saving:", err);
      return res.status(500).json({ message: "Failed to save data" });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}