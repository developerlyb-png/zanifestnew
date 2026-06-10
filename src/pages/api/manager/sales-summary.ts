import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Sale from "@/models/sales/sale";
import Manager from "@/models/Manager";
import Agent from "@/models/Agent";
import jwt, { JwtPayload } from "jsonwebtoken";

interface CustomJwtPayload extends JwtPayload {
  id: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    await dbConnect();

    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as CustomJwtPayload;

    const manager = await Manager.findById(decoded.id);
    if (!manager)
      return res.status(404).json({ success: false, message: "Manager not found" });

    let sales: any[] = [];
    let totalDistrictManagers = 0;
    let totalStateManagers = 0;

    /* ✅ DISTRICT MANAGER */
    if (decoded.role === "district") {
      const dmCode = manager.managerId?.toString();

      sales = await Sale.find({ districtManager: dmCode }) ?? [];
      totalDistrictManagers = 1;
    }

    /* ✅ STATE MANAGER */
    else if (decoded.role === "state") {
      const districtManagers = await Manager.find({
        assignedTo: manager._id,
        category: "district",
      });

      totalDistrictManagers = districtManagers.length;

      const dmCodes = districtManagers.map((d: any) => d.managerId?.toString()).filter(Boolean);

      sales = await Sale.find({
        districtManager: { $in: dmCodes },
      }) ?? [];
    }

    /* ✅ NATIONAL MANAGER */
    else if (decoded.role === "national") {

      // ✅ Fetch only state managers under this national
      const stateManagers = await Manager.find({
        category: "state",
        assignedTo: manager._id,
      });

      totalStateManagers = stateManagers.length;

      const stateIds = stateManagers.map((sm) => sm._id);

      // ✅ Fetch district managers under those states
      const districtManagers = await Manager.find({
        assignedTo: { $in: stateIds },
        category: "district",
      });

      totalDistrictManagers = districtManagers.length;

      const dmCodes = districtManagers.map((d: any) => d.managerId?.toString()).filter(Boolean);

      // ✅ Fetch only their sales
      sales = await Sale.find({
        districtManager: { $in: dmCodes },
      }) ?? [];
    }

    else {
      return res.status(403).json({
        success: false,
        message: "Access forbidden",
      });
    }

    /* ✅ Agent count */
    const uniqueAgents = new Set(
      sales.map((s) => s.agent?.toString()).filter(Boolean)
    );

    const allAgents = await Agent.find({
      _id: { $in: Array.from(uniqueAgents) },
    });

    /* ✅ Total sale amount */
    const totalSales = sales.reduce((sum, s) => sum + (s.amount || 0), 0);

    /* ✅ Monthly grouping */
    const monthSalesMap: any = {};

    sales.forEach((s) => {
      const d = new Date(s.saleDate);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      if (!monthSalesMap[monthKey]) monthSalesMap[monthKey] = 0;
      monthSalesMap[monthKey] += s.amount || 0;
    });

    const monthlySales = Object.keys(monthSalesMap).map((m) => ({
      month: m,
      sales: monthSalesMap[m],
    }));

    return res.status(200).json({
      success: true,
      totalSales,
      totalAgents: allAgents.length,
      totalDistrictManagers,
      totalStateManagers,
      sales: monthlySales,
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
