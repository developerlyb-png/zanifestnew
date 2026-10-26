import type { NextApiRequest, NextApiResponse } from "next";

// Shriram's payment page POSTs the outcome back here (form fields
// ResponseCode, ResponseMsg, PolicyNumber, PolicyURL, Status, ProposalNumber).
// Those fields are only a hint for the customer-facing message — the result
// page confirms the real outcome with getPaymentStatus before showing a policy.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, any>;
  const proposalNo = String(req.query.proposalNo || body.ProposalNumber || "");
  const quoteId = String(req.query.quoteId || "");
  const hint = String(body.ResponseMsg || body.ResponseCode || "");

  const params = new URLSearchParams({ proposalNo, quoteId });
  if (hint) params.set("msg", hint.slice(0, 200));

  // 303 turns Shriram's POST into a GET of our result page
  res.redirect(303, `/cart/shriram-payment?${params.toString()}`);
}
