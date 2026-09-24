import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import CommissionRule from "@/models/CommissionRule";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const rules = await CommissionRule.find({}).sort({ scopeType: 1, scopeValue: 1 }).lean();
      return res.status(200).json({ success: true, rules });
    } catch (err: any) {
      console.log("COMMISSION RULES GET ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const { scopeType, scopeValue, ratePercent } = req.body || {};

      if (!scopeType || ratePercent === undefined || ratePercent === null) {
        return res.status(400).json({
          success: false,
          message: "scopeType and ratePercent are required",
        });
      }
      if (scopeType === "PRODUCT" && !scopeValue) {
        return res.status(400).json({
          success: false,
          message: "scopeValue is required for a PRODUCT-scoped rule",
        });
      }
      if (Number(ratePercent) < 0 || Number(ratePercent) > 100) {
        return res.status(400).json({ success: false, message: "ratePercent must be 0-100" });
      }

      const adminName =
        `${(admin as any).userFirstName ?? ""} ${(admin as any).userLastName ?? ""}`.trim() ||
        (admin as any).email;

      // Upsert on {scopeType, scopeValue} — re-"creating" a rule for a scope
      // that already has one just updates the rate rather than erroring on
      // the unique index or leaving two ambiguous rules for the resolver.
      const rule = await CommissionRule.findOneAndUpdate(
        { scopeType, scopeValue: scopeType === "ALL_PRODUCTS" ? null : scopeValue },
        {
          scopeType,
          scopeValue: scopeType === "ALL_PRODUCTS" ? null : scopeValue,
          ratePercent: Number(ratePercent),
          active: true,
          createdBy: adminName,
        },
        { new: true, upsert: true }
      );

      return res.status(200).json({ success: true, rule });
    } catch (err: any) {
      console.log("COMMISSION RULES POST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
