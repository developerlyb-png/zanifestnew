import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const { assignedTo } = req.body;
      console.log("Received assignedTo:", assignedTo);

      if (!assignedTo) {
        return res.status(400).json({ success: false, message: "Manager ID is required" });
      }

      const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      { assignedTo }, // this is managerId string
      { new: true }
    );

    if (!updatedAgent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    res.status(200).json({ success: true, agent: updatedAgent });

    } 
    catch (error) {
      console.error("Error updating assignedTo:", error);
      res.status(500).json({ success: false, message: "Failed to update agent assignment" });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
