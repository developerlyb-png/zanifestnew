import type { NextApiRequest, NextApiResponse } from "next";
import { buildBajajPremiumBody, buildBajajIssueBody, BajajProposer } from "@/lib/bajaj4wRequestBuilder";
import { verifyBajajKycProof } from "@/lib/bajajKyc";
import { saveBajajCheckout } from "@/lib/bajajPolicyRecord";
import type { BajajVehicleClass } from "@/lib/bajajVehicleMatch";

// Bajaj motor API handlers shared by /api/bajaj/4w/* and /api/bajaj/2w/*.
// Car and two-wheeler use the same Bajaj endpoints and fields; the vehicle
// class only changes the vehicle master, type and product codes (see
// bajaj4wRequestBuilder) and which payment-return route Bajaj sends back to.

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

// ---------------- Quote ----------------
// Bajaj Allianz private-car premium — POST {BAJAJ_BASE_URL}/calculatemotorpremiumsig
// with plain JSON (credentials go in the body, no token). Body is the same
// quote input the other insurers get; overrideIdv / transactionId are sent
// on a re-quote (Bajaj wants the previous transactionid when recomputing).
export function makeBajajQuoteHandler(vehicleClass: BajajVehicleClass) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { overrideIdv, transactionId, ...quoteInput } = req.body || {};
  const built = buildBajajPremiumBody(quoteInput, {
    idv: Number(overrideIdv) || undefined,
    transactionId,
    vehicleClass,
  });
  if ("error" in built) {
    return res.status(200).json({ success: false, message: built.error });
  }

  try {
    console.log(`BAJAJ ${vehicleClass} PREMIUM PAYLOAD`, JSON.stringify({ ...built.body, password: "***" }));

    const response = await fetch(`${process.env.BAJAJ_BASE_URL}/calculatemotorpremiumsig`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(built.body),
    });

    const text = await response.text();
    console.log(`BAJAJ ${vehicleClass} PREMIUM STATUS`, response.status);
    console.log(`BAJAJ ${vehicleClass} PREMIUM RAW`, text.slice(0, 5000));

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({ success: false, message: "Bajaj returned a non-JSON response" });
    }

    // Bajaj's field casing differs between samples (totalOdPremium vs
    // totalodpremium) — read every key case-insensitively.
    const get = (obj: any, key: string) => {
      if (!obj || typeof obj !== "object") return undefined;
      const k = Object.keys(obj).find((x) => x.toLowerCase() === key.toLowerCase());
      return k ? obj[k] : undefined;
    };
    // Bajaj sends missing amounts as the string "null"
    const num = (v: any) => {
      if (v == null || v === "" || v === "null") return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    // errorcode 0 should mean success, but Bajaj also returns errorcode 0 with
    // an errorlist entry and null premiumdetails on exceptions (seen live on
    // UAT) — so a real quote needs all three: 0, no errtext, premium present.
    const errorCode = Number(get(data, "errorcode") ?? -1);
    const errorList: any[] = (get(data, "errorlist") || []).filter(
      (e: any) => e && (get(e, "errtext") || get(e, "errnumber"))
    );
    const hasPremium = num(get(get(data, "premiumdetails"), "finalpremium")) != null;
    if (!response.ok || errorCode !== 0 || errorList.length || !hasPremium) {
      const messages = errorList
        .map((e) => get(e, "errtext") || get(e, "errordesc") || Object.values(e || {}).filter((x) => typeof x === "string" && x).join(" "))
        .filter(Boolean);
      return res.status(200).json({
        success: false,
        message: messages.join("; ").slice(0, 300) || `Bajaj premium failed (errorcode ${errorCode})`,
        errorCode,
        data,
      });
    }

    const p = get(data, "premiumdetails") || {};
    const summary: any[] = get(data, "premiumsummerylist") || [];

    const coverages = summary.map((s) => ({
      code: get(s, "paramref"),
      name: get(s, "paramdesc"),
      od: num(get(s, "od")),
      tp: num(get(s, "act")),
      net: num(get(s, "net")),
    }));

    return res.status(200).json({
      success: true,
      insurer: "BAJAJ",
      product: built.product,
      transactionId: String(get(data, "transactionid") ?? ""),
      premium: num(get(p, "finalpremium")),
      netPremium: num(get(p, "netpremium")),
      odPremium: num(get(p, "totalodpremium")),
      tpPremium: num(get(p, "totalactpremium")),
      gst: num(get(p, "servicetax")),
      ncbAmount: num(get(p, "ncbamt")),
      // Bajaj's own IDV — re-quotes may move it ±10%
      idv: num(get(p, "totaliev")),
      coverages,
      matchedModel: built.matchedModel,
      registrationCity: built.registrationCity,
      previousInsurerAssumed: built.previousInsurerAssumed,
      // premiumdetails + premiumsummerylist must be sent back unchanged at issuance
      premiumDetails: p,
      premiumSummaryList: summary,
    });
  } catch (err: any) {
    console.log(`BAJAJ ${vehicleClass} PREMIUM ERROR`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
}

// ---------------- Proposal: price -> (KYC) -> issue ----------------
// Bajaj Allianz private-car proposal -> payment link.
//  1. Fresh calculatemotorpremiumsig at the IDV the customer saw, with the
//     proposal's real previous insurer / policy number. Seen live on UAT:
//     issuing against a re-priced quote's old transactionid fails with
//     "Transaction Id not found"; a fresh price (transactionid 0) works.
//  2. issuepolicy with exactly that request + customer details, paymentmode
//     CC. Success is just errorcode 0 — no policy number yet.
//  3. The customer pays on Bajaj's page (requestId = that transactionid);
//     Bajaj then redirects to our extcol20 URL with the policy number.
export function makeBajajIssueHandler(vehicleClass: BajajVehicleClass) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  // Two steps so KYC can sit between them, both tied to one transaction id:
  //   action "price": fresh premium -> transactionId + final premium
  //   action "issue": needs that transactionId + the kycProof from
  //                   /api/bajaj/<4w|2w>/kyc, then issuepolicy -> payment link
  const { action, quoteInput, idv, proposer, transactionId: priceTxn, kycProof } = (req.body || {}) as {
    action: "price" | "issue";
    quoteInput: any;
    idv?: number;
    proposer: BajajProposer & { previousInsurerCode: string; previousPolicyNumber: string };
    transactionId?: string;
    kycProof?: string;
  };
  if (action !== "price" && action !== "issue") {
    return res.status(400).json({ success: false, message: 'action must be "price" or "issue"' });
  }
  if (action === "issue" && !verifyBajajKycProof(String(kycProof || ""), String(priceTxn || ""))) {
    return res.status(403).json({ success: false, message: "Please complete KYC before issuing the policy" });
  }
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
      { vehicleClass, idv: Number(idv) || undefined, returnUrl: `${origin}/api/bajaj/${vehicleClass.toLowerCase()}/payment-return?` }
    );
    if ("error" in built) {
      return res.status(200).json({ success: false, message: built.error });
    }

    if (action === "price") {
      const priceRes = await fetch(`${process.env.BAJAJ_BASE_URL}/calculatemotorpremiumsig`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(built.body),
        signal: AbortSignal.timeout(60000),
      });
      const price = await priceRes.json().catch(() => null);
      const pd = get(price, "premiumdetails");
      const finalPremium = num(get(pd, "finalpremium"));
      if (!price || Number(get(price, "errorcode")) !== 0 || errorText(price) || finalPremium == null) {
        console.log(`BAJAJ ${vehicleClass} ISSUE PRICE FAILED`, JSON.stringify(price)?.slice(0, 2000));
        return res.status(200).json({
          success: false,
          message: errorText(price) || "Bajaj could not price this proposal",
        });
      }
      const priced = {
        transactionId: String(get(price, "transactionid") ?? ""),
        // Premium Bajaj confirmed for this proposal — may differ from the
        // quote if the real previous insurer / claim changes the NCB
        premium: finalPremium,
        netPremium: num(get(pd, "netpremium")),
        gst: num(get(pd, "servicetax")),
        idv: num(get(pd, "totaliev")),
      };
      // Server-side record so the paid policy can be saved without the browser
      await saveBajajCheckout({
        req,
        status: "priced",
        vehicleClass,
        transactionId: priced.transactionId,
        premiumBody: built.body,
        product: built.product,
        price: priced,
        proposer,
      });
      return res.status(200).json({ success: true, ...priced });
    }

    // 2. Issue — `built` is rebuilt from the same inputs as the price step,
    //    which Bajaj requires ("pass same value as in compute premium").
    //    The return URL carries the transaction id so the result
    //    page knows which payment it is confirming.
    const transactionId = String(priceTxn);
    const issueBody = buildBajajIssueBody(built.body, transactionId, proposer);
    issueBody.detariffobj.extcol20 = `${origin}/api/bajaj/${vehicleClass.toLowerCase()}/payment-return?txn=${transactionId}&`;

    console.log(
      `BAJAJ ${vehicleClass} ISSUE PAYLOAD`,
      JSON.stringify({ ...issueBody, password: "***", custdetails: { ...issueBody.custdetails, mobile: "***", email: "***" } })
    );
    const issueRes = await fetch(`${process.env.BAJAJ_BASE_URL}/issuepolicy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issueBody),
      signal: AbortSignal.timeout(90000),
    });
    const text = await issueRes.text();
    console.log(`BAJAJ ${vehicleClass} ISSUE RAW`, issueRes.status, text.slice(0, 2000));

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

    // Issued: refresh the saved checkout (customer may have edited details
    // since pricing, and may have logged in meanwhile)
    await saveBajajCheckout({
      req,
      status: "issued",
      vehicleClass,
      transactionId,
      premiumBody: built.body,
      proposer,
    });

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
      policyIssueDate: get(issued, "policyissuedate"),
    });
  } catch (err: any) {
    console.log(`BAJAJ ${vehicleClass} ISSUE ERROR`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
}
