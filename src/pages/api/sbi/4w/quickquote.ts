import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getSbiToken } from "@/lib/sbiToken";
import {
  buildSbiQuickQuoteBody,
  BASE_COVERAGE_CODES,
  ADDON_COVERAGE_CODES,
} from "@/lib/sbi4wRequestBuilder";

// SBI QuickQuote v1 — per SBI's integration kit (Token tab confirms
// GET /cld/v1/token; QuickQuote tab confirms POST /cld/v1/quickquote with
// plain JSON — NOT encrypted — using the access_token from step 1 as a
// Bearer header alongside the same client id/secret headers).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    // Confirmed from SBI's own integration-kit sample (FullQuote curl example,
    // which shares the same RequestHeader shape across their motor endpoints):
    // field names are lowercase action/channel/requestID/transactionTimestamp,
    // and transactionTimestamp is "dd-MMM-yyyy-HH:mm:ss" (e.g. "03-Mar-2024-12:22:19")
    // — not ISO, not epoch, not any format tried before.
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

    // req.body is Zuno's flat quoteInput shape (make/model/variant/idv/...) —
    // SBI's own QuickQuote sample confirms it actually wants the same deeply
    // nested PolicyCustomerList/PolicyLobList structure as FullQuote, using
    // SBI's internal numeric codes for vehicle/RTO/location, not free text.
    // We don't have that master-data mapping yet, so the builder fills those
    // fields with literal "PLACEHOLDER_..." markers — detected below so the
    // caller never treats a quote priced against fake codes as real.
    // overrideIdv / excludeAddonCodes are optional — sent once the customer
    // opts into an addon or edits IDV. When the caller doesn't specify
    // excludeAddonCodes at all (the very first quote), default to excluding
    // every optional addon — the initial quote is base cover only (OD/TP/PA),
    // never pre-selected addons the customer never chose.
    const { overrideIdv, excludeAddonCodes, ...quoteInput } = req.body || {};
    const sbiRequestBody = buildSbiQuickQuoteBody(quoteInput, {
      idvOverride: overrideIdv,
      excludeAddonCodes: excludeAddonCodes ?? ADDON_COVERAGE_CODES,
    });
    const usesPlaceholderData = JSON.stringify(sbiRequestBody).includes("PLACEHOLDER_");

    const payload = {
      RequestHeader: {
        action: "quickQuote",
        channel: "SBIG",
        requestID: Date.now().toString(),
        transactionTimestamp,
      },
      RequestBody: sbiRequestBody,
    };

    console.log("SBI 4W QUICKQUOTE PAYLOAD", JSON.stringify(payload));

    const accessToken = await getSbiToken();

    const response = await axios.post(
      `${process.env.SBI_BASE_URL}/cld/v1/quickquote`,
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

    const result = response.data;

    console.log("SBI 4W QUICKQUOTE RAW RESPONSE", JSON.stringify(result));

    // SBI's gateway returns business-logic errors with HTTP 200 too (e.g.
    // {"code":"MO-PLATFORM-COMMON-E9998", ...}) — an HTTP 200 alone doesn't
    // mean we got a real quote back. Per SBI's own QuickQuote sample, a real
    // quote response is FLAT (no PolicyObject wrapper, unlike FullQuote) and
    // has no QuotationNo at all (that's only assigned on FullQuote/issuance)
    // — the real success signal is "IsPremiumCalcSuccess": "Y".
    const isErrorPayload = typeof result?.code === "string";
    const isPremiumCalcSuccess = result?.IsPremiumCalcSuccess === "Y";
    const premium = result?.DuePremium;

    if (isErrorPayload || !isPremiumCalcSuccess || premium == null) {
      return res.status(200).json({
        success: false,
        error: result,
      });
    }

    // Deep-search rather than assume a fixed nesting path — SBI's response
    // shape here didn't match what the FullQuote sample implied, so pick
    // these fields up wherever they actually live in the tree.
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
    const gst = findFieldDeep(result, "TGST");
    // QuickQuote's response has no explicit OD_TotalPremium field — derive it
    // from what SBI's own numbers actually give us (Before-VAT total minus TP).
    const odTotalField = findFieldDeep(result, "OD_TotalPremium");
    const odBase = beforeVatPremium ?? grossPremium;
    const odPremium =
      odTotalField ?? (odBase != null && tpPremium != null ? odBase - tpPremium : undefined);

    // Real coverage line items SBI actually priced, for an honest "View
    // Coverage" list — no invented benefit names for codes we can't confirm.
    // BASE_COVERAGE_CODES (OD/TP/PA) aren't optional add-ons a customer can
    // deselect — everything else is.
    const policyCoverageList = findArrayDeep(result, "PolicyCoverageList") || [];
    const coverages = policyCoverageList.map((c: any) => ({
      code: c?.ProductElementCode,
      premium: c?.GrossPremium ?? c?.AnnualPremium ?? c?.BeforeVatPremium ?? 0,
      isAddon: !BASE_COVERAGE_CODES.includes(c?.ProductElementCode),
    }));

    // SBI computes its own suggested/min/max IDV band for this vehicle —
    // don't reuse whatever IDV another insurer (Zuno) quoted.
    const idv = {
      user: findFieldDeep(result, "IDV_User"),
      suggested: findFieldDeep(result, "IDV_Suggested"),
      min: findFieldDeep(result, "MinIDV_Suggested"),
      max: findFieldDeep(result, "MaxIDV_Suggested"),
    };

    const breakdown = {
      grossPremium,
      beforeVatPremium,
      odPremium,
      tpPremium,
      gst,
      coverages,
      idv,
      // The full addon catalog, regardless of what's included in this
      // particular quote — the sidebar needs this to render every available
      // addon checkbox, not just the ones currently selected.
      availableAddonCodes: ADDON_COVERAGE_CODES,
    };

    // Never report success while the request still used placeholder codes —
    // SBI computed a real number, but against a fabricated vehicle/location,
    // so it must not be surfaced to customers as a genuine quote.
    if (usesPlaceholderData) {
      return res.status(200).json({
        success: false,
        pendingMasterData: true,
        premiumIfRealCodes: premium,
        data: result,
      });
    }

    return res.status(200).json({
      success: true,
      premium,
      ...breakdown,
      data: result,
    });
  } catch (error: any) {
    console.log("SBI 4W QUICK QUOTE ERROR", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
