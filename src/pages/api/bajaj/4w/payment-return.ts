import type { NextApiRequest, NextApiResponse } from "next";

// Bajaj's payment page sends the customer back to the extcol20 URL we gave at
// issuance ("…/payment-return?txn=<transactionid>&"), adding the policy
// number to the query string. The kit doesn't name that parameter, so every
// field (query or form post) is passed through to the result page, which
// finds the policy number and confirms it with Bajaj before showing it.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, any>;
  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...body, ...req.query })) {
    if (v != null && v !== "") fields[k] = String(Array.isArray(v) ? v[0] : v).slice(0, 300);
  }
  console.log("BAJAJ 4W PAYMENT RETURN", JSON.stringify(fields));

  // 303 turns a POST back into a GET of our result page
  res.redirect(303, `/cart/bajaj-payment?${new URLSearchParams(fields).toString()}`);
}
