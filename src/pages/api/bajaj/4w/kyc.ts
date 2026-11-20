import type { NextApiRequest, NextApiResponse } from "next";
import { callBajajKyc, signBajajKycProof } from "@/lib/bajajKyc";
import { friendlyMessage, errorStatus } from "@/utils/friendlyError";

// upload-poa carries the document as base64 (up to ~6 MB); Next's default
// API body limit is 1 MB
export const config = { api: { bodyParser: { sizeLimit: "8mb" } } };

// Bajaj KYC 2.0 for a motor proposal. Every call is tied to the proposal by
// fieldValue = the Bajaj transaction id from issue-policy's "price" step.
//   send-otp    kycOtpValidate  -> otpId (OTP goes to the customer's mobile)
//   verify-otp  kycValidate     -> KYC_SUCCESS ends KYC
//   verify-pan  verifyPOIStatus -> fallback when the OTP route fails
//   upload-poa  verifyPOAUpload -> address-proof document completes the fallback
// On success the response carries `kycProof`, which issue-policy requires.

// Bajaj mixes casing and snake_case between endpoints (errCode / errorCode,
// kycStatus / kyc_status) — read keys ignoring both.
const pick = (obj: any, ...keys: string[]) => {
  if (!obj || typeof obj !== "object") return undefined;
  const norm = (s: string) => s.toLowerCase().replace(/_/g, "");
  for (const key of keys) {
    const k = Object.keys(obj).find((x) => norm(x) === norm(key));
    if (k && obj[k] != null && obj[k] !== "") return obj[k];
  }
  return undefined;
};

