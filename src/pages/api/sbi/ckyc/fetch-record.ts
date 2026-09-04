import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getSbiToken } from "@/lib/sbiToken";
import { encryptSBI, decryptSBI } from "../common/encryption";

// CKYC Fetch Record — confirmed field-for-field from SBI's own decrypted
// sample (otp-decripted-payload.json). Called after Search Download triggers
// an OTP; the customer enters the OTP and it's submitted here along with the
// SAME CKYCTransactionID and RequestId that Search Download returned (the
// integration doc requires reusing that RequestId — it later becomes
// CKYCUniqueId in the FullQuote/Issuance payloads).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const {
      idType,
      idNumber,
      ckycTransactionId,
      requestId,
      otp,
      isResendOtp,
    } = req.body || {};

    if (!idType || !idNumber || !ckycTransactionId || !requestId) {
      return res.status(400).json({
        success: false,
        message: "idType, idNumber, ckycTransactionId and requestId are required",
      });
    }
    if (!otp && !isResendOtp) {
      return res.status(400).json({ success: false, message: "otp is required" });
    }

    const payload = {
      A99RequestData: {
        ApplicationRefNumber: "",
        CKYCTransactionID: ckycTransactionId,
        GetRecordType: "IND",
        InputIdNo: idNumber,
        InputIdType: idType,
        IsResendOTP: isResendOtp ? "Y" : "",
        OTP: otp || "",
        ParentCompany: "",
        RequestId: requestId,
        ResultLimit: "Latest",
        Tags: "",
        source: "SBIG",
      },
    };

    const token = await getSbiToken();

    const response = await axios.post(
      "https://devapi.sbigeneral.in/cersai/A99/v3/fetchrecord",
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
    const record = result?.A99ResponseData?.CKYCDownloadResult;

    if (!record || record.CKYCStatus !== "CKYCSuccess") {
      return res.status(200).json({
        success: false,
        message: "CKYC record fetch was not successful — wrong/expired OTP, or redirect to manual OVD",
        data: result,
      });
    }

    // FullQuote validates PolicyCustomerList[0].DOCTypeId against a table SBI
    // calls "T_CKYC_DOCTYPE" — confirmed live that CERSAI's own single-letter
    // code (e.g. "E" for Aadhaar) is rejected as out of range. No file named
    // exactly that exists in the integration kit, but SBI_T_PartyIDType (a
    // real master-data table) uses this numeric scheme and a genuine
    // captured FullQuote sample sent "IdType": "1" for a PAN holder,
    // matching PartyIDType's PAN=1 exactly — best-evidenced mapping we have,
    // still unconfirmed for this specific field name. CERSAI's "Z" (CKYC
    // Identifier) has no analog in PartyIDType — left unmapped.
    const CERSAI_TO_PARTY_ID_TYPE: Record<string, string> = {
      A: "2", // Passport
      B: "4", // Voter ID
      C: "1", // PAN
      D: "6", // Driving License
      E: "5", // Gov UID (Aadhaar)
    };
    const cersaiIdType = record.CKYCIDDetails?.CKYCIdentityDetails?.CKYCIDType;

    // These are exactly the tags the integration doc says must be carried
    // forward into FullQuote/Issuance — assembled here so the caller
    // doesn't have to re-derive them.
    const ckycTagsForFullQuote = {
      CKYCVerified: "Y",
      KYCCKYCNo: record.CKYCNumber,
      DOCTypeId: CERSAI_TO_PARTY_ID_TYPE[cersaiIdType] || "",
      DOCTypeName: record.CKYCIDDetails?.CKYCIdentityDetails?.CKYCIDNumber,
      CKYCUniqueId: requestId,
      CKYCSourceType: "SBIG",
    };

    return res.status(200).json({
      success: true,
      ckycNumber: record.CKYCNumber,
      fullName: record.CKYCFullName,
      dob: record.CKYCDOB,
      gender: record.CKYCGender,
      email: record.CKYCEmailAdd,
      mobile: record.CKYCMobileNumber,
      correspondenceAddress: {
        line1: record.CKYCCorAdd1,
        line2: record.CKYCCorAdd2,
        line3: record.CKYCCorAdd3,
        city: record.CKYCCorAddCity,
        district: record.CKYCCorAddDistrict,
        state: record.CKYCCorAddState,
        pincode: record.CKYCCorAddPin,
        country: record.CKYCCorAddCountry,
      },
      idType: record.CKYCIDDetails?.CKYCIdentityDetails?.CKYCIDType,
      idNumber: record.CKYCIDDetails?.CKYCIdentityDetails?.CKYCIDNumber,
      ckycTagsForFullQuote,
      data: result,
    });
  } catch (error: any) {
    console.log("CKYC FETCH RECORD ERROR", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
