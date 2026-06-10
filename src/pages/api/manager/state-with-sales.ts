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

    // ✅ Only National can access
    if (decoded.role !== "national") {
      return res.status(403).json({ success: false, message: "Access restricted" });
    }

    // ✅ Get logged-in National manager
    const national = await Manager.findById(decoded.id);
    if (!national) {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }

    // ✅ Get only states under this National
    const stateManagers = await Manager.find({
      assignedTo: national._id,
      category: "state",
    });

    const results = [];

    for (const state of stateManagers) {
      const districtManagers = await Manager.find({
        assignedTo: state._id,
        category: "district",
      });

      const dmCodes = districtManagers
        .map((d) => d.managerId?.toString())
        .filter(Boolean);

      const sales = await Sale.find({
        districtManager: { $in: dmCodes },
      });

      const totalSales = sales.reduce((sum, s) => sum + (s.amount || 0), 0);

      results.push({
        _id: state._id,
        name: state.name || `${state.firstName ?? ""} ${state.lastName ?? ""}`.trim(),
        email: state.email,
        phone: state.phone || state.number || "—",
        address: state.address || "—",
        state: state.location?.state || state.state || "—",
        totalSales,
      });
    }

    return res.status(200).json({
      success: true,
      data: results,
    });

  } catch (err: any) {
    console.error("State with sales error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
