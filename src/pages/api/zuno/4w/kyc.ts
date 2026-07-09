import type { NextApiRequest, NextApiResponse } from "next";

async function getZunoToken() {
  const auth = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${process.env.ZUNO_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "x-api-key": process.env.ZUNO_SIGNZY_X_API_KEY!, // Signzy key here
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();
  return data.access_token;
}

function toDdMmYyyy(d: string) {
  const m = String(d || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ success: false });

    const c = req.body.customer || {};
    if (!c.pan || !c.dateOfBirth || !c.fullName) {
      return res.status(400).json({
        success: false,
        message: "pan, dateOfBirth and fullName are required for KYC",
      });
    }

    const token = await getZunoToken();

    // Signzy PAN-based e-KYC payload (verify exact field names from Zuno swagger)
   const kycPayload = {
  source: process.env.ZUNO_SOURCE_CODE!, // e.g. "PROBUS" — ask Zuno for YOUR code
  leadId: `KYC${Date.now()}`,

  kycId: {
    idType: "pan",
    idNumber: String(c.pan).toUpperCase().trim(),
  },
  proposer: {
    name: c.fullName,
    mobileNum: c.mobile || "",
    email: c.email || "",
    proposerType: "I",
    // gender: c.gender || "",
    dobDoi: toDdMmYyyy(c.dateOfBirth).replace(/-/g, "/"), // dd/mm/yyyy
  },
  additional: {
    redirectUrl: "",
  },
};
console.log(kycPayload);
    const response = await fetch(
    
      `${process.env.ZUNO_SIGNZY_BASE_URL}/e-kyc`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-api-key": process.env.ZUNO_SIGNZY_X_API_KEY!,
          version:"3",
        },
        body: JSON.stringify(kycPayload),
      }
    );

    const text = await response.text();
    console.log("SIGNZY KYC STATUS", response.status);
    console.log("SIGNZY KYC RAW", text.slice(0, 4000));
    

    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    return res.status(response.status).json({ success: response.ok, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}