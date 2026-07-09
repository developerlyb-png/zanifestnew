import type { NextApiRequest, NextApiResponse } from "next";

// =========================
// GENERATE OAUTH TOKEN
// =========================
async function getZunoToken() {
  const auth = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(
    `${process.env.ZUNO_BASE_URL}/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );

  const data = await response.json();

  console.log("TOKEN RESPONSE:");
  console.log(JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(
      data.error_description ||
        data.message ||
        "Unable to generate token"
    );
  }

  return data.access_token;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method Not Allowed",
      });
    }

    console.log("========== PAYMENT REQUEST ==========");
    console.log(JSON.stringify(req.body, null, 2));

    // =========================
    // GET TOKEN
    // =========================
    const token = await getZunoToken();

    console.log("TOKEN GENERATED:", token ? "YES" : "NO");

    // =========================
    // PAYMENT PAYLOAD
    // =========================

    const amount = parseFloat(
      String(req.body.amount)
        .replace(/[₹,]/g, "")
        .trim()
    ).toFixed(2);

    const paymentPayload = {
      transactionId: String(req.body.transactionId),

      amount,

      client: "MGCOI",

      customer: {
        name:
          req.body.customer?.fullName ||
          req.body.customer?.name ||
          "",

        email:
          req.body.customer?.email || "",

        mobile:
          req.body.customer?.mobile || "",
      },
    };

    const url = `${process.env.ZUNO_PAY_BASE_URL}/request-link`;

    console.log("URL:", url);
    console.log("TOKEN:", token ? "YES" : "NO");
    console.log(
      "API KEY:",
      process.env.ZUNO_PAY_X_API_KEY ? "YES" : "NO"
    );

    console.log(
      "PAYMENT PAYLOAD:"
    );
    console.log(
      JSON.stringify(paymentPayload, null, 2)
    );

    // =========================
    // PAYMENT REQUEST
    // =========================

    const response = await fetch(url, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": process.env.ZUNO_PAY_X_API_KEY!,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(paymentPayload),
    });

    console.log("PAYMENT STATUS:", response.status);

    const text = await response.text();

    console.log("PAYMENT RESPONSE:");
    console.log(text);

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        raw: text,
      };
    }

    return res.status(response.status).json({
      success: response.ok,
      data,
    });
  } catch (error: any) {
    console.log("PAYMENT ERROR");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Payment Failed",
      error: error.message,
    });
  }
}