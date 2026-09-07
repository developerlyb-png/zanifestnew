import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import { sendEmail } from "@/utils/mailSender";

const BRAND_BLUE = "#1878bd";

// Every rejectable field: its verification-status key, the human label used
// in the email, the Agent-model field holding its uploaded document (for
// inline image embedding), and the Agent-model field name(s) recorded into
// agent.rejectedFields — createagent.tsx's edit-resubmit flow keys off these
// exact field names (e.g. rejected.includes("panNumber")) to know which form
// fields to clear/unlock, so these must match the original convention.
const REJECTABLE_FIELDS: {
  statusKey: string;
  label: string;
  attachmentField?: string;
  modelFields: string[];
}[] = [
  { statusKey: "panStatus", label: "PAN Card", attachmentField: "panAttachment", modelFields: ["panNumber", "panAttachment"] },
  { statusKey: "aadhaarStatus", label: "Aadhaar Card (Front)", attachmentField: "adhaarAttachment", modelFields: ["adhaarNumber", "adhaarAttachment"] },
  { statusKey: "aadhaarBackStatus", label: "Aadhaar Card (Back)", attachmentField: "adhaarBackAttachment", modelFields: ["adhaarBackAttachment"] },
  { statusKey: "tenthStatus", label: "Educational Certificate", attachmentField: "tenthMarksheetAttachment", modelFields: ["tenthMarksheetAttachment"] },
  { statusKey: "bankStatus", label: "Cancelled Cheque / Bank Details", attachmentField: "cancelledChequeAttachment", modelFields: ["accountNumber", "cancelledChequeAttachment"] },
];

function logoAttachment() {
  const logoPath = path.join(process.cwd(), "public", "logo-trans.png");
  if (!fs.existsSync(logoPath)) return null;
  return {
    filename: "logo-trans.png",
    content: fs.readFileSync(logoPath),
    cid: "zanifest-logo",
  };
}

// Only real images can be shown inline in an email — PDFs aren't renderable
// inline, so those are just named, not embedded.
function docAttachment(dataUri: string | undefined, cid: string) {
  if (!dataUri || !dataUri.startsWith("data:image/")) return null;
  const match = dataUri.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;
  return {
    filename: `${cid}.${match[1]}`,
    content: Buffer.from(match[2], "base64"),
    cid,
  };
}

function emailShell(bodyHtml: string) {
  return `
  <div style="background:#f4f7fb;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
      <div style="background:${BRAND_BLUE};padding:20px 28px;text-align:center;">
        <img src="cid:zanifest-logo" alt="Zanifest" style="height:36px;" />
      </div>
      <div style="padding:28px;color:#1f2937;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="background:#f9fafb;padding:16px 28px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #eef1f5;">
        Zanifest Insurance Broker Pvt. Ltd. &middot; This is an automated message, please do not reply.
      </div>
    </div>
  </div>`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { agentId, action, assignManager, verification, remark } = req.body;

    const agent: any = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    /* =================================================
       APPROVE APPLICATION
    ================================================= */
    if (action === "accept") {
      agent.status = "reviewed";
      agent.assignedTo = assignManager;

      // 🔥 clear rejection metadata
      agent.rejectedFields = [];
      agent.rejectionRemark = "";

      await agent.save();

      const bodyHtml = `
        <h2 style="margin:0 0 16px;color:${BRAND_BLUE};">🎉 Your Application is Approved</h2>
        <p>Dear <b>${agent.firstName}</b>,</p>
        <p>Great news — your agent application with <b>Zanifest Insurance Broker Pvt. Ltd.</b> has been
          <span style="color:#16a34a;font-weight:700;">APPROVED</span>.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin:18px 0;">
          <b>Admin Remark:</b><br/>${remark || "No remark provided"}
        </div>
        <p>You can now log in using your registered email and password to continue your onboarding
          (training modules and certification exam).</p>
        <p>
          <a href="${process.env.BASE_URL || ""}/agentlogin" style="color:${BRAND_BLUE};">
            ${process.env.BASE_URL || ""}/agentlogin
          </a>
        </p>
      `;

      const logo = logoAttachment();
      await sendEmail({
        to: agent.email,
        subject: "Your Application is Approved",
        html: emailShell(bodyHtml),
        attachments: logo ? [logo] : undefined,
      });

      return res.json({
        success: true,
        message: "Agent approved & email sent",
      });
    }

    /* =================================================
       REJECT APPLICATION
    ================================================= */
    if (action === "reject") {
      agent.status = "rejected";

      const rejectedFieldKeys: string[] = [];
      const rejectedForEmail: { label: string; attachmentField?: string }[] = [];

      for (const f of REJECTABLE_FIELDS) {
        if (verification?.[f.statusKey] === "rejected") {
          rejectedFieldKeys.push(...f.modelFields);
          rejectedForEmail.push({ label: f.label, attachmentField: f.attachmentField });
        }
      }

      agent.rejectedFields = rejectedFieldKeys;
      agent.rejectionRemark = remark || "";

      await agent.save();

      // Build one section per rejected document, embedding its actual image
      // inline (cid) where the upload is an image; PDFs are just named.
      const attachments: { filename: string; content: Buffer; cid: string }[] = [];
      const rejectedSectionsHtml = rejectedForEmail
        .map((f, idx) => {
          const cid = `rejected-doc-${idx}`;
          const raw = f.attachmentField ? agent[f.attachmentField] : undefined;
          const att = docAttachment(raw, cid);
          if (att) attachments.push(att);

          const imageHtml = att
            ? `<img src="cid:${cid}" alt="${f.label}" style="max-width:100%;border-radius:8px;border:1px solid #fecaca;margin-top:8px;" />`
            : raw
              ? `<p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">(Uploaded document is a PDF — please review it in your dashboard.)</p>`
              : `<p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">(No document was uploaded for this.)</p>`;

          return `
            <div style="background:#fff1f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin-bottom:12px;">
              <b style="color:#9b1c1c;">✗ ${f.label} — Rejected</b>
              ${imageHtml}
            </div>`;
        })
        .join("");

      const bodyHtml = `
        <h2 style="margin:0 0 16px;color:#dc2626;">Action Required — Application Update</h2>
        <p>Dear <b>${agent.firstName}</b>,</p>
        <p>Thank you for submitting your agent application. Some of the documents you submitted
          need correction before we can proceed:</p>

        ${rejectedSectionsHtml || "<p>No specific documents were flagged.</p>"}

        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:18px 0;">
          <b>Admin Remark:</b><br/>${remark || "No remark provided"}
        </div>

        <p>Please log in and re-upload the flagged document(s) above, then resubmit your application
          for review.</p>
        <p>
          <a href="${process.env.BASE_URL || ""}/agentlogin" style="color:${BRAND_BLUE};">
            ${process.env.BASE_URL || ""}/agentlogin
          </a>
        </p>
      `;

      const logo = logoAttachment();
      if (logo) attachments.push(logo);

      await sendEmail({
        to: agent.email,
        subject: "Action Required – Update Your Application",
        html: emailShell(bodyHtml),
        attachments,
      });

      return res.json({
        success: true,
        message: "Agent rejected & email sent",
        rejectedFields: rejectedFieldKeys,
      });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    console.error("Review error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
