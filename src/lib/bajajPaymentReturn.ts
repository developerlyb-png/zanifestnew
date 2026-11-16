import type { NextApiRequest, NextApiResponse } from "next";
import { recordBajajPolicy, markBajajPaidWithoutPolicy } from "@/lib/bajajPolicyRecord";

// Bajaj's return carries several success flags (seen live: p_pay_status=Y,
// vg_payStatus=Y, payStatus=Y, v_transsuccess=Y, v_msgcd "Transaction Successful")
export const bajajPaymentSucceeded = (f: Record<string, string>) =>
  ["p_pay_status", "vg_payStatus", "payStatus", "v_transsuccess"].some((k) => String(f[k]).toUpperCase() === "Y") ||
  /transaction successful/i.test(f.v_msgcd || "");

// Bajaj's payment page sends the customer back to the extcol20 URL we gave at
// issuance ("…/payment-return?txn=<transactionid>&"), adding the policy
// number to the query string. The kit doesn't name that parameter, so we
// take any value in Bajaj's policy-number format (OG-27-1201-1802-00000566).
// The policy is recorded here, server-side, from the checkout saved at
// issuance; then every field goes on to the result page.
const POLICY_NO = /^OG-\d{2}-\d{4}-\d{4}-\d{8}$/i;

export function makeBajajPaymentReturn(vehicleClass: "4W" | "2W") {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, any>;
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries({ ...body, ...req.query })) {
      if (v != null && v !== "") fields[k] = String(Array.isArray(v) ? v[0] : v).slice(0, 300);
    }
    console.log(`BAJAJ ${vehicleClass} PAYMENT RETURN`, JSON.stringify(fields));

    const policyNo = Object.values(fields).find((v) => POLICY_NO.test(v.trim()))?.trim();
    if (policyNo && fields.txn) {
      try {
        const r = await recordBajajPolicy(fields.txn, policyNo.toUpperCase());
        console.log(`BAJAJ ${vehicleClass} POLICY RECORD`, policyNo, JSON.stringify(r));
      } catch (e) {
        // Never block the customer's redirect; the error is in the log
        console.log(`BAJAJ ${vehicleClass} POLICY RECORD ERROR`, policyNo, e);
      }
    } else if (fields.txn && bajajPaymentSucceeded(fields)) {
      // Seen on UAT: payment successful but policyref=null — keep it visible
      // for follow-up with Bajaj instead of losing a paid checkout
      console.log(`BAJAJ ${vehicleClass} PAID WITHOUT POLICY NUMBER`, fields.txn, fields.v_restranid || "");
      try {
        await markBajajPaidWithoutPolicy(fields.txn, fields.v_restranid || "");
      } catch (e) {
        console.log(`BAJAJ ${vehicleClass} PAID-NO-POLICY SAVE ERROR`, fields.txn, e);
      }
    }

    // 303 turns a POST back into a GET of our result page
    const params = new URLSearchParams(vehicleClass === "2W" ? { ...fields, vc: "2W" } : fields);
    res.redirect(303, `/cart/bajaj-payment?${params.toString()}`);
  };
}
