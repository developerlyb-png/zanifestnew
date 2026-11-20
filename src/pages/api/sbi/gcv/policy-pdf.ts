// POST /api/sbi/gcv/policy-pdf — downloads the issued GCV policy document.
// Body: { policyNumber }. Encrypted endpoint (AES-256-GCM, key/IV from
// "GCM Encryption details.txt" = SBI_ENCRYPTION_KEY / SBI_IV), same as 4W.
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getSbiToken } from "@/lib/sbiToken";
import { encryptSBI, decryptSBI } from "../common/encryption";
import { SBI_GCV_PATHS, SBI_GCV_AGREEMENT_CODE, SBI_GCV_PRODUCT_CODE } from "@/lib/sbiGcv/constants";
import { sbiRequestHeader } from "@/lib/sbiGcv/requestBuilder";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { policyNumber, regenerate } = req.body || {};
  if (!policyNumber) {
    return res.status(400).json({ success: false, message: "policyNumber is required" });
  }

  try {
    const payload = {
      RequestHeader: sbiRequestHeader("getPDF"),
      RequestBody: {
        PolicyNumber: policyNumber,
        Regeneration: regenerate === false ? "N" : "Y",
        SourceSystem: "ZANIFEST",
        IntermediateCode: null,
        ProductName: SBI_GCV_PRODUCT_CODE,
        Offline: "N",
        AgreementCode: SBI_GCV_AGREEMENT_CODE,
      },
    };

    const token = await getSbiToken();
    const response = await axios.post(
      `${process.env.SBI_BASE_URL}${SBI_GCV_PATHS.pdf}`,
      { ciphertext: encryptSBI(payload) },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-IBM-Client-Id": process.env.SBI_CLIENT_ID,
          "X-IBM-Client-Secret": process.env.SBI_CLIENT_SECRET,
        },
        timeout: 90000,
      }
    );

    const result = decryptSBI(response.data);
    console.log("SBI GCV PDF STATUS", result?.StatusCode, result?.Description);

    if (result?.StatusCode !== "0" || !result?.DocBase64) {
      return res.status(200).json({
        success: false,
        message: result?.Description || "Could not retrieve the policy PDF",
        data: { ...result, DocBase64: undefined },
      });
    }
    return res.status(200).json({ success: true, docBase64: result.DocBase64, transactionId: result.TransactionID });
  } catch (error: any) {
    console.log("SBI GCV PDF ERROR", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
}
