import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getSbiToken } from "@/lib/sbiToken";
import {
  buildSbi4wFullQuoteBody,
  BASE_COVERAGE_CODES,
  ADDON_COVERAGE_CODES,
  Sbi4wCustomerInfo,
  Sbi4wCkycTags,
  Sbi4wCkycRecord,
} from "@/lib/sbi4wRequestBuilder";

// SBI FullQuote — confirmed live from the M4W Postman collection:
// POST https://devapi.sbigeneral.in/cld/v1/fullquote (lowercase — not the
// "/fullQuote" this file used to hit), same plain-JSON/token-Bearer pattern
// as QuickQuote (FullQuote isn't in the integration doc's encrypted-APIs
// list — only CKYC Search/Fetch, OVD and PDF Download are). Response is
// wrapped in a PolicyObject (unlike QuickQuote's flat shape) and carries a
// QuotationNo the Issuance step needs.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const MONTHS = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const transactionTimestamp = `${pad(ist.getUTCDate())}-${
      MONTHS[ist.getUTCMonth()]
    }-${ist.getUTCFullYear()}-${pad(ist.getUTCHours())}:${pad(
      ist.getUTCMinutes()
    )}:${pad(ist.getUTCSeconds())}`;

    const {
      overrideIdv,
      excludeAddonCodes,
      customer,
      ckycTags,
      ckycRecord,
      nominee,
      ...quoteInput
    }: {
      overrideIdv?: number;
      excludeAddonCodes?: string[];
      customer?: Partial<Sbi4wCustomerInfo>;
      ckycTags?: Sbi4wCkycTags;
      ckycRecord?: Sbi4wCkycRecord | null;
      nominee?: { name: string; dob: string; age: string };
      [key: string]: any;
    } = req.body || {};

    // Identity can come entirely from a verified CKYC record — a customer
    // form is only mandatory when there's no record to fall back on.
    if (!ckycRecord?.fullName && (!customer?.firstName || !customer?.lastName || !customer?.dob)) {
      return res.status(400).json({
        success: false,
        message: "customer (firstName, lastName, dob, ...) or a CKYC record is required",
      });
    }

    const sbiRequestBody = buildSbi4wFullQuoteBody(quoteInput, customer || {}, ckycTags, ckycRecord, {
      idvOverride: overrideIdv,
      excludeAddonCodes: excludeAddonCodes ?? ADDON_COVERAGE_CODES,
      nominee,
    });
    const usesPlaceholderData = JSON.stringify(sbiRequestBody).includes("PLACEHOLDER_");

    const payload = {
      RequestHeader: {
        action: "fullQuote",
        channel: "SBIG",
        requestID: Date.now().toString(),
        transactionTimestamp,
      },
      RequestBody: sbiRequestBody,
    };

    console.log("SBI 4W FULLQUOTE PAYLOAD", JSON.stringify(payload));

    const accessToken = await getSbiToken();

    const response = await axios.post(
      `${process.env.SBI_BASE_URL}/cld/v1/fullquote`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-IBM-Client-Id": process.env.SBI_CLIENT_ID,
          "X-IBM-Client-Secret": process.env.SBI_CLIENT_SECRET,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const raw = response.data;
    console.log("SBI 4W FULLQUOTE RAW RESPONSE", JSON.stringify(raw));

    // FullQuote's response IS wrapped in PolicyObject (unlike QuickQuote's
    // flat shape) — per SBI's own FullQuote sample.
    const result = raw?.PolicyObject ?? raw;
    const isErrorPayload = typeof raw?.code === "string";
    const isPremiumCalcSuccess = result?.IsPremiumCalcSuccess === "Y";
    const premium = result?.DuePremium;
    const quotationNo = result?.QuotationNo;

    if (isErrorPayload || !isPremiumCalcSuccess || premium == null || !quotationNo) {
      return res.status(200).json({ success: false, error: raw });
    }

    // A calculated premium doesn't mean the policy can actually be issued —
    // SBI can still refer it for manual underwriting (e.g. requested IDV too
    // far above their suggested value) and return PolicyStatus 1 (pending)
    // instead of 2 (confirmed) alongside a Fail here. Confirmed live: this
    // was previously being reported as success and would have let checkout
    // proceed to Issuance against a quote SBI hadn't actually approved.
    const underwriting = result?.UnderwritingResult;
    if (underwriting?.Status === "Fail") {
      const reasons = (underwriting?.MessageList || [])
        .map((m: any) => m.Message || m.Code)
        .filter(Boolean);
      return res.status(200).json({
        success: false,
        underwritingReferral: true,
        message:
          reasons[0] ||
          "This quote needs manual underwriting approval and can't be issued automatically — try a lower IDV.",
        reasons,
        error: raw,
      });
    }

    const findFieldDeep = (obj: any, key: string): any => {
      if (obj == null || typeof obj !== "object") return undefined;
      if (key in obj) return obj[key];
      for (const k of Object.keys(obj)) {
        const found = findFieldDeep(obj[k], key);
        if (found !== undefined) return found;
      }
      return undefined;
    };
    const findArrayDeep = (obj: any, key: string): any[] | undefined => {
      if (obj == null || typeof obj !== "object") return undefined;
      if (Array.isArray(obj[key])) return obj[key];
      for (const k of Object.keys(obj)) {
        const found = findArrayDeep(obj[k], key);
        if (found !== undefined) return found;
      }
      return undefined;
    };

    const grossPremium = findFieldDeep(result, "GrossPremium");
    const beforeVatPremium = findFieldDeep(result, "BeforeVatPremium");
    const tpPremium = findFieldDeep(result, "TP_TotalPremium");
    const gst = (findFieldDeep(result, "CGST") ?? 0) + (findFieldDeep(result, "IGST") ?? 0);
    const odTotalField = findFieldDeep(result, "OD_TotalPremium");
    const odBase = beforeVatPremium ?? grossPremium;
    const odPremium =
      odTotalField ?? (odBase != null && tpPremium != null ? odBase - tpPremium : undefined);

    const policyCoverageList = findArrayDeep(result, "PolicyCoverageList") || [];
    const coverages = policyCoverageList.map((c: any) => ({
      code: c?.ProductElementCode,
      premium: c?.GrossPremium ?? c?.AnnualPremium ?? c?.BeforeVatPremium ?? 0,
      isAddon: !BASE_COVERAGE_CODES.includes(c?.ProductElementCode),
    }));

    const idv = {
      user: findFieldDeep(result, "IDV_User"),
      suggested: findFieldDeep(result, "IDV_Suggested"),
      min: findFieldDeep(result, "MinIDV_Suggested"),
      max: findFieldDeep(result, "MaxIDV_Suggested"),
    };

    if (usesPlaceholderData) {
      return res.status(200).json({
        success: false,
        pendingMasterData: true,
        premiumIfRealCodes: premium,
        data: raw,
      });
    }

    return res.status(200).json({
      success: true,
      quotationNo,
      policyId: result?.PolicyId,
      premium,
      grossPremium,
      beforeVatPremium,
      odPremium,
      tpPremium,
      gst,
      coverages,
      idv,
      availableAddonCodes: ADDON_COVERAGE_CODES,
      data: raw,
    });
  } catch (error: any) {
    console.log("SBI 4W FULL QUOTE ERROR", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
