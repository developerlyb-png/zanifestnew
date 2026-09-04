import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getSbiToken } from "@/lib/sbiToken";
import { buildSbi4wIssuanceBody, Sbi4wCkycTags } from "@/lib/sbi4wRequestBuilder";

// SBI Issuance ("getIssurance") — confirmed live from the M4W Postman
// collection: POST https://devapi.sbigeneral.in/cld/v1/issurance (the typo
// is real — matches RequestHeader.action "getIssurance" too). Plain JSON,
// same token/client-id/secret pattern as QuickQuote/FullQuote — Issuance
// isn't in the integration doc's encrypted-APIs list either. Must be called
// only after a successful FullQuote (for QuotationNo/Amount) and a captured
// payment reference (from the payment gateway).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const {
      quotationNo,
      amount,
      payerName,
      paymentReferenceNo,
      ckycTags,
    }: {
      quotationNo: string;
      amount: number;
      payerName: string;
      paymentReferenceNo: string;
      ckycTags?: Sbi4wCkycTags;
    } = req.body || {};

    if (!quotationNo || amount == null || !payerName || !paymentReferenceNo) {
      return res.status(400).json({
        success: false,
        message: "quotationNo, amount, payerName and paymentReferenceNo are required",
      });
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
        requestID: Date.now().toString(),
        action: "getIssurance",
        channel: "SBIG",
        transactionTimestamp,
      },
      RequestBody: buildSbi4wIssuanceBody({
        quotationNo,
        amount,
        payerName,
        paymentReferenceNo,
        ckycTags,
      }),
    };

    console.log("SBI 4W ISSUANCE PAYLOAD", JSON.stringify(payload));

    const accessToken = await getSbiToken();

    const response = await axios.post(
      `${process.env.SBI_BASE_URL}/cld/v1/issurance`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-IBM-Client-Id": process.env.SBI_CLIENT_ID,
          "X-IBM-Client-Secret": process.env.SBI_CLIENT_SECRET,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const result = response.data;
    console.log("SBI 4W ISSUANCE RAW RESPONSE", JSON.stringify(result));

    const isErrorPayload = typeof result?.code === "string";
    const policyNo = result?.PolicyNo;

    if (isErrorPayload || !policyNo) {
      return res.status(200).json({ success: false, error: result });
    }

    return res.status(200).json({
      success: true,
      policyNo,
      issueDate: result?.IssueDate,
      duePremium: result?.DuePremium,
      data: result,
    });
  } catch (error: any) {
    console.log("SBI 4W ISSUANCE ERROR", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
