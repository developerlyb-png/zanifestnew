import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import Invoice from "@/models/Invoice";
import { sendEmail } from "@/utils/mailSender";

const BRAND_BLUE = "#1878bd";

function emailShell(bodyHtml: string) {
  return `
  <div style="background:#f4f7fb;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
      <div style="background:${BRAND_BLUE};padding:20px 28px;">
        <span style="color:#ffffff;font-size:16px;font-weight:700;">Invoice</span>
      </div>
      <div style="padding:28px;color:#1f2937;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="background:#f9fafb;padding:16px 28px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #eef1f5;">
        This is an automated message, please do not reply.
      </div>
    </div>
  </div>`;
}

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function requireAdmin(req: NextApiRequest) {
  const token = req.cookies["adminToken"];
  const data = token ? await verifyToken(token) : null;
  if (
    !data ||
    typeof data !== "object" ||
    !("role" in data) ||
    !["superadmin", "admin"].includes((data as any).role)
  ) {
    return null;
  }
  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    await dbConnect();
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: "id is required" });

    const invoice: any = await Invoice.findById(id).lean();
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (!invoice.client?.email) {
      return res.status(400).json({ success: false, message: "This client has no email on file" });
    }

    const bodyHtml = `
      <h2 style="margin:0 0 16px;color:${BRAND_BLUE};">Invoice ${invoice.invoiceNo}</h2>
      <p>Dear ${invoice.client.contactPerson || invoice.client.name},</p>
      <p>Please find your invoice summary from <b>${invoice.seller.companyName}</b> below.</p>
      <table style="width:100%;border-collapse:collapse;margin:18px 0;">
        <tr><td style="padding:6px 0;color:#6b7280;">Invoice No.</td><td style="padding:6px 0;text-align:right;font-weight:700;">${invoice.invoiceNo}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Invoice Date</td><td style="padding:6px 0;text-align:right;">${new Date(invoice.invoiceDate).toLocaleDateString("en-GB")}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Subtotal</td><td style="padding:6px 0;text-align:right;">${inr(invoice.subtotal)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Total Tax</td><td style="padding:6px 0;text-align:right;">${inr(invoice.totalTax)}</td></tr>
        <tr><td style="padding:10px 0 0;font-weight:700;">Grand Total</td><td style="padding:10px 0 0;text-align:right;font-weight:700;color:${BRAND_BLUE};">${inr(invoice.grandTotal)}</td></tr>
      </table>
      <p>Thank you for your business.</p>
    `;

    const sent = await sendEmail({
      to: invoice.client.email,
      subject: `Invoice ${invoice.invoiceNo} from ${invoice.seller.companyName}`,
      html: emailShell(bodyHtml),
    });

    if (!sent) {
      return res.status(502).json({ success: false, message: "Failed to send email" });
    }

    const updated = await Invoice.findByIdAndUpdate(
      id,
      { $set: { status: invoice.status === "Draft" ? "Sent" : invoice.status } },
      { new: true }
    ).lean();

    return res.status(200).json({ success: true, invoice: updated });
  } catch (err: any) {
    console.log("INVOICE SEND EMAIL ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
