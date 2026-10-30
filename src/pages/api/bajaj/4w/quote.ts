import type { NextApiRequest, NextApiResponse } from "next";
import { buildBajajPremiumBody } from "@/lib/bajaj4wRequestBuilder";

// Bajaj Allianz private-car premium — POST {BAJAJ_BASE_URL}/calculatemotorpremiumsig
// with plain JSON (credentials go in the body, no token). Body is the same
// quote input the other insurers get; overrideIdv / transactionId are sent
// on a re-quote (Bajaj wants the previous transactionid when recomputing).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { overrideIdv, transactionId, ...quoteInput } = req.body || {};
  const built = buildBajajPremiumBody(quoteInput, {
    idv: Number(overrideIdv) || undefined,
    transactionId,
  });
  if ("error" in built) {
    return res.status(200).json({ success: false, message: built.error });
  }

  try {
    console.log("BAJAJ 4W PREMIUM PAYLOAD", JSON.stringify({ ...built.body, password: "***" }));

    const response = await fetch(`${process.env.BAJAJ_BASE_URL}/calculatemotorpremiumsig`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(built.body),
    });

    const text = await response.text();
    console.log("BAJAJ 4W PREMIUM STATUS", response.status);
    console.log("BAJAJ 4W PREMIUM RAW", text.slice(0, 5000));

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
    console.log("BAJAJ 4W PREMIUM ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
