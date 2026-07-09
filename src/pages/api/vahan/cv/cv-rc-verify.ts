// src/pages/api/vahan/cv/cv-rc-verify.ts
//
// RechargeKit RC Advance verify with PENDING (status: 2) handling.
//
// IMPORTANT FINDING from your logs: RechargeKit REJECTS re-use of the same
// partner_request_id ("Duplicate order, Order ID must be unique"). So each
// retry must use a FRESH partner_request_id. Once RechargeKit finishes
// fetching the RC from VAHAN (the cause of "pending"), a fresh request for
// the same rc_no returns the completed result.
//
// PROPER LONG-TERM FIX (ask RechargeKit support / check developer portal):
//   Option A: a status-enquiry endpoint that accepts the `orderid` they
//             return on pending — poll that instead of re-submitting.
//   Option B: register a callback URL in your RechargeKit portal; they
//             POST the completed result to it. Store by orderid and let
//             the frontend poll your own status route.
// Either avoids extra verification hits. Confirm with RechargeKit whether
// pending/duplicate attempts are billed on your plan.

import type { NextApiRequest, NextApiResponse } from "next";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let reqCounter = 0;
const freshRequestId = () =>
  `RC${Date.now()}${++reqCounter}${Math.floor(Math.random() * 1000)}`;

async function callRechargeKit(rcNo: string) {
  const response = await fetch(
    "https://verify.rechargkit.biz/validation/rcAdvanceVerify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RECHARGEKIT_TOKEN}`,
      },
      body: JSON.stringify({
        rc_no: rcNo,
        partner_request_id: freshRequestId(), // MUST be unique per attempt
      }),
    }
  );
  return response.json();
}

// split_present_address can be an object of strings/arrays or nested arrays
// depending on the provider's parser — dig out a plain string safely.
function extractAddressPart(split: any, key: string): string {
  try {
    const v = split?.[key];
    if (!v) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) {
      const flat = v.flat(Infinity).filter((x: any) => typeof x === "string");
      return flat[0] || "";
    }
    return "";
  } catch {
    return "";
  }
}

// Normalize RechargeKit's response into one clean shape.
// Keys confirmed from a real successful response (RECHARGEKIT RESULT KEYS log).
function normalizeRc(result: any) {
  return {
    regNo: result.reg_no || "",
    ownerName: result.owner_name || "",
    makerDescription: result.vehicle_manufacturer_name || "",
    makerModel: result.model || "",
    vehicleClass: result.class || result.vehicle_category || "",
    vehicleCategory: result.vehicle_category || "",
    fuelType: result.type || "",
    registrationDate: result.reg_date || "",
    registeredAt: result.reg_authority || "",
    rtoCode: result.rto_code || "", // e.g. "DL01" — match against rtolocation
    // Address parts — used as city candidates for the Zuno RTO lookup.
    // split_present_address shapes vary; extract defensively.
    addressDistrict: extractAddressPart(result.split_present_address, "district"),
    addressCity: extractAddressPart(result.split_present_address, "city"),
    addressState: extractAddressPart(result.split_present_address, "state"),
    seatingCapacity: result.vehicle_seat_capacity || "",
    grossWeight: result.gross_vehicle_weight || "",
    unladenWeight: result.unladen_weight || "",
    cubicCapacity: result.vehicle_cubic_capacity || "",
    bodyType: result.body_type || "",
    insuranceUpto: result.vehicle_insurance_upto || "",
    previousInsurer: result.vehicle_insurance_company_name || "",
    previousPolicyNumber: result.vehicle_insurance_policy_number || "",
    permitType: result.permit_type || "",
    isCommercial: result.is_commercial ?? "",
    chassisNumber: result.chassis || "",
    engineNumber: result.engine || "",
    rcStatus: result.status || "",
    blacklistStatus: result.blacklist_status || "",
    financed: result.financed ?? "",
    rcFinancer: result.rc_financer || "",
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).end();
    }

    const { registrationNumber } = req.body;
    if (!registrationNumber) {
      return res
        .status(400)
        .json({ success: false, message: "registrationNumber is required" });
    }

    const rcNo = String(registrationNumber)
      .toUpperCase()
      .replace(/[-\s]/g, "");

    // Keep attempts LOW: each submission is a NEW order on RechargeKit's side
    // (fresh partner_request_id), potentially billed. When VAHAN is slow,
    // extra submissions just queue — they don't fetch the pending result.
    // The proper fix is the orderid status-check endpoint (ask RechargeKit).
    const MAX_ATTEMPTS = 2;
    let data: any = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      data = await callRechargeKit(rcNo); // fresh partner_request_id each time
      console.log(
        `RECHARGEKIT ATTEMPT ${attempt} status=${data.status} msg=${data.msg}`
      );

      if (data.status !== 2) break; // 1 = success, others = final failure
      if (attempt < MAX_ATTEMPTS) await sleep(4000);
    }

    // Still pending after server-side retries — frontend can poll again
    if (data.status === 2) {
      return res.status(200).json({
        success: false,
        pending: true,
        orderid: data.orderid,
        message: data.msg,
      });
    }

    if (data.status !== 1) {
      // Genuine failure (invalid RC, not found, etc.)
      return res.status(200).json({
        success: false,
        pending: false,
        message: data.msg || "RC verification failed",
      });
    }

    const result = data.cardData?.result || data.cardData || {};

    return res.status(200).json({
      success: true,
      data: normalizeRc(result),
    });
  } catch (error: any) {
    console.log("RC VERIFY ERROR", error.message);
    return res
      .status(500)
      .json({ success: false, pending: false, message: error.message });
  }
}