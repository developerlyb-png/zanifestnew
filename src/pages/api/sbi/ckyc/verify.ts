import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getSbiToken } from "@/lib/sbiToken";
import { encryptSBI, decryptSBI } from "../common/encryption";

// Manual/OVD CKYC document upload — the fallback flow when Search Download/
// Fetch Record can't find or verify a CERSAI record. Confirmed field-for-field
// from SBI's own decrypted sample (Manual-CKYC-Sample.json, from the CKYC
// integration kit's "Manual CKYC" folder) for the fields it actually showed
// (that sample was for a corporate/legal-entity customer, though — customerType
// there was "26" for LE; per the kit's own field spec (SBIG_CKYC Offline
// Metadata_ver8.xlsx, sheet FL1), Individual customerType is "1"). Fields not
// present in that one sample but marked mandatory-for-Individual in the FL1
// spec are added below as best-effort camelCase versions of the doc's
// PascalCase names — flagged inline since their exact wire spelling isn't
// independently confirmed the way the sample-covered fields are.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const {
      sourceSysCustCode,
      firstName,
      middleName,
      lastName,
      prefix, // "Mr" | "Mrs" | "Ms" | "Mx"
      dob, // dd-MMM-yyyy
      fatherFirstName,
      fatherLastName,
      idType, // one of the Permanent-Address-Proof attachment codes below
      idNumber,
      pan,
      hasNoPan, // true => Form60 declared instead of PAN
      addressLine1,
      addressCity,
      addressPincode,
      idProofImageBase64,
      idProofImageExtension,
      photographImageBase64,
      photographImageExtension,
    } = req.body || {};

    if (!firstName || !lastName || !dob || !idType || !idNumber || !addressLine1 || !addressCity) {
      return res.status(400).json({
        success: false,
        message:
          "firstName, lastName, dob, idType, idNumber, addressLine1 and addressCity are required",
      });
    }
    if (!fatherFirstName || !fatherLastName) {
      // SBI's server rejects with "Either Father or Mother or Spouse Details
      // Mandatory For Individual" when all three are blank — Father's Name
      // is the field we collect since it applies regardless of marital status.
      return res.status(400).json({
        success: false,
        message: "Father's first and last name are required",
      });
    }
    if (!pan && !hasNoPan) {
      return res.status(400).json({
        success: false,
        message: "PAN is required, or confirm Form 60 was declared instead",
      });
    }
    if (!idProofImageBase64 || !photographImageBase64) {
      return res.status(400).json({
        success: false,
        message: "Both the ID proof document image and a photograph are required",
      });
    }

    // Client sends full "data:<mime>;base64,<data>" URLs (same convention as
    // createagent.tsx) — SBI's own sample embeds the raw base64 blob only.
    const stripDataUrlPrefix = (v: string) => (v.includes(",") ? v.split(",")[1] : v);
    const idProofBlob = stripDataUrlPrefix(idProofImageBase64);
    const photographBlob = stripDataUrlPrefix(photographImageBase64);

    const MONTHS = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];
    const now = new Date();
    const todayDdMmmYyyy = `${String(now.getDate()).padStart(2, "0")}-${
      MONTHS[now.getMonth()]
    }-${now.getFullYear()}`;

    // dd-MMM-yyyy-HH:mm:ss — same confirmed timestamp format as Motor's endpoints.
    const MONTHS3 = MONTHS.map((m) => m[0] + m.slice(1).toLowerCase());
    const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const transactionTimestamp = `${pad(ist.getUTCDate())}-${
      MONTHS3[ist.getUTCMonth()]
    }-${ist.getUTCFullYear()}-${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(
      ist.getUTCSeconds()
    )}`;

    const recordIdentifier = `ZFT${Date.now()}`;
    const genderFromPrefix = prefix === "Mrs" || prefix === "Ms" ? "F" : prefix === "Mx" ? "T" : "M";

    // Field names by ID-type code, matching the confirmed sample's structure
    // (only one of these carries the actual idNumber — the rest stay blank).
    const idFields = {
      passportNum: idType === "Passport" ? idNumber : "",
      voterIdCard: idType === "VoterID" ? idNumber : "",
      drivingLicenseNum: idType === "DrivingLicence" ? idNumber : "",
      aadhar: idType === "AadharCard" ? idNumber : "",
      nrega: idType === "NREGA" ? idNumber : "",
    };

    const payload = {
      RequestHeader: {
        requestID: Date.now().toString(),
        action: "rapiddocumentsupload",
        channel: "SBIG",
        transactionTimestamp,
      },
      RequestBody: {
        // ---- confirmed from the real decrypted sample ----
        sourceSysCustCode: sourceSysCustCode || recordIdentifier,
        ekycOtpBased: "0",
        customerType: "1", // Individual — confirmed via FL1 spec ("1- Individual")
        firstName: firstName || "",
        middleName: middleName || "",
        lastName: lastName || "",
        fatherFirstName: fatherFirstName || "",
        fatherMiddleName: "",
        fatherLastName: fatherLastName || "",
        spousePrefix: "",
        spouseFirstName: "",
        spouseMiddleName: "",
        spouseLastName: "",
        motherFirstName: "",
        motherMiddleName: "",
        motherLastName: "",
        dob,
        kycDateOfDeclaration: todayDdMmmYyyy,
        pmntAddProof: idType,
        ...idFields,
        pan: pan || "",
        minor: "0",
        recordIdentifier,
        formsixty: hasNoPan ? "1" : "0",
        custStatusEffDate: todayDdMmmYyyy,
        countryOfBirth: "",
        birthCity: "",
        compRegNum: "",
        proofOfIdSubmitted: "",
        cin: "",
        pmtAddProofOthersValue: "",
        // ---- best-effort additions (FL1 spec marks these mandatory for
        // Individual but they weren't present in the one — corporate —
        // sample we have; unconfirmed wire spelling) ----
        customerStatus: "Active",
        prefix: prefix || "Mr",
        gender: genderFromPrefix,
        kycPlaceOfDeclaration: "Zirakpur",
        kycVerificationDate: todayDdMmmYyyy,
        kycEmployeeName: "Zanifest",
        kycEmployeeDesignation: "Relationship Manager",
        kycVerificationBranch: "Zirakpur",
        kycEmployeeCode: "001", // UNCONFIRMED — may need a real SBI-assigned partner/employee code
        permanentAddressCountry: "IN",
        permanentAddressPinCode: addressPincode || "",
        permanentAddressLine1: addressLine1,
        permanentAddressCity: addressCity,
        correspondenceAddressCountry: "IN",
        correspondenceAddressPinCode: addressPincode || "",
        correspondenceAddressLine1: addressLine1,
        correspondenceAddressCity: addressCity,
        correspondenceAddressProof: idType,
        kycAttestationType: "04", // confirmed default for Individual per FL1 spec
        moduleApplicable: "CKYC", // confirmed fixed value per FL1 spec
        imgReqDetails: [
          {
            imageFileName: `${recordIdentifier}_${idType}_${Date.now()}`,
            imageExtension: idProofImageExtension || ".jpeg",
            attachmentCode: idType,
            attachmentBlob: idProofBlob,
          },
          {
            imageFileName: `${recordIdentifier}_Photograph_${Date.now()}`,
            imageExtension: photographImageExtension || ".jpeg",
            attachmentCode: "Photograph",
            attachmentBlob: photographBlob,
          },
        ],
      },
    };

    const token = await getSbiToken();

    const response = await axios.post(
      "https://devapi.sbigeneral.in/ept/ckycDocUpload/insertDataWithImage",
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

    if (result?.status !== "Success") {
      console.log("SBI CKYC MANUAL UPLOAD REJECTED", JSON.stringify(result));
      return res.status(200).json({
        success: false,
        message: result?.remark || result?.errorMessage || "Manual KYC document upload was not accepted",
        data: result,
      });
    }

    return res.status(200).json({
      success: true,
      referenceNumber: result.referenceNumber,
      recordIdentifier,
      data: result,
    });
  } catch (error: any) {
    console.log("SBI CKYC MANUAL UPLOAD ERROR", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
