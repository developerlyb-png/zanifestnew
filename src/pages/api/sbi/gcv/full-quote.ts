// POST /api/sbi/gcv/full-quote — SBI GCV proposal; returns the QuotationNo
// that Issuance needs. CKYC must already be done (/api/sbi/ckyc/*).
// Body: { ...GcvQuoteInput, customer, ckycTags, ckycRecord, nominee, driver }
import type { NextApiRequest, NextApiResponse } from "next";
import { sbiGcvPost } from "@/lib/sbiGcv/client";
import { SBI_GCV_PATHS } from "@/lib/sbiGcv/constants";
import {
  buildGcvFullQuoteBody,
  summariseGcvQuote,
  sbiErrorMessages,
  GcvInputError,
} from "@/lib/sbiGcv/requestBuilder";
import { friendlyMessage } from "@/utils/friendlyError";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { customer, ckycTags, ckycRecord, nominee, driver, ...input } = req.body || {};

  if (!ckycRecord?.fullName && (!customer?.firstName || !customer?.dob)) {
    return res.status(400).json({ success: false, message: "customer (name, dob, ...) or a CKYC record is required" });
  }
  if (!nominee?.name || !nominee?.dob) {
    return res.status(400).json({ success: false, message: "Nominee name and date of birth are required for the PA cover" });
  }
  // SBI requires both even for a brand-new vehicle ("Kindly enter EngineNo and ChassisNo").
  if (!input.chassisNumber || !input.engineNumber) {
    return res.status(400).json({ success: false, message: "Chassis and engine number are required" });
  }

  let built;
  try {
    built = buildGcvFullQuoteBody({ input, customer: customer || {}, ckycTags, ckycRecord, nominee, driver });
  } catch (e: any) {
    if (e instanceof GcvInputError) return res.status(200).json({ success: false, message: friendlyMessage(e) });
    throw e;
  }

  try {
    const { raw } = await sbiGcvPost(SBI_GCV_PATHS.fullQuote, "fullQuote", built.body);
    const errors = sbiErrorMessages(raw);
    const summary = summariseGcvQuote(raw);

    if (errors || !summary.isPremiumCalcSuccess || !summary.quotationNo) {
      return res.status(200).json({
        success: false,
        message: errors?.[0] || "SBI could not create the proposal",
        errors,
        data: raw,
      });
    }

    // A premium can come back with UnderwritingResult.Status "Fail" — the
    // quote is then referred to an SBI underwriter and can't be issued online
    // (e.g. U8114 date rule, U2210 IDV > 1 crore, U1027 tanker).
    const uw = raw?.UnderwritingResult;
    if (uw?.Status && uw.Status !== "Success") {
      const reasons = (uw.MessageList || []).map((m: any) => m.Message || m.Code).filter(Boolean);
      return res.status(200).json({
        success: false,
        underwritingReferral: true,
        message: reasons[0] || "This proposal needs SBI underwriter approval and can't be issued online.",
        reasons,
        quotationNo: summary.quotationNo,
        data: raw,
      });
    }

    return res.status(200).json({ success: true, ...summary, data: raw });
  } catch (error: any) {
    console.log("SBI GCV FULLQUOTE ERROR", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
}
