import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import PayInPayOutRule from "@/models/PayInPayOutRule";
import { COMMON_FIELDS, MOTOR_FIELDS, ANY } from "@/constants/payinPayoutRule";

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

const pct = (v: any) => {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin: any = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const rules = await PayInPayOutRule.find({}).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, rules });
    } catch (err: any) {
      console.log("PAYIN PAYOUT RULES GET ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const b = req.body || {};
      const startDate = b.startDate ? new Date(b.startDate) : null;
      if (!startDate || isNaN(startDate.getTime())) {
        return res.status(400).json({ success: false, message: "Start date is required" });
      }
      const payIn = pct(b.payInPercent);
      const payOut = pct(b.payOutPercent);
      if (payIn === null || payOut === null) {
        return res
          .status(400)
          .json({ success: false, message: "PayIn % and PayOut % must be between 0 and 100" });
      }

      const isMotor = String(b.lineOfBusiness || "").trim() === "Motor";
      const doc: any = {
        startDate,
        payInPercent: payIn,
        payOutPercent: payOut,
        createdBy: `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email,
      };
      const fields = isMotor ? [...COMMON_FIELDS, ...MOTOR_FIELDS] : COMMON_FIELDS;
      for (const f of fields) {
        const v = String(b[f] ?? "").trim();
        // "All"/blank both mean "any" — stored as blank so matching is simple.
        doc[f] = v && v !== ANY ? v : undefined;
      }

      const rule = await PayInPayOutRule.create(doc);
      return res.status(201).json({ success: true, rule });
    } catch (err: any) {
      console.log("PAYIN PAYOUT RULES POST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      await PayInPayOutRule.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("PAYIN PAYOUT RULES DELETE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
