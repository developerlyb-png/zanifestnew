import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

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
    const { orderId } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const token = await getZunoToken();

    const response = await axios.post(
      `${process.env.ZUNO_PAY_BASE_URL}/check-status`,
      { orderId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": process.env.ZUNO_PAY_X_API_KEY!,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("ZUNO PAY CHECK-STATUS RESPONSE", JSON.stringify(response.data, null, 2));

    return res.status(200).json({ success: true, data: response.data?.data });
  } catch (error: any) {
    console.log(
      "ZUNO PAY CHECK-STATUS ERROR",
      JSON.stringify(error.response?.data || error.message, null, 2),
    );

    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Could not check payment status",
      error: error.response?.data,
    });
  }
}
