import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";  // if you’re using JWT auth
import {parse} from 'cookie';
import cookie from 'cookie';
import bcrypt from "bcryptjs";
import Agent from '@/models/Agent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();

    //verify JWT token
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.adminToken || cookies.token; // Adjust based on how you store the token

    if(!token){
      console.log("No token provided");
      return res.status(401).json({success: false, message: "No token provided"})
    }
    console.log("Token received:", token);

    let decoded: any;
    console.log("Verifying token:", token);

    try
    {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
      console.log("JWT_SECRET being used:", process.env.JWT_SECRET);
    }

    catch(error)
    {
      return res.status(401).json({success: false, message: "Invalid token 2"})
      // console.log("Incoming token:", token);
    }

    //ensure that the user is SUPERADMIN
    if(decoded.role!=="superadmin")
    {
      return res.status(403).json({success: false, message: "Forbidden: Only SUPERADMIN can update status" })
    }

    //perform status update
    const { id } = req.query;
    const { accountStatus, password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    if (!id || !accountStatus) {
      return res.status(400).json({ success: false, message: "Missing id or status" });
    }

    //verify SUPERADMIN PASSWORD 
    const superAdmin = await Admin.findById(decoded.id).select("+password");
    if (!superAdmin) 
    {
      return res.status(401).json({ success: false, message: "SUPERADMIN not found" });
    }

    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if(!isMatch)
    {
      return res.status(401).json({message: " Password is incorrect"})
    }

    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      { accountStatus },
      { new: true }
    );

    if (!updatedAgent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    return res.status(200).json({ success: true, data: updatedAgent });
  } 
  
  catch (error) {
    console.error("Error updating agent status:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
