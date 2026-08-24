import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getSbiToken } from "@/lib/sbiToken";
import { buildSbiQuickQuoteBody } from "@/lib/sbi4wRequestBuilder";

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
    const sbiRequestBody = buildSbiQuickQuoteBody(req.body);
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
