import crypto from "crypto";

// Confirmed from SBI's own Java reference implementation (AES_GCM_Example.java,
// from the CKYC integration kit) — SBI uses AES/GCM/NoPadding, NOT AES-256-CBC
// as this file previously implemented. Key differences from the old CBC code:
//   - Cipher is aes-256-gcm, not aes-256-cbc
//   - Key/IV are used as raw UTF-8 bytes of the literal string (unchanged)
//   - GCM IV is 12 bytes (Java's GCM_IV_LENGTH) — the old 16-byte SBI_IV in
//     .env was sized for CBC's 16-byte IV requirement, not GCM's 12-byte one.
//     If SBI_IV isn't exactly 12 chars, this is almost certainly the wrong
//     value for GCM and needs to be re-confirmed against SBI's real credentials.
//   - Java's Cipher.doFinal() for GCM appends the 16-byte (128-bit) auth tag
//     to the end of the ciphertext before base64-encoding. Node's crypto
//     keeps the tag separate (cipher.getAuthTag()), so we manually
//     concatenate ciphertext+tag on encrypt and split them back apart on
//     decrypt to produce/consume the exact same base64 string SBI expects.
const GCM_TAG_LENGTH = 16; // bytes (128-bit tag)

const key = process.env.SBI_ENCRYPTION_KEY!;
const iv = process.env.SBI_IV!;

if (iv.length !== 12) {
  console.warn(
    `SBI_IV is ${iv.length} chars — SBI's GCM scheme expects a 12-byte IV. ` +
      `This value was likely set for the old (incorrect) CBC implementation.`
  );
}

export function encryptSBI(data: any): string {
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(key, "utf8"),
    Buffer.from(iv, "utf8"),
    { authTagLength: GCM_TAG_LENGTH }
  );

  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([ciphertext, authTag]).toString("base64");
}

export function decryptSBI(data: any): any {
  // SBI's own confirmed field name (from the CKYC integration kit) is
  // "ciphertext" — fall back to other keys seen in this codebase's existing
  // (unconfirmed) callers in case a given endpoint's response uses a
  // different wrapper.
  const encoded: string =
    typeof data === "string" ? data : data?.ciphertext ?? data?.response ?? data?.request ?? data;

  const combined = Buffer.from(encoded, "base64");
  const ciphertext = combined.subarray(0, combined.length - GCM_TAG_LENGTH);
  const authTag = combined.subarray(combined.length - GCM_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "utf8"),
    Buffer.from(iv, "utf8"),
    { authTagLength: GCM_TAG_LENGTH }
  );
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}
