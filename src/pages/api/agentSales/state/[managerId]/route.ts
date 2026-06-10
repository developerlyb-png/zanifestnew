import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Manager from "@/models/Manager";
import Sale from "@/models/sales/sale";

export async function GET(
  req: Request,
  { params }: { params: { managerId: string } }
) {
  await dbConnect(); // ensure MongoDB connection

  const { managerId } = params;

  try {
    // Step 1: find all District Managers under this State Manager
    const districtManagers = await Manager.find({
      assignedTo: managerId,
      category: "district",
    });

    const districtManagerIds = districtManagers.map((dm) => dm._id);

    if (districtManagerIds.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No district managers under this state manager",
          totalSales: 0,
          districtBreakdown: [],
        },
        { status: 200 }
      );
    }

    // Step 2: get all sales belonging to those DMs
    const sales = await Sale.find({
      districtManager: { $in: districtManagerIds },
    })
      .populate("agent", "firstName lastName agentCode")
      .sort({ saleDate: -1 });

    // Step 3: total of all sales
    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);

    // Step 4: optional breakdown per DM
    const districtBreakdown = districtManagers.map((dm) => {
      const dmSales = sales.filter(
        (sale) => sale.districtManager?.toString() === dm._id.toString()
      );
      const dmTotal = dmSales.reduce((sum, sale) => sum + sale.amount, 0);
      return {
        districtManager: dm.name,
        totalSales: dmTotal,
        numberOfSales: dmSales.length,
      };
    });

    return NextResponse.json(
      {
        success: true,
        totalSales,
        districtBreakdown,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching state manager sales:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
