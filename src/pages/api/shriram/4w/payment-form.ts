import type { NextApiRequest, NextApiResponse } from "next";

// Builds the HTML-form POST that sends the customer to Shriram's payment page
// (WebAggregator_PaymentIntegration_kit_UAT_V3.3.pdf). The browser submits it;
// Shriram then POSTs the result back to sourceUrl (our payment-return route).
// Kept server-side so the user id and application name stay in .env.

const GATEWAY_PAGES: Record<string, string> = {
  PAYTM: "MyDefaultPtm.aspx",
  CCAVENUE: "MyDefaultCC.aspx",
  EASEBUZZ: "mydefaultEASEBUZZ.aspx",
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { proposalNo, quoteId, amount, gateway = "CCAVENUE" } = req.body || {};
  const page = GATEWAY_PAGES[String(gateway).toUpperCase()];
  if (!proposalNo || !quoteId || !(Number(amount) > 0) || !page) {
    return res.status(400).json({ success: false, message: "proposalNo, quoteId, amount and a valid gateway are required" });
  }

  const protocol = req.headers["x-forwarded-proto"] || "http";
  const origin = `${protocol}://${req.headers.host}`;
  // Shriram's post-back carries the proposal number but not the QuoteId,
  // and getPaymentStatus needs both — so both ride along in the return URL.
  const sourceUrl =
    `${origin}/api/shriram/4w/payment-return?proposalNo=${encodeURIComponent(proposalNo)}` +
    `&quoteId=${encodeURIComponent(quoteId)}`;

  return res.status(200).json({
    success: true,
    action: `${process.env.SHRIRAM_PAYMENT_BASE_URL}/${page}`,
    fields: {
      createdBy: process.env.SHRIRAM_USERNAME || "",
      paymentFrom: String(gateway).toUpperCase(),
      prodCode: "MOT-PRD-001",
      QuoteId: String(quoteId),
      amount: String(Math.round(Number(amount))),
      sourceUrl,
      DbFrom: "NOVA",
      application: process.env.SHRIRAM_APPLICATION || "",
      prodName: "MOTOR",
      // "<proposal number>-<QuoteId>" per the kit's parameter table
      Description: `${proposalNo}-${quoteId}`,
      IsForWeb: "true",
    },
  });
}