const DOC_CODES: Record<string, string> = { PAN: "C", AADHAAR: "E", DL: "D", PASSPORT: "A", VOTER: "B" };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const b = req.body || {};
  const transactionId = String(b.transactionId || "");
  const fullName = String(b.fullName || "").replace(/^(mr|mrs|ms|dr)\.?\s+/i, "").trim();
  if (!/^\d+$/.test(transactionId)) {
    return res.status(400).json({ success: false, message: "transactionId is required" });
  }

  const common = {
    fieldType: "PROPOSAL_NUMBER",
    fieldValue: transactionId,
    customerType: "I",
    businessType: b.isNew ? "NB" : "OTRNW", // new car / renewal from another insurer
    customerfullName: fullName,
    nameAsPerKyc: "No", // Bajaj matches the KYC name against the proposal name
  };
  // eKYC is Aadhaar-based; a PAN has to go through the CKYC registry — as in
  // Bajaj's own samples (Aadhaar + EKYC, PAN + CKYC). PAN sent with EKYC
  // fails with "Somthing Went Wrong from Kyc OTP Service!!" (seen live).
  // Above ₹50,000 premium Bajaj requires CKYC regardless.
  const kycMode = b.docType === "PAN" || Number(b.premium) > 50000 ? "CKYC" : "EKYC";

  try {
    let data: any;
    let success = false;

    switch (b.action) {
      case "send-otp": {
        const docTypeCode = DOC_CODES[b.docType];
        if (docTypeCode !== "C" && docTypeCode !== "E") {
          return res.status(400).json({ success: false, message: "Use PAN or Aadhaar for OTP KYC" });
        }
        if (!/^[6-9]\d{9}$/.test(String(b.mobile || ""))) {
          return res.status(400).json({ success: false, message: "A valid 10-digit mobile is required" });
        }
        data = await callBajajKyc("kycOtpValidate", {
          ...common,
          docTypeCode,
          docNumber: String(b.docNumber || "").toUpperCase(),
          mobileNo: String(b.mobile),
          kycMode,
          premiumAmount: String(Math.round(Number(b.premium) || 0)),
        });
        success = !!pick(data, "otpId") && /sent/i.test(String(pick(data, "otpStatus") || ""));
        break;
      }
      case "verify-otp": {
        data = await callBajajKyc("kycValidate", {
          fieldType: common.fieldType,
          fieldValue: transactionId,
          kycMode,
          verificationMode: "kyc",
          docTypeCode: DOC_CODES[b.docType],
          docNumber: String(b.docNumber || "").toUpperCase(),
          kycOtpId: String(b.otpId || ""),
          otp: String(b.otp || ""),
          ekycStatus: "",
          ekycId: "",
          ckycStatus: "",
          ckycDownloadId: "",
        });
        success = /KYC_SUCCESS/i.test(String(pick(data, "kycStatus") || ""));
        break;
      }
      case "verify-pan": {
        const poiBody = {
          ...common,
          docTypeCode: "C",
          docNumber: String(b.docNumber || "").toUpperCase(),
          kycMode: "kyc",
        };
        data = await callBajajKyc("verifyPOIStatus", poiBody);
        // Seen live: "POI failed" (051) after ~18s, then the identical request
        // succeeded seconds later — Bajaj's PAN lookup timing out upstream.
        if (String(pick(data, "errCode", "errorCode")) === "051") {
          console.log("BAJAJ KYC verify-pan 051, retrying once", transactionId);
          data = await callBajajKyc("verifyPOIStatus", poiBody);
        }
        // POI alone doesn't finish KYC — the address proof upload does
        success = /FOUND/i.test(String(pick(data, "poiStatus") || "")) && String(pick(data, "errCode", "errorCode")) === "0";
        break;
      }
      case "upload-poa": {
        const docTypeCode = DOC_CODES[b.docType];
        if (!docTypeCode || docTypeCode === "C") {
          return res.status(400).json({ success: false, message: "Choose an address proof document" });
        }
        const base64 = String(b.documentBase64 || "").replace(/^data:[^,]*,/, "");
        if (!base64 || base64.length > 6 * 1024 * 1024) {
          return res.status(400).json({ success: false, message: "Upload a document image under 4 MB" });
        }
        data = await callBajajKyc("verifyPOAUpload", {
          ...common,
          docTypeCode,
          docCategory: docTypeCode === "E" || docTypeCode === "A" ? "POI_POA" : "POA",
          documentArray: base64,
          premiumAmount: String(Math.round(Number(b.premium) || 0)),
        });
        // Bajaj's sample success has kycStatus null but errMsg "KYC Success"
        success =
          /KYC_SUCCESS/i.test(String(pick(data, "kycStatus") || "")) ||
          (/FOUND/i.test(String(pick(data, "poaStatus") || "")) && /success/i.test(String(pick(data, "errMsg", "errorMessage") || "")));
        break;
      }
      default:
        return res.status(400).json({ success: false, message: "Unknown action" });
    }

    console.log(`BAJAJ KYC ${b.action}`, transactionId, JSON.stringify({ ...data, customerDetails: data?.customerDetails ? "<redacted>" : undefined, customer_details: undefined }));

    const finished = success && (b.action === "verify-otp" || b.action === "upload-poa");

    // Bajaj's send-OTP failure is always the same generic text; tell the
    // customer what they can actually change
    const bajajMsg = String(pick(data, "errorMessage", "errMsg") || "");
    const friendly =
      b.action === "send-otp" && /mobile number .*does not exist/i.test(bajajMsg)
        ? "This mobile number isn't the one on your CKYC record. Enter the mobile registered with CKYC, try Aadhaar instead, or verify with documents."
        : b.action === "send-otp" && /went wrong/i.test(bajajMsg)
        ? `Bajaj couldn't send an OTP for this ${b.docType === "PAN" ? "PAN" : "Aadhaar"}. Check that the mobile number is the one linked to it, or try ${b.docType === "PAN" ? "Aadhaar" : "PAN"} instead.`
        : bajajMsg;
    return res.status(200).json({
      success,
      otpId: pick(data, "otpId"),
      kycStatus: pick(data, "kycStatus"),
      message: success ? undefined : friendly || "Bajaj couldn't verify these details",
      nameMatch: pick(data, "nameMatchDetails"),
      ...(finished ? { kycProof: signBajajKycProof(transactionId) } : {}),
    });
  } catch (err: any) {
    console.log("BAJAJ KYC ERROR", b.action, err.message);
    return res.status(errorStatus(err, 502)).json({ success: false, message: friendlyMessage(err) });
  }
}
