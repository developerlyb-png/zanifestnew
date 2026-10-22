import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import InsuranceReconcileMapping from "@/models/InsuranceReconcileMapping";
import InsuranceCompanyConfig from "@/models/InsuranceCompanyConfig";

async function requireAdmin(req: NextApiRequest) {
  const token = req.cookies["adminToken"];
  const data = token ? await verifyToken(token) : null;
  if (
    !data ||
    typeof data !== "object" ||
    !("role" in data) ||
    !["superadmin", "admin"].includes((data as any).role)
  ) {
    return null;
  }
  return data;
}

function validate(b: any) {
  const insuranceCompanyConfigId = String(b?.insuranceCompanyConfigId || "");
  const policyNo = String(b?.fieldMap?.policyNo || "").trim();

  if (!insuranceCompanyConfigId) return { error: "Insurance company is required" };
  if (!policyNo) return { error: "The Policy No. column mapping is required" };

  return {
    doc: {
      insuranceCompanyConfigId,
      fieldMap: {
        policyNo,
        insuredName: String(b?.fieldMap?.insuredName || "").trim(),
        premium: String(b?.fieldMap?.premium || "").trim(),
        commissionAmount: String(b?.fieldMap?.commissionAmount || "").trim(),
        commissionPercentage: String(b?.fieldMap?.commissionPercentage || "").trim(),
        basicPremiumAmount: String(b?.fieldMap?.basicPremiumAmount || "").trim(),
        odPremiumAmount: String(b?.fieldMap?.odPremiumAmount || "").trim(),
        tpPremiumAmount: String(b?.fieldMap?.tpPremiumAmount || "").trim(),
        terrorismPremiumAmount: String(b?.fieldMap?.terrorismPremiumAmount || "").trim(),
      },
    },
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin: any = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();
  const adminName = `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email;

  if (req.method === "GET") {
    try {
      const items = await InsuranceReconcileMapping.find().sort({ insurerName: 1 }).lean();
      return res.status(200).json({ success: true, items });
    } catch (err: any) {
      console.log("RECONCILE MAPPING LIST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const { error, doc } = validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error });

      const company = await InsuranceCompanyConfig.findById(doc!.insuranceCompanyConfigId);
      if (!company) return res.status(400).json({ success: false, message: "Insurance company not found" });

      const existing = await InsuranceReconcileMapping.findOne({ insuranceCompanyConfig: company._id });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "A mapping already exists for this insurance company — edit it instead of creating a new one.",
        });
      }

      const item = await InsuranceReconcileMapping.create({
        insuranceCompanyConfig: company._id,
        insurerName: company.name,
        insurerBranch: company.branch,
        fieldMap: doc!.fieldMap,
        createdBy: adminName,
      });
      return res.status(201).json({ success: true, item });
    } catch (err: any) {
      console.log("RECONCILE MAPPING CREATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const id = String(req.body?.id || "");
      if (!id) return res.status(400).json({ success: false, message: "Id is required" });

      const { error, doc } = validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error });

      const company = await InsuranceCompanyConfig.findById(doc!.insuranceCompanyConfigId);
      if (!company) return res.status(400).json({ success: false, message: "Insurance company not found" });

      const item = await InsuranceReconcileMapping.findByIdAndUpdate(
        id,
        {
          insuranceCompanyConfig: company._id,
          insurerName: company.name,
          insurerBranch: company.branch,
          fieldMap: doc!.fieldMap,
        },
        { new: true }
      );
      if (!item) return res.status(404).json({ success: false, message: "Mapping not found" });
      return res.status(200).json({ success: true, item });
    } catch (err: any) {
      console.log("RECONCILE MAPPING UPDATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const id = String(req.body?.id || "");
      if (!id) return res.status(400).json({ success: false, message: "Id is required" });
      const item = await InsuranceReconcileMapping.findByIdAndDelete(id);
      if (!item) return res.status(404).json({ success: false, message: "Mapping not found" });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("RECONCILE MAPPING DELETE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
