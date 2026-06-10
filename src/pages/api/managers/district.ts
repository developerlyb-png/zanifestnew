import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Manager from "@/models/Manager";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const managers = await Manager.find({ category: "district" }).select("firstName managerId");
      console.log("Fetched district managers to edit agents :", managers);

      res.status(200).json({ success: true, managers });
    } catch (error) 
    {
      console.error("Error fetching district managers:", error);
      res.status(500).json({ success: false, message: "Failed to fetch district managers" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
