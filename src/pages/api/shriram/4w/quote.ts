import type { NextApiRequest, NextApiResponse } from "next";
import { buildShriramQuoteBody, parseShriramQuote } from "@/lib/shriram4w";

// Shriram General Insurance — Private Car GetQuote.
// Takes the same quote input as /api/car/4w/quote (RC data + pincode +
// previous-policy expiry) and prices it against Shriram's PolicyGeneration
// service. Auth is plain Username/Password headers (no token step).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const built = buildShriramQuoteBody(req.body || {});
  if ("error" in built) {
    return res.status(400).json({ success: false, message: built.error });
  }

  try {
    const response = await fetch(`${process.env.SHRIRAM_BASE_URL}/GetQuote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Username: process.env.SHRIRAM_USERNAME || "",
        Password: process.env.SHRIRAM_PASSWORD || "",
      },
      body: JSON.stringify(built.body),
      signal: AbortSignal.timeout(25000),
    });

    const data: any = await response.json().catch(() => null);
    if (!data) {
      return res.status(502).json({
        success: false,
        message: `Shriram returned a non-JSON response (HTTP ${response.status})`,
      });
    }

    // Failures come back as MessageResult.Result = "Failure" or a non-zero
    // GetQuotResult.ERROR_CODE (with the reason in ERROR_DESC).
    const result = data.GetQuotResult;
    const failed =
      data.MessageResult?.Result !== "Success" || !result || String(result.ERROR_CODE) !== "0";
    if (failed) {
      return res.status(502).json({
        success: false,
        message:
          result?.ERROR_DESC ||
          data.MessageResult?.ErrorMessage ||
          "Shriram quote failed",
      });
    }

    return res.status(200).json({
      success: true,
      quote: parseShriramQuote(result),
      matchedCode: built.matchedCode,
      matchedModel: built.matchedModel,
      ambiguous: built.ambiguous,
      policyType: built.policyType,
      breakIn: built.breakIn,
      raw: result,
    });
  } catch (err: any) {
    console.log("SHRIRAM 4W QUOTE ERROR", err);
    const timedOut = err?.name === "TimeoutError" || err?.cause?.code === "UND_ERR_CONNECT_TIMEOUT";
    return res.status(timedOut ? 504 : 500).json({
      success: false,
      message: timedOut ? "Shriram service did not respond" : err.message,
    });
  }
}
