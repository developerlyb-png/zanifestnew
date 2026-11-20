// ============ src/lib/sbiGcv/client.ts ============
// Thin POST wrapper for SBI's plain-JSON cloud APIs. GCV uses the same
// host, client-id/secret and bearer token as SBI 4W (src/lib/sbiToken.ts).
import axios from "axios";
import { getSbiToken } from "@/lib/sbiToken";
import { sbiRequestHeader } from "./requestBuilder";

export async function sbiGcvPost(path: string, action: string, requestBody: any) {
  const payload = { RequestHeader: sbiRequestHeader(action), RequestBody: requestBody };
  console.log(`SBI GCV ${action} PAYLOAD`, JSON.stringify(payload));

  const token = await getSbiToken();
  const response = await axios.post(`${process.env.SBI_BASE_URL}${path}`, payload, {
    headers: {
      "Content-Type": "application/json",
      "X-IBM-Client-Id": process.env.SBI_CLIENT_ID,
      "X-IBM-Client-Secret": process.env.SBI_CLIENT_SECRET,
      Authorization: `Bearer ${token}`,
    },
    timeout: 90000,
  });
  console.log(`SBI GCV ${action} RESPONSE`, JSON.stringify(response.data).slice(0, 4000));
  return { payload, raw: response.data };
}
