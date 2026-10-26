import crypto from "crypto";
import bcrypt from "bcryptjs";
import PasswordReset, { MAX_OTP_ATTEMPTS, PasswordResetUserType } from "@/models/PasswordReset";
import Agent from "@/models/Agent";
import { sendEmail } from "@/utils/mailSender";

// Agent emails aren't lowercased in the schema, so match case-insensitively
export function findAgentByEmail(email: string) {
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Agent.findOne({ email: { $regex: `^${escaped}$`, $options: "i" } });
}

const OTP_VALIDITY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

// Same response whether or not the email exists, so account emails can't be discovered
export const GENERIC_OTP_MESSAGE = "If an account exists for this email, an OTP has been sent.";

type Result = { ok: true; message: string } | { ok: false; status: number; message: string };

const PORTAL_LABEL: Record<PasswordResetUserType, string> = {
  admin: "Admin",
  agent: "Agent",
};

export async function sendPasswordResetOtp(
  userType: PasswordResetUserType,
  email: string,
  name?: string
): Promise<Result> {
  const existing = await PasswordReset.findOne({ email, userType });
  if (existing && Date.now() - new Date(existing.createdAt).getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false, status: 429, message: "Please wait a minute before requesting another OTP" };
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  // A new request replaces any older OTP
  await PasswordReset.deleteMany({ email, userType });
  await PasswordReset.create({
    email,
    userType,
    otpHash,
    expire: new Date(Date.now() + OTP_VALIDITY_MS),
  });

  const label = PORTAL_LABEL[userType];
  const sent = await sendEmail({
    to: email,
    subject: `Zanifest ${label} Password Reset OTP`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px">
        <h2 style="color:#1878bd">Zanifest ${label}</h2>
        <p>Hi ${name || label},</p>
        <p>Use the OTP below to reset your password:</p>
        <h1 style="letter-spacing:6px;color:#1878bd">${otp}</h1>
        <p>This OTP is valid for 10 minutes. If you did not request a password reset, you can ignore this email.</p>
      </div>
    `,
  });

  if (!sent) {
    await PasswordReset.deleteMany({ email, userType });
    return { ok: false, status: 500, message: "Failed to send OTP email. Please try again." };
  }

  return { ok: true, message: GENERIC_OTP_MESSAGE };
}

export async function verifyPasswordResetOtp(
  userType: PasswordResetUserType,
  email: string,
  otp: string
): Promise<Result> {
  const record = await PasswordReset.findOne({ email, userType });
  if (!record || record.expire.getTime() < Date.now()) {
    return { ok: false, status: 400, message: "OTP expired. Please request a new one." };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await PasswordReset.deleteOne({ _id: record._id });
    return { ok: false, status: 429, message: "Too many wrong attempts. Please request a new OTP." };
  }

  const isMatch = await bcrypt.compare(otp, record.otpHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    const left = MAX_OTP_ATTEMPTS - record.attempts;
    return {
      ok: false,
      status: 400,
      message: left > 0 ? `Invalid OTP. ${left} attempt(s) left.` : "Too many wrong attempts. Please request a new OTP.",
    };
  }

  record.verified = true;
  await record.save();
  return { ok: true, message: "OTP verified" };
}

/**
 * Re-checks a previously verified OTP so the reset endpoint can't be called
 * without going through verification.
 */
export async function isPasswordResetOtpValid(
  userType: PasswordResetUserType,
  email: string,
  otp: string
): Promise<boolean> {
  const record = await PasswordReset.findOne({ email, userType });
  return Boolean(
    record &&
      record.verified &&
      record.expire.getTime() >= Date.now() &&
      record.attempts < MAX_OTP_ATTEMPTS &&
      (await bcrypt.compare(otp, record.otpHash))
  );
}

export async function clearPasswordResetOtp(userType: PasswordResetUserType, email: string) {
  await PasswordReset.deleteMany({ email, userType });
}
