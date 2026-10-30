import type { NextApiRequest, NextApiResponse } from "next";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callRechargeKit(rcNo: string) {
  const partnerReqId = "BIKE" + Date.now() + Math.floor(Math.random() * 1000);
  const submitRes = await fetch(
    "https://verify.rechargkit.biz/validation/rcAdvanceVerify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RECHARGEKIT_TOKEN}`,
      },
      body: JSON.stringify({ rc_no: rcNo, partner_request_id: partnerReqId }),
    }
  );
  const data = await submitRes.json();
  return { data, partnerReqId };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const { registrationNumber } = req.body;
    const cleanNumber = String(registrationNumber || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    console.log("BIKE NUMBER SEND =>", cleanNumber);

    // RechargeKit's upstream VAHAN lookup is flaky — the same rc_no can fail
    // on one attempt (status 3, "RC Advance validation failed") and succeed
    // immediately on a fresh retry (confirmed live). Each attempt needs its
    // own partner_request_id (RechargeKit rejects reuse), and each is a new
    // order on their side, so keep retries low (matches cv-rc-verify.ts).
    const MAX_ATTEMPTS = 2;
    let data: any = null;
    let partnerReqId = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const result = await callRechargeKit(cleanNumber);
      data = result.data;
      partnerReqId = result.partnerReqId;
      console.log(`BIKE VAHAN ATTEMPT ${attempt} status=${data.status} msg=${data.msg}`, data);

      if (data.status === 1 || data.status === 2) break; // success or genuinely pending
      if (attempt < MAX_ATTEMPTS) await sleep(1500); // transient failure — retry fresh
    }

    // Pending — return the orderid so we can check status separately
    if (data.status === 2) {
      return res.status(202).json({
        success: false,
        pending: true,
        message: "RC verification is processing. Please try again in a moment.",
        orderid: data.orderid,
        partnerReqId,
      });
    }

    // RechargeKit nests the actual RC record two levels under cardData
    // (cardData.data.result) — confirmed against a real response. cardData.result
    // (one level shallower) is never populated, so checking that always failed.
    const record = data.cardData?.data?.result;

    // Hard failure (still failing after a retry)
    if (data.status !== 1 || !record) {
      return res.status(400).json({
        success: false,
        message: data.msg || data.message || "RC not found",
        raw: data,
      });
    }

    const vehicle = record.vehicle_details || {};
    const registration = record.registration_details || {};
    const owner = record.owner_details || {};

    return res.status(200).json({
      success: true,
      vehicle: {
        number: registration.rc_number || cleanNumber,
        brand: vehicle.maker,
        model: vehicle.model,
        fuel: vehicle.fuel_type,
        engine: vehicle.engine_number,
        chassis: vehicle.chassis_number,
        // Frontend reads this as "<month>/<year>" and splits on "/" for the year.
        year: vehicle.manufactured_date
          ? `${vehicle.manufactured_date.month}/${vehicle.manufactured_date.year}`
          : "",
        rto: registration.registered_at,
        cc: vehicle.cubic_capacity,
        rtoCode: cleanNumber.slice(0, 4),
        regDate: vehicle.registration_date,
        ownerName: owner.name,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}