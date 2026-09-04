import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// Razorpay Order Creation — confirmed from SBI's own integration doc
// ("comman 2.html"): POST https://api.razorpay.com/v1/orders, Basic Auth
// with key_id:key_secret, amount in paise. Per that doc, SBIG itself issues
// the key_id/key_secret via a one-to-one email once requested — this is not
// a separate/independent merchant Razorpay account.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const { amountInRupees, quotationNo } = req.body || {};

    if (amountInRupees == null || !quotationNo) {
      return res.status(400).json({
        success: false,
        message: "amountInRupees and quotationNo are required",
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return res.status(500).json({
        success: false,
        message:
          "Razorpay UAT credentials are not configured yet — RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing in .env",
      });
    }

    const amountPaise = Math.round(Number(amountInRupees) * 100);
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await axios.post(
      "https://api.razorpay.com/v1/orders",
      {
        amount: amountPaise,
        currency: "INR",
        receipt: String(quotationNo).slice(0, 40),
        payment_capture: 1, // auto-capture — confirmed in the real captured Order request
        notes: {
          PartnerName: "SBIG",
          QuotationNumber: quotationNo,
          ProductName: "PMCAR001",
          AgreementCode: "6660",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const order = response.data;
    console.log("RAZORPAY ORDER CREATED", JSON.stringify(order));

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId, // public — required client-side by Razorpay Checkout.js
    });
  } catch (error: any) {
    console.log("RAZORPAY ORDER ERROR", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
