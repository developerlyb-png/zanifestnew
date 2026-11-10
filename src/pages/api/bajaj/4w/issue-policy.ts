import type { NextApiRequest, NextApiResponse } from "next";
import { buildBajajPremiumBody, buildBajajIssueBody, BajajProposer } from "@/lib/bajaj4wRequestBuilder";

// Bajaj Allianz private-car proposal -> payment link.
//  1. Fresh calculatemotorpremiumsig at the IDV the customer saw, with the
//     proposal's real previous insurer / policy number. Seen live on UAT:
//     issuing against a re-priced quote's old transactionid fails with
//     "Transaction Id not found"; a fresh price (transactionid 0) works.
//  2. issuepolicy with exactly that request + customer details, paymentmode
//     CC. Success is just errorcode 0 — no policy number yet.
//  3. The customer pays on Bajaj's page (requestId = that transactionid);
//     Bajaj then redirects to our extcol20 URL with the policy number.
const get = (obj: any, key: string) => {
  if (!obj || typeof obj !== "object") return undefined;
  const k = Object.keys(obj).find((x) => x.toLowerCase() === key.toLowerCase());
  return k ? obj[k] : undefined;
};
const num = (v: any) => {
  if (v == null || v === "" || v === "null") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};
const errorText = (data: any) =>
  ((get(data, "errorlist") || []) as any[])
    .map((e) => get(e, "errtext"))
    .filter((t) => t && t !== "null")
    .join("; ");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { quoteInput, idv, proposer } = (req.body || {}) as {
    quoteInput: any;
    idv?: number;
    proposer: BajajProposer & { previousInsurerCode: string; previousPolicyNumber: string };
  };
  if (!quoteInput || !proposer) {
    return res.status(400).json({ success: false, message: "quoteInput and proposer are required" });
  }

  const missing = [
    "firstName", "lastName", "dob", "mobile", "email", "address1", "city", "state",
    "pincode", "engineNo", "chassisNo", "nomineeName", "nomineeRelation",
  ].filter((k) => !String((proposer as any)[k] || "").trim());
  if (missing.length) {
    return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
  }
  if (!/^[6-9]\d{9}$/.test(proposer.mobile)) {
    return res.status(400).json({ success: false, message: "Mobile must be 10 digits starting with 6-9" });
  }
  if (!/^\d{6}$/.test(proposer.pincode)) {
    return res.status(400).json({ success: false, message: "Pincode must be 6 digits" });
  }

  const protocol = req.headers["x-forwarded-proto"] || "http";
  const origin = `${protocol}://${req.headers.host}`;

  try {
    // 1. Fresh premium with the proposal's previous-policy details
    const built = buildBajajPremiumBody(
      {
        ...quoteInput,
        mobile: proposer.mobile,
        previousInsurerCode: proposer.previousInsurerCode,
        previousPolicyNumber: proposer.previousPolicyNumber,
      },
      { idv: Number(idv) || undefined, returnUrl: `${origin}/api/bajaj/4w/payment-return?` }
    );
    if ("error" in built) {
      return res.status(200).json({ success: false, message: built.error });
    }

    const priceRes = await fetch(`${process.env.BAJAJ_BASE_URL}/calculatemotorpremiumsig`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(built.body),
      signal: AbortSignal.timeout(60000),
    });
    const price = await priceRes.json().catch(() => null);
    const pd = get(price, "premiumdetails");
    const finalPremium = num(get(pd, "finalpremium"));
    const transactionId = String(get(price, "transactionid") ?? "");
    if (!price || Number(get(price, "errorcode")) !== 0 || errorText(price) || finalPremium == null) {
      console.log("BAJAJ 4W ISSUE PRICE FAILED", JSON.stringify(price)?.slice(0, 2000));
      return res.status(200).json({
        success: false,
        message: errorText(price) || "Bajaj could not price this proposal",
      });
    }

    // 2. Issue — the return URL carries the transaction id so the result
    //    page knows which payment it is confirming.
    const issueBody = buildBajajIssueBody(built.body, transactionId, proposer);
    issueBody.detariffobj.extcol20 = `${origin}/api/bajaj/4w/payment-return?txn=${transactionId}&`;

    console.log(
      "BAJAJ 4W ISSUE PAYLOAD",
      JSON.stringify({ ...issueBody, password: "***", custdetails: { ...issueBody.custdetails, mobile: "***", email: "***" } })
    );
    const issueRes = await fetch(`${process.env.BAJAJ_BASE_URL}/issuepolicy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issueBody),
      signal: AbortSignal.timeout(90000),
    });
    const text = await issueRes.text();
    console.log("BAJAJ 4W ISSUE RAW", issueRes.status, text.slice(0, 2000));

    let issued: any = null;
    try {
      issued = JSON.parse(text);
    } catch {
      // An empty 200 means Bajaj's server failed on the request shape
      return res.status(502).json({
        success: false,
        message: "Bajaj did not respond to the proposal. Please try again or choose another insurer.",
      });
    }
    if (Number(get(issued, "errorcode")) !== 0 || errorText(issued)) {
      return res.status(200).json({
        success: false,
        message: errorText(issued) || "Bajaj rejected the proposal",
      });
    }

    // 3. Bajaj's payment page (kit: requestId = transaction id for WS_MOTOR)
    const params = new URLSearchParams({
      requestId: transactionId,
      Username: process.env.BAJAJ_USERID || "",
      sourceName: "WS_MOTOR",
    });
    const paymentUrl = `${process.env.BAJAJ_PAYMENT_URL}?${params.toString()}`;

    return res.status(200).json({
      success: true,
      transactionId,
      paymentUrl,
      // Premium Bajaj confirmed for this proposal — may differ from the
      // quote if the real previous insurer / claim changes the NCB
      premium: finalPremium,
      netPremium: num(get(pd, "netpremium")),
      gst: num(get(pd, "servicetax")),
      idv: num(get(pd, "totaliev")),
      policyIssueDate: get(issued, "policyissuedate"),
    });
  } catch (err: any) {
    console.log("BAJAJ 4W ISSUE ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
