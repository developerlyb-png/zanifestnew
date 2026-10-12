import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import PayInPayOutRule from "@/models/PayInPayOutRule";
import Agent from "@/models/Agent";
import {
  COMMON_FIELDS,
  MOTOR_TEXT_FIELDS,
  LINES_OF_BUSINESS_RULE,
  ANY,
} from "@/constants/payinPayoutRule";

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

// Accepts an array (or a single string) and returns trimmed, de-duplicated
// values. "All" in the list means "every one", which is stored as empty.
const cleanList = (v: any): string[] => {
  const arr = Array.isArray(v) ? v : v ? [v] : [];
  const cleaned = Array.from(new Set(arr.map((x) => String(x).trim()).filter(Boolean)));
  return cleaned.some((x) => x.toUpperCase() === "ALL") ? [] : cleaned;
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
      if (!LINES_OF_BUSINESS_RULE.includes(b.lineOfBusiness)) {
        return res.status(400).json({ success: false, message: "Line of Business must be All, Motor or Non Motor" });
      }
      const payIn = pct(b.payInPercent);
      const payOut = pct(b.payOutPercent);
      if (payIn === null || payOut === null) {
        return res
          .status(400)
          .json({ success: false, message: "PayIn % and PayOut % must be between 0 and 100" });
      }

      const doc: any = {
        startDate,
        lineOfBusiness: b.lineOfBusiness === "All" ? undefined : b.lineOfBusiness,
        payInPercent: payIn,
        payOutPercent: payOut,
        createdBy: `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email,
      };

      const agentIds: string[] = Array.from(
        new Set((Array.isArray(b.agentIds) ? b.agentIds : b.agentIds ? [b.agentIds] : []).map((x: any) => String(x).trim()).filter(Boolean))
      );
      if (agentIds.length) {
        if (agentIds.some((id) => !mongoose.isValidObjectId(id))) {
          return res.status(400).json({ success: false, message: "Invalid agent" });
        }
        const agentDocs: any[] = await Agent.find(
          { _id: { $in: agentIds } },
          { firstName: 1, lastName: 1, email: 1 }
        ).lean();
        if (agentDocs.length !== agentIds.length) {
          return res.status(400).json({ success: false, message: "One or more agents were not found" });
        }
        doc.agentIds = agentDocs.map((a) => a._id);
        doc.agentNames = agentDocs.map((a) => `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || a.email);
      }

      for (const f of COMMON_FIELDS) {
        const v = String(b[f] ?? "").trim();
        doc[f] = v && v !== ANY ? v : undefined;
      }

      if (b.lineOfBusiness === "Motor") {
        doc.rtos = cleanList(b.rtos).map((r) => r.toUpperCase());
        doc.manufacturers = cleanList(b.manufacturers);
        for (const f of MOTOR_TEXT_FIELDS) {
          const v = String(b[f] ?? "").trim();
          doc[f] = v && v !== ANY ? v : undefined;
        }
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
