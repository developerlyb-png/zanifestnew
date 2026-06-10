// pages/api/updateEmail.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";

import TravelInsurance from "@/models/TravelInsurance";
import HomeInsurance from "@/models/Homeinsurance";
import Shop from "@/models/Shop";
import Doctor from "@/models/Doctor";
import HealthInsurance from "@/models/HealthInsurance";
import Director from "@/models/Director";
import OfficePackagePolicy from "@/models/OfficePackagePolicy";
import Marine from "@/models/Marinemodule";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  await dbConnect();

  const { id, email, module } = req.body;

  // Validation
  if (!id || !email || !module) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: id, email, module",
    });
  }

  const Models: Record<string, any> = {
    travel: TravelInsurance,
    home: HomeInsurance,
    shop: Shop,
    doctor: Doctor,
    health: HealthInsurance,
    director: Director,
    officepackage: OfficePackagePolicy,
    marine: Marine,
  };

  const SelectedModel = Models[module];

  if (!SelectedModel) {
    return res.status(400).json({
      success: false,
      message: `Invalid module name: ${module}`,
    });
  }

  try {
    const updated = await SelectedModel.findByIdAndUpdate(
      id,
      { email },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    console.error("Update Email Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
