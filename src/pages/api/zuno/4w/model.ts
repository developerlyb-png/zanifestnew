import type { NextApiRequest, NextApiResponse } from "next";
import { friendlyMessage, errorStatus } from "@/utils/friendlyError";

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
    const { make } = req.query;
    if (!make) {
      return res.status(400).json({ success: false, message: "make required" });
    }

    let token: string | null = null;
    try {
      token = await getZunoToken();
    } catch (e) {
      console.log("4W TOKEN FETCH FAILED", e);
    }
    console.log("4W MODEL TOKEN:", token ? "YES" : "NO/UNDEFINED");

    const url = `${process.env.ZUNO_CAR_MASTER_URL}/model?make=${encodeURIComponent(
      String(make)
    )}`;
    console.log("4W MODEL URL", url);

    const headers: Record<string, string> = {
      "x-api-key": process.env.ZUNO_CAR_API_KEY!,
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, { headers });

    const text = await response.text();
    console.log("4W MODEL STATUS", response.status);
    console.log("4W MODEL RAW", text.slice(0, 2000));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(response.status).json(data);
  } catch (e: any) {
    console.log("4W MODEL ERROR", e);
    return res.status(errorStatus(e, 500)).json({ success: false, message: friendlyMessage(e) });
  }
}