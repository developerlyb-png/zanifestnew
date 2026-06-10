import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import Sale from "@/models/sales/sale";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const agents = await Agent.find();

  for (const agent of agents) {
    const dmMap: Record<string, number> = {};

    const sales = await Sale.find({ agent: agent._id });

    for (const s of sales) {
      const dm = s.districtManager;
      dmMap[dm] = (dmMap[dm] || 0) + s.amount;
    }

    agent.dmSalesHistory = Object.keys(dmMap).map((dmId) => ({
      dmId,
      sales: dmMap[dmId],
    }));

    agent.lifetimeSales = sales.reduce((t, s) => t + s.amount, 0);

    await agent.save();
  }

  return res.json({ success: true, message: "Migration Complete" });
}
