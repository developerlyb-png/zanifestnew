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
    // Pass through whatever params the frontend supplies —
    // typically make, model, variant, idvCity (confirm exact names in docs)
    const params = new URLSearchParams(
      req.query as Record<string, string>
    ).toString();

    if (!params) {
      return res.status(400).json({ success: false, message: "params required" });
    }

    const token = await getZunoToken();

    const url = `${process.env.ZUNO_CAR_MASTER_URL}/idv?${params}`;
    console.log("4W IDV URL", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": process.env.ZUNO_CAR_API_KEY!,
      },
    });

    const text = await response.text();
    console.log("4W IDV STATUS", response.status);
    console.log("4W IDV RAW", text.slice(0, 3000));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(response.status).json(data);
  } catch (e: any) {
    console.log("4W IDV ERROR", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}