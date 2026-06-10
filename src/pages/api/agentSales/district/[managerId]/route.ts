// /pages/api/sales/district/[managerId].js
import dbConnect from "@/lib/dbConnect";
import Sale from "@/models/sales/sale";
import { NextApiResponse, NextApiRequest } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { managerId } = req.query;
  await dbConnect();

  try {
    const sales = await Sale.find({ districtManager: managerId })
      .populate("agent", "firstName lastName agentCode")
      .sort({ saleDate: -1 });

    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);

    res.status(200).json({ success: true, totalSales, sales });
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
