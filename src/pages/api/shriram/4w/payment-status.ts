import type { NextApiRequest, NextApiResponse } from "next";

// Shriram getPaymentStatus — the source of truth for whether a proposal was
// paid and converted to a policy. The gateway's post-back is never trusted on
// its own. Result values seen in the kit: Success (policy converted), Failure
// with "Payment Failed", "Some error occurred. Kindly contact SGI", or
// "Payment is being processed" (awaited).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { proposalNo, quoteId } = req.body || {};
  if (!proposalNo || !quoteId) {
    return res.status(400).json({ success: false, message: "proposalNo and quoteId are required" });
  }

  try {
    const response = await fetch(process.env.SHRIRAM_PAYMENT_STATUS_URL || "", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Username: process.env.SHRIRAM_USERNAME || "",
        Password: process.env.SHRIRAM_PASSWORD || "",
      },
      body: JSON.stringify({
        ProposalNo: String(proposalNo),
        QuoteID: String(quoteId),
        ProductCode: "MOT-PRD-001",
      }),
      signal: AbortSignal.timeout(30000),
    });

    const data: any = await response.json().catch(() => null);
    if (!data) {
      return res.status(502).json({
        success: false,
        message: `Shriram returned a non-JSON response (HTTP ${response.status})`,
      });
    }

    // Keys come back with stray spaces (" BankTransactionID ") — trim them
    const transactions = (data.Response || []).map((t: any) =>
      Object.fromEntries(Object.entries(t).map(([k, v]) => [k.trim(), v]))
    );
    const paid = transactions.find(
      (t: any) => /success/i.test(String(t.TransactionStatus)) && t.PolicyNo
    );
    const message: string = data.MessageResult?.ErrorMessage || data.MessageResult?.SuccessMessage || "";

    let status: "PAID" | "AWAITED" | "POLICY_ERROR" | "FAILED" | "NOT_FOUND";
    if (paid) status = "PAID";
    else if (/being processed/i.test(message)) status = "AWAITED";
    else if (/contact SGI/i.test(message)) status = "POLICY_ERROR";
    else if (/no successful transactions/i.test(message) && !transactions.length) status = "NOT_FOUND";
    else status = "FAILED";

    return res.status(200).json({
      success: true,
      status,
      message,
      policyNo: paid?.PolicyNo || "",
      policyUrl: paid?.PolicyURL || "",
      amount: paid ? Number(paid.PaymentAmount) || null : null,
      transactionId: paid?.SGITransactionID || "",
      transactions,
    });
  } catch (err: any) {
    console.log("SHRIRAM 4W PAYMENT STATUS ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
