import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    const {
      proposalNumber,
      amount,
    } = req.body;

    // MOCK PAYMENT LINK

    const paymentData = {
      paymentUrl:
"http://localhost:3000/payment-success",

      transactionId:
        "TXN" + Date.now(),

      amount,
      status: "PENDING",
    };

    return res.status(200).json({
      success: true,
      data: paymentData,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}