import crypto from "crypto";
import jwt from "jsonwebtoken";

// Bajaj KYC 2.0 (api.uat.bajajgeneral.com/csckyc). Every request and response
// body is {"payload": "<base64 AES-128-CBC>"}; the Auth header is a fresh
// HS512 JWT. Confirmed live on UAT: the token subject must be
// "KYC_WS_BROKER" (subject "KYC", as in Bajaj's Java sample, gets an empty reply).

const aesKey = () => Buffer.from(process.env.BAJAJ_KYC_AES_KEY || "", "utf8");
const aesIv = () => Buffer.from(process.env.BAJAJ_KYC_AES_IV || "", "utf8");

export function bajajKycEncrypt(data: unknown) {
  const cipher = crypto.createCipheriv("aes-128-cbc", aesKey(), aesIv());
  return Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]).toString("base64");
}

// Bajaj pads with ISO10126 (random filler, last byte = pad length), which
// Node's PKCS7 check rejects — strip the padding by its length byte instead.
export function bajajKycDecrypt(base64: string) {
  const decipher = crypto.createDecipheriv("aes-128-cbc", aesKey(), aesIv());
  decipher.setAutoPadding(false);
  const out = Buffer.concat([decipher.update(Buffer.from(base64, "base64")), decipher.final()]);
  const pad = out[out.length - 1];
  return JSON.parse(out.subarray(0, out.length - (pad > 0 && pad <= 16 ? pad : 0)).toString("utf8"));
}

export type BajajKycEndpoint = "kycOtpValidate" | "kycValidate" | "verifyPOIStatus" | "verifyPOAUpload";

export async function callBajajKyc(endpoint: BajajKycEndpoint, body: Record<string, unknown>) {
  const secret = process.env.BAJAJ_KYC_JWT_SECRET;
  if (!secret || !process.env.BAJAJ_KYC_AES_KEY) throw new Error("Bajaj KYC is not configured");

  // Bajaj's sample backdates iat by 12s for clock skew; tokens last 30 minutes
  const iat = Math.floor(Date.now() / 1000) - 12;
  const token = jwt.sign({ sub: "KYC_WS_BROKER", iat, exp: iat + 30 * 60 }, secret, { algorithm: "HS512" });

  const res = await fetch(`${process.env.BAJAJ_KYC_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      BusinessCorelationId: crypto.randomUUID(),
      Auth: `Bearer ${token}`,
    },
    body: JSON.stringify({ payload: bajajKycEncrypt({ appType: "KYC_WS_BROKER", ...body }) }),
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  if (!text) throw new Error(`Bajaj KYC ${endpoint} returned an empty response (HTTP ${res.status})`);
  const envelope = JSON.parse(text);
  if (!envelope.payload) throw new Error(`Bajaj KYC ${endpoint} returned no payload (HTTP ${res.status})`);
  return bajajKycDecrypt(envelope.payload);
}

// Stateless proof that KYC passed for a Bajaj transaction: the KYC route
// signs it, issue-policy checks it before issuing (no DB needed).
const proofSecret = () => `${process.env.JWT_SECRET}:bajaj-kyc`;

export function signBajajKycProof(transactionId: string) {
  return jwt.sign({ txn: transactionId }, proofSecret(), { expiresIn: "2h" });
}

export function verifyBajajKycProof(proof: string, transactionId: string) {
  try {
    return (jwt.verify(proof, proofSecret()) as any).txn === transactionId;
  } catch {
    return false;
  }
}
