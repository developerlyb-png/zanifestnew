import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Marine from "@/models/Marinemodule";
import TravelInsurance from "@/models/TravelInsurance";
import Shop from "@/models/Shop";
import HomeInsurance from "@/models/Homeinsurance";
import OfficePackagePolicy from "@/models/OfficePackagePolicy";
import Lead from "@/models/lead";
import { verifyToken } from "@/utils/verifyToken";

const MONGODB_URI = process.env.MONGODB_URI!;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  const token = req.cookies.agentToken;
  if (!token) {
    return res.status(401).json({ success: false });
  }

  try {
    const decoded: any = await verifyToken(token);
    const agentId = decoded.id;

    const sources = [
      ...(await Marine.find({ assignedAgent: agentId })),
      ...(await TravelInsurance.find({ assignedAgent: agentId })),
      ...(await Shop.find({ assignedAgent: agentId })),
      ...(await HomeInsurance.find({ assignedAgent: agentId })),
      ...(await OfficePackagePolicy.find({ assignedAgent: agentId })),
    ];

    const leads = await Promise.all(
      sources.map(async (item: any) => {
        const module = item.module || item.constructor.modelName;

        let lead = await Lead.findOne({ module, email: item.email });

        if (!lead) {
          lead = await Lead.create({
            email: item.email,
            phone: item.phone || item.phoneNumber || item.mobile,
            module,
            assignedAt: item.assignedAt,
          });
        }

        return {
          id: lead._id,
          email: lead.email,
          phone: lead.phone,
          module: lead.module,
          assignedAt: lead.assignedAt,
          status: lead.status,
          remark: lead.remark,
        };
      })
    );

    return res.status(200).json({ success: true, data: leads });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}