import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {

    await dbConnect();

    const agents = await Agent.find({})
      .select(`
        _id 
        agentCode 
        firstName 
        lastName 
        email 
        district 
        city 
        state 
        assignedTo 
        accountStatus 
        sales
        status 
        certificate 
        certificate1 
        certificate2 
        createdAt 
        updatedAt
      `)
      .lean();

    return res.status(200).json(agents);

  } catch (error) {
    console.error("Error fetching agents:", error);
    return res.status(500).json({ message: "Server Error" });
  }
}