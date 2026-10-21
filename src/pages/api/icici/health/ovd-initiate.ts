import type { NextApiRequest, NextApiResponse } from "next";
import { getIciciHealthToken, iciciHealthBaseUrl, iciciClientSlug } from "@/lib/iciciHealth";

// Fallback KYC path when ckyc.ts finds no CKYC record — upload identity +
// address proof documents directly.
//
// UNCONFIRMED — this is the one endpoint in the kit we haven't live-tested.
// IL's PDF types ProofOfIdentify/ProofOfAddress as "File" (implying
// multipart/form-data) while also labeling Content-Type as application/json
// for every endpoint in the doc, including this one — almost certainly a
// copy-paste artifact rather than the real content type here. This route
// assumes the frontend sends base64 file data (this app's usual convention)
// and repackages it as multipart/form-data before calling IL, since "File"
// fields essentially always mean multipart in practice. Verify against a
// real UAT call before relying on this in production — if IL actually wants
// base64 strings in a plain JSON body instead, this needs to change.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

const dataUriToBlob = (dataUri: string): { blob: Blob; ext: string } => {
  const [header, base64] = dataUri.split(",");
  const mime = header.match(/data:(.*);base64/)?.[1] || "application/octet-stream";
  const bytes = Buffer.from(base64, "base64");
  const ext = mime.split("/")[1] || "bin";
  return { blob: new Blob([bytes], { type: mime }), ext };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const {
      quoteTransactionId,
      proofOfIdentityType,
      proofOfAddressType,
      proofOfIdentityFile, // data URI (base64)
      proofOfAddressFile, // data URI (base64)
    } = req.body || {};

    if (!quoteTransactionId || !proofOfIdentityType || !proofOfAddressType) {
      return res.status(400).json({
        success: false,
        message: "quoteTransactionId, proofOfIdentityType and proofOfAddressType are required",
      });
    }
    if (!proofOfIdentityFile || !proofOfAddressFile) {
      return res.status(400).json({ success: false, message: "Both proof files are required" });
    }

    const token = await getIciciHealthToken();
    const identity = dataUriToBlob(proofOfIdentityFile);
    const address = dataUriToBlob(proofOfAddressFile);

    const form = new FormData();
    form.append("quoteTransactionId", quoteTransactionId);
    form.append("ProofOfIdentityType", proofOfIdentityType);
    form.append("ProofOfAddressType", proofOfAddressType);
    form.append("ProofOfIdentify", identity.blob, `identity.${identity.ext}`);
    form.append("ProofOfAddress", address.blob, `address.${address.ext}`);

    const uploadRes = await fetch(
      `${iciciHealthBaseUrl()}/generic/common/ckyc/${iciciClientSlug()}/health/ovdinitiate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }
    );
    const data = await uploadRes.json();
    console.log("ICICI HEALTH OVD-INITIATE RESPONSE", JSON.stringify(data));

    if (!uploadRes.ok) {
      return res.status(uploadRes.status).json({ success: false, message: "OVD upload failed", error: data });
    }
    return res.status(200).json(data);
  } catch (err: any) {
    console.log("ICICI HEALTH OVD-INITIATE ERROR", err.message);
    return res.status(500).json({ success: false, message: "OVD upload failed", error: err.message });
  }
}
