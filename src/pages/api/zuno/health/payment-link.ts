import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// Same OAuth requirement as the other health routes.
async function getZunoToken() {
  const basic = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`,
  ).toString("base64");

  const tokenResponse = await axios.post(
    process.env.ZUNO_TOKEN_URL!,
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-key": process.env.ZUNO_X_API_KEY!,
      },
    },
  );

  return tokenResponse.data.access_token;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const { transactionId, amount, customer } = req.body || {};

    if (!transactionId || amount == null || !customer) {
      return res.status(400).json({
        success: false,
        message: "transactionId, amount and customer are required",
      });
    }

    // Same ZunoPay product 2W/4W already use successfully — a generic,
    // insurer-hosted payment link, not tied to any one policy type.
    // "MGCOI" is this account's real ZunoPay client code, confirmed from
    // the existing working 2W integration (src/pages/api/sbi/2w/online-payment.ts).
    const paymentPayload = {
      transactionId: String(transactionId),
      amount: parseFloat(String(amount)).toFixed(2),
      client: "MGCOI",
      customer: {
        name: customer.fullName || customer.name || "",
        email: customer.email || "",
        mobile: customer.mobile || "",
      },
    };

    console.log("ZUNO PAY REQUEST-LINK PAYLOAD", JSON.stringify(paymentPayload, null, 2));

    const token = await getZunoToken();

    const response = await axios.post(
      `${process.env.ZUNO_PAY_BASE_URL}/request-link`,
      paymentPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": process.env.ZUNO_PAY_X_API_KEY!,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("ZUNO PAY REQUEST-LINK RESPONSE", JSON.stringify(response.data, null, 2));

    return res.status(200).json({ success: true, data: response.data?.data });
  } catch (error: any) {
    console.log(
      "ZUNO PAY REQUEST-LINK ERROR",
      JSON.stringify(error.response?.data || error.message, null, 2),
    );

    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Could not create payment link",
      error: error.response?.data,
    });
  }
}
