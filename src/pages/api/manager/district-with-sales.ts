import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Manager from "@/models/Manager";
import Sale from "@/models/sales/sale";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    await dbConnect();

    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid Token" });
    }

    // ✅ Get logged-in manager
    const loggedManager = await Manager.findById(decoded.id);
    if (!loggedManager) {
      return res.status(404).json({ success: false, message: "Manager not found" });
    }

    let districtManagers: any[] = [];

    // ✅ STATE MANAGER → fetch DMs under them
    if (decoded.role === "state") {
      districtManagers = await Manager.find({
        assignedTo: loggedManager._id,
        category: "district",
      });
    }

    // ✅ NATIONAL MANAGER → fetch all DMs (if needed)
    else if (decoded.role === "national") {
      districtManagers = await Manager.find({
        category: "district",
      });
    } else {
      return res.status(403).json({ success: false, message: "Access restricted" });
    }

    const data = [];

    for (const dm of districtManagers) {
      const dmCode = dm.managerId?.toString();

      const sales = await Sale.find({ districtManager: dmCode });
      const totalSales = sales.reduce((sum, s) => sum + (s.amount || 0), 0);

      data.push({
        _id: dm._id,
        managerId: dm.managerId,
        firstName: dm.firstName,
        lastName: dm.lastName,
        email: dm.email,
        city: dm.city,
        state: dm.state || dm.location?.state,
        district: dm.district,
        totalSales,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (err: any) {
    console.error("District with sales error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
