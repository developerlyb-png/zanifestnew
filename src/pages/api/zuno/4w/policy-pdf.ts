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

// Recursively hunt for a base64 PDF string anywhere in a JSON response
function findBase64Pdf(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string") {
    // base64 PDFs start with "JVBERi" ("%PDF" encoded) and are long
    if (obj.startsWith("JVBERi") && obj.length > 1000) return obj;
    return "";
  }
  if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      const found = findBase64Pdf(obj[key]);
      if (found) return found;
    }
  }
  return "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST" });
  }

  try {
    const { policyNo } = req.body;

    if (!policyNo) {
      return res
        .status(400)
        .json({ success: false, message: "policyNo is required" });
    }

    // Endpoint name from Zuno swagger — override via env if different
    // (common candidates: download-policy, policy-pdf, policy-schedule)
    const endpoint = process.env.ZUNO_PDF_ENDPOINT || "download-policy";
    const url = `${process.env.ZUNO_MOTOR_URL}/${endpoint}`;

    const token = await getZunoToken();

    // Superset payload — policy number under the common key variants
    const payload = {
      policyNo: String(policyNo),
      policyNumber: String(policyNo),
      policynrTt: String(policyNo),
    };

    console.log("4W PDF CALLING", url);
    console.log("4W PDF PAYLOAD", JSON.stringify(payload));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-api-key": process.env.ZUNO_MOTOR_API_KEY!,
      },
      body: JSON.stringify(payload),
    });

    console.log("4W PDF STATUS", response.status);
    const contentType = response.headers.get("content-type") || "";
    console.log("4W PDF CONTENT-TYPE", contentType);

    // Case 1: Zuno streams the raw PDF bytes directly
    if (contentType.includes("application/pdf")) {
      const buf = Buffer.from(await response.arrayBuffer());
      return res.status(200).json({
        success: true,
        pdfBase64: buf.toString("base64"),
        fileName: `policy-${policyNo}.pdf`,
      });
    }

    // Case 2: JSON response containing a base64 PDF somewhere
    const text = await response.text();
    console.log("4W PDF RAW", text.slice(0, 2000));

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ success: false, data });
    }

    const pdfBase64 = findBase64Pdf(data);

    if (pdfBase64) {
      return res.status(200).json({
        success: true,
        pdfBase64,
        fileName: `policy-${policyNo}.pdf`,
      });
    }

    // Case 3: JSON contains a download URL instead of the file
    const findUrl = (o: any): string => {
      if (!o) return "";
      if (typeof o === "string")
        return /^https?:\/\/.*\.pdf/i.test(o) || /download/i.test(o)
          ? o
          : "";
      if (typeof o === "object") {
        for (const k of Object.keys(o)) {
          const f = findUrl(o[k]);
          if (f) return f;
        }
      }
      return "";
    };
    const pdfUrl = findUrl(data);

    if (pdfUrl) {
      return res.status(200).json({ success: true, pdfUrl, data });
    }

    // Nothing recognizable — return raw so we can inspect the shape
    return res.status(200).json({
      success: false,
      message: "No PDF found in response — check data shape",
      data,
    });
  } catch (e: any) {
    console.log("4W PDF ERROR", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}