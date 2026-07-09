import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const { registrationNumber } = req.body;
    const cleanNumber = String(registrationNumber || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    console.log("BIKE NUMBER SEND =>", cleanNumber);

    const partnerReqId = "BIKE" + Date.now();

    const submitRes = await fetch(
      "https://verify.rechargkit.biz/validation/rcAdvanceVerify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RECHARGEKIT_TOKEN}`,
        },
        body: JSON.stringify({ rc_no: cleanNumber, partner_request_id: partnerReqId }),
      }
    );

    const data = await submitRes.json();
    console.log("BIKE VAHAN SUBMIT", data);

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

    // Hard failure
    if (data.status !== 1 || !data.cardData?.result) {
      return res.status(400).json({
        success: false,
        message: data.msg || data.message || "RC not found",
        raw: data,
      });
    }

    // Success (rare on first call for advance APIs, but handle it)
    const r = data.cardData.result;
    return res.status(200).json({
      success: true,
      vehicle: {
        number: r.reg_no,
        brand: r.vehicle_manufacturer_name,
        model: r.model,
        fuel: r.type,
        engine: r.engine,
        chassis: r.chassis,
        year: r.vehicle_manufacturing_month_year,
        rto: r.reg_authority,
        cc: r.vehicle_cubic_capacity,
        rtoCode: r.rto_code,
        regDate: r.reg_date,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}