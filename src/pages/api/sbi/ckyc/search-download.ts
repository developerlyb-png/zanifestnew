import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import crypto from "crypto";
import { getSbiToken } from "@/lib/sbiToken";
import { encryptSBI, decryptSBI } from "../common/encryption";

// CKYC Search Download — confirmed field-for-field from SBI's own decrypted
// sample (otp-decripted-payload.json, from the CKYC integration kit). Unlike
// Motor's endpoints, CKYC's plaintext body has NO RequestHeader/RequestBody
// wrapper — it's CERSAI's own "A99RequestData" schema, encrypted whole via
// AES-256-GCM (see ../common/encryption.ts) into {"ciphertext": "<base64>"}.
//
// Flow: this call triggers a 6-digit OTP to the customer's CERSAI-registered
// mobile. The RequestId generated here must be reused as-is in the
// subsequent Fetch Record call (per the integration doc), so it's returned
// to the caller to carry forward.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const { idType, idNumber, mobileNumber } = req.body || {};
    if (!idType || !idNumber || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "idType, idNumber and mobileNumber are required",
      });
    }

    const requestId = crypto.randomUUID();

    const payload = {
      A99RequestData: {
        ApplicationRefNumber: "",
        BirthYear: "",
        DateOfBirth: "",
        FirstName: "",
        Gender: "",
        GetRecordType: "IND",
        InputIdNo: idNumber,
        InputIdType: idType,
        LastName: "",
        MiddleName: "",
        MobileNumber: mobileNumber,
        ParentCompany: "",
        Pincode: "",
        RequestId: requestId,
        ResultLimit: "Latest",
        Tags: "",
        source: "SBIG",
      },
    };

    const token = await getSbiToken();

    const response = await axios.post(
      "https://devapi.sbigeneral.in/cersai/A99/v3/SearchDownload",
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
    const downloadResult = result?.A99ResponseData?.CKYCDownloadResult;
    const searchResult = result?.A99ResponseData?.CKYCSearchResult;

    // "CKYCAvailable": "Yes" + status "OTPTriggeredByCKYC" is the positive
    // flow; anything else (no record found, invalid mobile) means the caller
    // should fall back to the manual OVD flow per the integration doc.
    const otpTriggered = downloadResult?.CKYCStatus === "OTPTriggeredByCKYC";

    return res.status(200).json({
      success: otpTriggered,
      requestId,
      ckycTransactionId: downloadResult?.CKYCTransactionID,
      status: downloadResult?.CKYCStatus,
      message: downloadResult?.CKYCSuccessDescription,
      ckycAvailable: searchResult?.CKYCAvailable,
      data: result,
    });
  } catch (error: any) {
    console.log("CKYC SEARCH DOWNLOAD ERROR", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
