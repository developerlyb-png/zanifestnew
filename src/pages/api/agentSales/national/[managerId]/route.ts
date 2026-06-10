import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Manager from "@/models/Manager";
import Sale from "@/models/sales/sale";

export async function GET(
  req: Request,
  { params }: { params: { managerId: string } }
) {
  await dbConnect();

  const { managerId } = params;

  try {
    // Step 1: Find all State Managers under this National Manager
    const stateManagers = await Manager.find({
      assignedTo: managerId,
      category: "state",
    });

    if (stateManagers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No state managers under this national manager",
        totalSales: 0,
        stateBreakdown: [],
      });
    }

    const stateManagerIds = stateManagers.map((sm) => sm._id);

    // Step 2: Find all District Managers under those State Managers
    const districtManagers = await Manager.find({
      assignedTo: { $in: stateManagerIds },
      category: "district",
    });

    const districtManagerIds = districtManagers.map((dm) => dm._id);

    if (districtManagerIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No district managers under this national manager",
        totalSales: 0,
        stateBreakdown: [],
      });
    }

    // Step 3: Find all sales under those DMs
    const sales = await Sale.find({
      districtManager: { $in: districtManagerIds },
    })
      .populate("agent", "firstName lastName agentCode")
      .sort({ saleDate: -1 });

    // Step 4: total sales
    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);

    // Step 5: Breakdown per state manager
    const stateBreakdown = stateManagers.map((sm) => {
      const dmsUnderState = districtManagers.filter(
        (dm) => dm.assignedTo?.toString() === sm._id.toString()
      );

      const dmIds = dmsUnderState.map((dm) => dm._id);

      const salesUnderState = sales.filter((sale) =>
        dmIds.includes(sale.districtManager as any)
      );

      const stateTotal = salesUnderState.reduce(
        (sum, sale) => sum + sale.amount,
        0
      );

      return {
        stateManager: `${sm.firstName} ${sm.lastName}`,
        totalSales: stateTotal,
        districtBreakdown: dmsUnderState.map((dm) => {
          const dmSales = salesUnderState.filter(
            (sale) => (sale.districtManager as any).toString() === dm._id.toString()
          );
          return {
            districtManager: `${dm.firstName} ${dm.lastName}`,
            totalSales: dmSales.reduce((sum, s) => sum + s.amount, 0),
            numberOfSales: dmSales.length,
          };
        }),
      };
    });

    return NextResponse.json({
      success: true,
      totalSales,
      stateBreakdown,
    });
  } catch (error: any) {
    console.error("Error fetching national manager sales:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
