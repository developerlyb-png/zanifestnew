import type { NextApiRequest, NextApiResponse } from "next";
import { buildDigitQuickQuoteBody } from "@/lib/digit4wRequestBuilder";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Only POST allowed",
    });
  }

  try {
    const body = req.body;

    console.log("COMMON QUOTE REQUEST >>>", body);

    // Use current host (works in dev & production)
    const protocol =
      req.headers["x-forwarded-proto"] || "http";

    const host = req.headers.host;

    const baseUrl = `${protocol}://${host}`;

    // ===========================
    // CALL BOTH APIS
    // ===========================

    const digitBuilt = buildDigitQuickQuoteBody(body);
    const digitPromise: Promise<any> =
      "error" in digitBuilt
        ? Promise.resolve({ success: false, message: digitBuilt.error })
        : fetch(`${baseUrl}/api/digit/4w/quickquote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(digitBuilt.body),
          }).then((r) => r.json());

    const [zunoResult, sbiResult, digitResult, shriramResult, bajajResult] = await Promise.allSettled([
      fetch(`${baseUrl}/api/zuno/4w/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }).then((r) => r.json()),

      fetch(`${baseUrl}/api/sbi/4w/quickquote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }).then((r) => r.json()),

      digitPromise,

      // Off until Shriram whitelists our server IP — an unreachable host
      // otherwise holds every combined quote for the full connect timeout.
      process.env.SHRIRAM_ENABLED === "true"
        ? fetch(`${baseUrl}/api/shriram/4w/quote`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }).then((r) => r.json())
        : Promise.resolve({ success: false, message: "Shriram is not enabled" }),

      fetch(`${baseUrl}/api/bajaj/4w/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    ]);

    const quotes: any[] = [];

    // ===========================
    // ZUNO
    // ===========================

    if (
      zunoResult.status === "fulfilled" &&
      zunoResult.value.success
    ) {
      quotes.push({
        insurer: "ZUNO",
        success: true,
        response: zunoResult.value,
      });
    } else {
      quotes.push({
        insurer: "ZUNO",
        success: false,
        response:
          zunoResult.status === "fulfilled"
            ? zunoResult.value
            : zunoResult.reason,
      });
    }

    // ===========================
    // SBI
    // ===========================

    if (
      sbiResult.status === "fulfilled" &&
      sbiResult.value.success
    ) {
      quotes.push({
        insurer: "SBI",
        success: true,
        response: sbiResult.value,
      });
    } else {
      quotes.push({
        insurer: "SBI",
        success: false,
        response:
          sbiResult.status === "fulfilled"
            ? sbiResult.value
            : sbiResult.reason,
      });
    }

    quotes.push({
      insurer: "DIGIT",
      success:
        digitResult.status === "fulfilled" && digitResult.value?.success === true,
      response:
        digitResult.status === "fulfilled" ? digitResult.value : digitResult.reason,
    });

    quotes.push({
      insurer: "SHRIRAM",
      success:
        shriramResult.status === "fulfilled" && shriramResult.value?.success === true,
      response:
        shriramResult.status === "fulfilled" ? shriramResult.value : shriramResult.reason,
    });

    quotes.push({
      insurer: "BAJAJ",
      success:
        bajajResult.status === "fulfilled" && bajajResult.value?.success === true,
      response:
        bajajResult.status === "fulfilled" ? bajajResult.value : bajajResult.reason,
    });

    console.log("FINAL QUOTES >>>", quotes);

    return res.status(200).json({
      success: true,
      quotes,
    });
  } catch (err: any) {
    console.log("COMMON QUOTE ERROR", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}