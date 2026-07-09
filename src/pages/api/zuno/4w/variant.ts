import type { NextApiRequest, NextApiResponse } from "next";

async function getZunoToken() {
  const auth = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
  ).toString("base64");

  const r = await fetch(process.env.ZUNO_TOKEN_URL!, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const d = await r.json();
  return d.access_token;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { make, model } = req.query;
    if (!make || !model) {
      return res
        .status(400)
        .json({ success: false, message: "make and model required" });
    }

    const token = await getZunoToken();

    const url = `${process.env.ZUNO_CAR_MASTER_URL}/variant?make=${encodeURIComponent(
      String(make)
    )}&model=${encodeURIComponent(String(model))}`;
    console.log("4W VARIANT URL", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": process.env.ZUNO_CAR_API_KEY!,
      },
    });

    const text = await response.text();
    console.log("4W VARIANT STATUS", response.status);
    console.log("4W VARIANT RAW", text.slice(0, 2000));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(response.status).json(data);
  } catch (e: any) {
    console.log("4W VARIANT ERROR", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}