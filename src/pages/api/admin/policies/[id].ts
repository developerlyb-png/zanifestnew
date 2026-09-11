import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";
import Agent from "@/models/Agent";
import { sendEmail } from "@/utils/mailSender";

const BRAND_BLUE = "#1878bd";

function logoAttachment() {
  const logoPath = path.join(process.cwd(), "public", "logo-trans.png");
  if (!fs.existsSync(logoPath)) return null;
  return {
    filename: "logo-trans.png",
    content: fs.readFileSync(logoPath),
    cid: "zanifest-logo",
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

// Best-effort — a failed/misconfigured mail server should never block the
// admin's approve/reject action itself, so this never throws.
async function sendPolicyReviewEmail(policy: any, action: "approve" | "reject", remark: string) {
  try {
    if (!policy.createdByAgentId) return; // admin-created policies have no agent to notify
    const agent: any = await Agent.findById(policy.createdByAgentId);
    if (!agent?.email) return;

    const insuredName = policy.customer?.fullName || "the insured";
    const policyNumber = policy.policyNumber || "—";
    const logo = logoAttachment();

    if (action === "approve") {
      const bodyHtml = `
        <h2 style="margin:0 0 16px;color:${BRAND_BLUE};">✅ Policy Approved</h2>
        <p>Dear <b>${agent.firstName || "Agent"}</b>,</p>
        <p>Your submitted policy <b>${policyNumber}</b> for <b>${insuredName}</b> has been
          <span style="color:#16a34a;font-weight:700;">APPROVED</span> by the admin.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin:18px 0;">
          <b>Admin Remark:</b><br/>${remark || "No remark provided"}
        </div>
        <p>This policy is now live in your Policy list.</p>
        <p>
          <a href="${process.env.BASE_URL || ""}/agentlogin" style="color:${BRAND_BLUE};">
            ${process.env.BASE_URL || ""}/agentlogin
          </a>
        </p>
      `;
      await sendEmail({
        to: agent.email,
        subject: `Policy ${policyNumber} Approved`,
        html: emailShell(bodyHtml),
        attachments: logo ? [logo] : undefined,
      });
    } else {
      const bodyHtml = `
        <h2 style="margin:0 0 16px;color:#dc2626;">Policy Rejected</h2>
        <p>Dear <b>${agent.firstName || "Agent"}</b>,</p>
        <p>Your submitted policy <b>${policyNumber}</b> for <b>${insuredName}</b> has been
          <span style="color:#dc2626;font-weight:700;">REJECTED</span> by the admin.</p>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:18px 0;">
          <b>Admin Remark:</b><br/>${remark || "No remark provided"}
        </div>
        <p>Please review the details, make the necessary corrections, and resubmit the policy from
          the Pending Approval section of your dashboard.</p>
        <p>
          <a href="${process.env.BASE_URL || ""}/agentlogin" style="color:${BRAND_BLUE};">
            ${process.env.BASE_URL || ""}/agentlogin
          </a>
        </p>
      `;
      await sendEmail({
        to: agent.email,
        subject: `Policy ${policyNumber} Rejected — Action Required`,
        html: emailShell(bodyHtml),
        attachments: logo ? [logo] : undefined,
      });
    }
  } catch (err) {
    console.log("POLICY REVIEW EMAIL ERROR", err);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Policy id is required" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const policy = await IssuedPolicy.findById(id);
      if (!policy) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }
      return res.status(200).json({ success: true, policy });
    } catch (err: any) {
      console.log("ADMIN POLICY GET ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PATCH") {
    try {
      const fileData = String(req.body?.fileData || "");
      const fileName = String(req.body?.fileName || "");

      if (!fileData || !fileName) {
        return res.status(400).json({ success: false, message: "File is required" });
      }
      if (!fileData.startsWith("data:application/pdf")) {
        return res.status(400).json({ success: false, message: "Only PDF files are allowed" });
      }

      const policy = await IssuedPolicy.findByIdAndUpdate(
        id,
        {
          $push: { policyDocuments: { data: fileData, fileName } },
          $set: { policyDocumentStatus: "Received" },
        },
        { new: true }
      );

      if (!policy) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }

      return res.status(200).json({ success: true, policy });
    } catch (err: any) {
      console.log("ADMIN POLICY DOCUMENT UPLOAD ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const fields = req.body?.fields && typeof req.body.fields === "object" ? req.body.fields : {};
      const action = req.body?.action; // "approve" | "reject" | undefined
      const remark = typeof req.body?.remark === "string" ? req.body.remark.trim() : "";

      if (action && action !== "approve" && action !== "reject") {
        return res.status(400).json({ success: false, message: "Invalid action" });
      }

      const EDITABLE_TOP_FIELDS = [
        "policyNumber",
        "insurer",
        "lineOfBusiness",
        "product",
        "policyTypeStructure",
        "transactionType",
        "premium",
        "grossPremium",
        "commissionAmount",
        "payoutAmount",
        "subInsured",
        "policyRemark",
      ];
      const NUMERIC_FIELDS = ["premium", "grossPremium", "commissionAmount", "payoutAmount"];
      const EDITABLE_CUSTOMER_FIELDS = ["fullName", "email", "mobile", "address"];

      const update: Record<string, any> = {};

      for (const key of EDITABLE_TOP_FIELDS) {
        if (fields[key] === undefined) continue;
        update[key] = NUMERIC_FIELDS.includes(key) ? Number(fields[key]) || 0 : String(fields[key]).trim();
      }
      // Keep the legacy policyType (Motor/Non Motor) mirror in sync with
      // lineOfBusiness, same as the create flow does.
      if (update.lineOfBusiness) update.policyType = update.lineOfBusiness;

      if (fields.startDate) {
        const d = new Date(fields.startDate);
        if (!Number.isNaN(d.getTime())) update.startDate = d;
      }
      if (fields.endDate) {
        const d = new Date(fields.endDate);
        if (!Number.isNaN(d.getTime())) update.endDate = d;
      }

      if (fields.customer && typeof fields.customer === "object") {
        for (const key of EDITABLE_CUSTOMER_FIELDS) {
          if (fields.customer[key] !== undefined) {
            update[`customer.${key}`] = String(fields.customer[key]).trim();
          }
        }
      }

      if (action) {
        update.adminApprovalStatus = action === "approve" ? "Approved" : "Rejected";
        update.adminApprovalRemark = remark;
        update.adminApprovalReviewedBy =
          `${(admin as any).userFirstName ?? ""} ${(admin as any).userLastName ?? ""}`.trim() ||
          (admin as any).email;
        update.adminApprovalReviewedAt = new Date();
      }

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ success: false, message: "Nothing to update" });
      }

      const policy = await IssuedPolicy.findByIdAndUpdate(id, { $set: update }, { new: true });
      if (!policy) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }

      if (action) {
        await sendPolicyReviewEmail(policy, action, remark);
      }

      return res.status(200).json({ success: true, policy });
    } catch (err: any) {
      console.log("ADMIN POLICY UPDATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const policy = await IssuedPolicy.findByIdAndDelete(id);
      if (!policy) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("ADMIN POLICY DELETE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
