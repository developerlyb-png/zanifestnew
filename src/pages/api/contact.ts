import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, phone, message, source, service } = req.body ?? {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim() : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";
  const cleanMessage = typeof message === "string" ? message.trim() : "";
  const cleanService = typeof service === "string" ? service.trim() : "";
  const isInsurancePopup = source === "insurance-popup";

  if (
    !cleanName || cleanName.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254 ||
    !/^[0-9+() .-]{7,20}$/.test(cleanPhone) ||
    !cleanMessage || cleanMessage.length > 2000 ||
    (isInsurancePopup && (!cleanService || cleanService.length > 120))
  ) {
    return res.status(400).json({ message: "Please provide a valid name, email, mobile number, and message." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const popupEmail = `
      <div style="margin:0;padding:32px 12px;background:#f2f6fa;font-family:Arial,Helvetica,sans-serif;color:#18344e">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2eaf1;border-radius:14px;overflow:hidden">
          <tr><td style="padding:26px 32px;background:#104c78;background-image:linear-gradient(115deg,#104c78,#1876bd);border-bottom:4px solid #f3c54b">
            <div style="font-size:12px;font-weight:bold;letter-spacing:2px;color:#b9ddf2;text-transform:uppercase">Zanifest Insurance</div>
            <div style="margin-top:10px;font-size:24px;line-height:1.3;font-weight:bold;color:#ffffff">New insurance inquiry</div>
            <div style="margin-top:6px;font-size:13px;color:#d9eaf6">A customer has requested a callback</div>
          </td></tr>
          <tr><td style="padding:26px 32px 12px">
            <div style="display:inline-block;padding:7px 11px;border-radius:20px;background:#edf6fc;color:#176da5;font-size:12px;font-weight:bold">${escapeHtml(cleanService)}</div>
          </td></tr>
          <tr><td style="padding:8px 32px 26px">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
              <tr><td style="width:112px;padding:12px 8px 12px 0;border-bottom:1px solid #edf1f5;color:#718394;font-size:13px">Name</td><td style="padding:12px 0;border-bottom:1px solid #edf1f5;color:#18344e;font-size:14px;font-weight:bold">${escapeHtml(cleanName)}</td></tr>
              <tr><td style="padding:12px 8px 12px 0;border-bottom:1px solid #edf1f5;color:#718394;font-size:13px">Email</td><td style="padding:12px 0;border-bottom:1px solid #edf1f5;font-size:14px"><a href="mailto:${escapeHtml(cleanEmail)}" style="color:#176da5;text-decoration:none">${escapeHtml(cleanEmail)}</a></td></tr>
              <tr><td style="padding:12px 8px 12px 0;border-bottom:1px solid #edf1f5;color:#718394;font-size:13px">Mobile</td><td style="padding:12px 0;border-bottom:1px solid #edf1f5;font-size:14px"><a href="tel:${escapeHtml(cleanPhone)}" style="color:#176da5;text-decoration:none">${escapeHtml(cleanPhone)}</a></td></tr>
              <tr><td colspan="2" style="padding:20px 0 8px;color:#718394;font-size:13px">Message</td></tr>
              <tr><td colspan="2" style="padding:14px 16px;border:1px solid #e8eef3;border-radius:8px;background:#f8fafc;color:#29465f;font-size:14px;line-height:1.65">${escapeHtml(cleanMessage).replace(/\n/g, "<br>")}</td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:15px 32px;background:#f8fafc;border-top:1px solid #edf1f5;color:#8493a0;font-size:11px">Zanifest Insurance · Website inquiry notification</td></tr>
        </table>
      </div>
    `;

    const contactEmail = `
      <h3>New Contact Message</h3>
      <p><b>Name:</b> ${escapeHtml(cleanName)}</p>
      <p><b>Email:</b> ${escapeHtml(cleanEmail)}</p>
      <p><b>Phone:</b> ${escapeHtml(cleanPhone)}</p>
      <p><b>Message:</b><br>${escapeHtml(cleanMessage).replace(/\n/g, "<br>")}</p>
    `;

    await transporter.sendMail({
      from: `"Zanifest Website" <${process.env.EMAIL_USER}>`,
      to: isInsurancePopup
        ? "zanifestinsurancebroker@gmail.com"
        : "support@zanifestinsurance.com",
      replyTo: cleanEmail,
      subject: isInsurancePopup ? `New ${cleanService} Inquiry | Zanifest Insurance` : "New Contact Form Submission",
      html: isInsurancePopup ? popupEmail : contactEmail,
    });

    return res.status(200).json({ message: "Message sent successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to send your message right now. Please try again later." });
  }
}
