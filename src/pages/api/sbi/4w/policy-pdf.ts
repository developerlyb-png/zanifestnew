import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getSbiToken } from "@/lib/sbiToken";
import { encryptSBI, decryptSBI } from "../common/encryption";

// SBI PDF Download ("getPDF") — confirmed from SBI's own integration doc:
// POST https://devapi.sbigeneral.in/ept/getPDFArgCd, encrypted (this is one
// of the 4 APIs the doc explicitly lists as encrypted: CKYC Search, CKYC
// Fetch, OVD, and PDF Download — unlike QuickQuote/FullQuote/Issuance, which
// are plain JSON). Returns the actual issued-policy document as base64.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const { policyNumber, regenerate } = req.body || {};
    if (!policyNumber) {
      return res.status(400).json({ success: false, message: "policyNumber is required" });
    }

    const MONTHS = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const transactionTimestamp = `${pad(ist.getUTCDate())}-${
      MONTHS[ist.getUTCMonth()]
    }-${ist.getUTCFullYear()}-${pad(ist.getUTCHours())}:${pad(
      ist.getUTCMinutes()
    )}:${pad(ist.getUTCSeconds())}`;

    const payload = {
      RequestHeader: {
        action: "getPDF",
        channel: "SBIG",
        requestID: Date.now().toString(),
        transactionTimestamp,
      },
      RequestBody: {
        AgreementCode: "6660",
        IntermediateCode: null,
        Offline: "Y",
        PolicyNumber: policyNumber,
        ProductName: "PMCAR001", // confirmed 4W product code (the doc's own sample used a different product's code)
        Regeneration: regenerate === false ? "N" : "Y",
        SourceSystem: "ZANIFEST",
      },
    };

    const token = await getSbiToken();

    const response = await axios.post(
      "https://devapi.sbigeneral.in/ept/getPDFArgCd",
      { ciphertext: encryptSBI(payload) },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-IBM-Client-Id": process.env.SBI_CLIENT_ID,
          "X-IBM-Client-Secret": process.env.SBI_CLIENT_SECRET,
        },
      }
    );

    const result = decryptSBI(response.data);
    console.log("SBI 4W PDF RESPONSE STATUS", result?.StatusCode, result?.Description);

    if (result?.StatusCode !== "0" || !result?.DocBase64) {
      return res.status(200).json({
        success: false,
        message: result?.Description || "Could not retrieve the policy PDF",
        data: result,
      });
    }

    return res.status(200).json({
      success: true,
      docBase64: result.DocBase64,
      transactionId: result.TransactionID,
    });
  } catch (error: any) {
    console.log("SBI 4W PDF ERROR", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
