import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
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
  const name = String(b?.name || "").trim();
  const branch = String(b?.branch || "").trim();
  const opsRmEmail = String(b?.opsRmEmail || "").trim();
  const opsRmPhone = String(b?.opsRmPhone || "").trim();
  const claimsRmEmail = String(b?.claimsRmEmail || "").trim();
  const claimsRmPhone = String(b?.claimsRmPhone || "").trim();

  if (!name) return { error: "Insurance company name is required" };
  if (!branch) return { error: "Insurance company branch is required" };
  if (!opsRmEmail) return { error: "Operation RM email is required" };
  if (!opsRmPhone) return { error: "Operation RM phone number is required" };
  if (!claimsRmEmail) return { error: "Claims RM email is required" };
  if (!claimsRmPhone) return { error: "Claims RM phone number is required" };

  return {
    doc: {
      name,
      branch,
      salesRmEmail: String(b?.salesRmEmail || "").trim(),
      salesRmPhone: String(b?.salesRmPhone || "").trim(),
      opsRmEmail,
      opsRmPhone,
      claimsRmEmail,
      claimsRmPhone,
    },
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const items = await InsuranceCompanyConfig.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, items });
    } catch (err: any) {
      console.log("CONFIG INSURANCE COMPANIES LIST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const { error, doc } = validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error });

      const clash = await InsuranceCompanyConfig.findOne({ name: doc!.name, branch: doc!.branch });
      if (clash) {
        return res.status(409).json({ success: false, message: "This company and branch is already added" });
      }

      const item = await InsuranceCompanyConfig.create(doc);
      return res.status(201).json({ success: true, item });
    } catch (err: any) {
      console.log("CONFIG INSURANCE COMPANIES CREATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const id = String(req.body?.id || "");
      if (!id) return res.status(400).json({ success: false, message: "Id is required" });

      const { error, doc } = validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error });

      const clash = await InsuranceCompanyConfig.findOne({
        _id: { $ne: id },
        name: doc!.name,
        branch: doc!.branch,
      });
      if (clash) {
        return res.status(409).json({ success: false, message: "This company and branch is already added" });
      }

      const item = await InsuranceCompanyConfig.findByIdAndUpdate(id, doc, { new: true });
      if (!item) return res.status(404).json({ success: false, message: "Insurance company not found" });
      return res.status(200).json({ success: true, item });
    } catch (err: any) {
      console.log("CONFIG INSURANCE COMPANIES UPDATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
