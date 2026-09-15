import type { NextApiRequest, NextApiResponse } from "next";
import { iciciHealthRequest, iciciClientSlug } from "@/lib/iciciHealth";

// Fetch the Certificate of Insurance (base64 PDF in the "COI" field) once a
// policy is issued.
//
// Real confirmed path is /generic/common/customer/{slug}/certificate/
// {TransactionId} — note this has NO "/health/" segment, unlike what IL's
// own PDF kit documents (.../certificate/health/{TransactionId}).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Only GET allowed" });
  }

  const { transactionId } = req.query;
  if (!transactionId || typeof transactionId !== "string") {
    return res.status(400).json({ success: false, message: "transactionId is required" });
  }

  try {
    const data = await iciciHealthRequest(
      `/generic/common/customer/${iciciClientSlug()}/certificate/${encodeURIComponent(transactionId)}`,
      undefined,
      "GET"
    );
    console.log("ICICI HEALTH CERTIFICATE RESPONSE STATUS", (data as any)?.Status);
    return res.status(200).json(data);
  } catch (err: any) {
    console.log("ICICI HEALTH CERTIFICATE ERROR", JSON.stringify(err.response?.data || err.message));
    return res.status(err.response?.status || 500).json({
      success: false,
      message: "Certificate fetch failed",
      error: err.response?.data || err.message,
    });
  }
}
