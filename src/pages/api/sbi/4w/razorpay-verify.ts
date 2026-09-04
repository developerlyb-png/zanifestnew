import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import axios from "axios";

// Verifies a Razorpay Checkout.js completion signature, then confirms the
// payment is actually captured before handing back a payment reference for
// SBI's Issuance API. Standard Razorpay verification: HMAC-SHA256 of
// "order_id|payment_id" using key_secret must equal razorpay_signature.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay UAT credentials are not configured yet",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(200).json({ success: false, message: "Payment signature verification failed" });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const paymentRes = await axios.get(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const payment = paymentRes.data;
    console.log("RAZORPAY PAYMENT FETCHED", JSON.stringify(payment));

    if (payment.status === "authorized" && !payment.captured) {
      // Manual-capture mode — capture now for the full authorized amount.
      const captureRes = await axios.post(
        `https://api.razorpay.com/v1/payments/${razorpay_payment_id}/capture`,
        { amount: payment.amount, currency: payment.currency },
        { headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` } }
      );
      console.log("RAZORPAY PAYMENT CAPTURED", JSON.stringify(captureRes.data));
      return res.status(200).json({
        success: true,
        paymentId: razorpay_payment_id,
        amount: captureRes.data.amount / 100,
        status: captureRes.data.status,
      });
    }

    if (payment.status !== "captured") {
      return res.status(200).json({
        success: false,
        message: `Payment is not captured (status: ${payment.status})`,
      });
    }

    return res.status(200).json({
      success: true,
      paymentId: razorpay_payment_id,
      amount: payment.amount / 100,
      status: payment.status,
    });
  } catch (error: any) {
    console.log("RAZORPAY VERIFY ERROR", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
