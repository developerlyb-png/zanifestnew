import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Otp from "@/models/Otp";
import { friendlyMessage } from "@/utils/friendlyError";
import { normalizeIndianMobile } from "@/utils/mobile";

// Sends a 6-digit OTP on WhatsApp through Packvibe (a Meta WhatsApp Cloud API
// proxy) using the approved "otpverification" template.
//
// Fixes over the previous version:
//  - The mobile is normalised first, so "+91…" / "91…" input no longer turns
//    into 9191XXXXXXXXXX (a non-existent number the OTP never reached).
//  - Success requires a real message id back from WhatsApp. Packvibe can
//    answer HTTP 200 with an error object inside; that used to be reported
//    as "OTP sent" even though nothing was delivered.
//  - Meta's error code is translated into a reason the user/admin can act on,
//    and the full response is logged ("WHATSAPP OTP …") for the server logs.
//
// Note: a returned message id means WhatsApp *accepted* the message, not that
// the phone received it. Later delivery failures (number not on WhatsApp,
// template paused, etc.) are only reported to Packvibe's delivery webhook/
// dashboard — check there when this says "sent" but nothing arrives.

const PACKVIBE_URL = "https://crm.packvibeindia.com/api/meta/v19.0/1066377973231265/messages";
const TEMPLATE_NAME = "otpverification";
const TEMPLATE_LANG = "en";

// Common Meta WhatsApp Cloud API error codes -> plain reasons.
const META_ERRORS: Record<number, string> = {
  0: "WhatsApp authentication failed. The WhatsApp API token needs to be renewed.",
  190: "The WhatsApp API token has expired. Please renew PACKVIBE_TOKEN.",
  10: "The WhatsApp account doesn't have permission to send this message.",
  100: "WhatsApp rejected the request (invalid parameter). The OTP template setup needs checking.",
  131026: "This number isn't on WhatsApp or can't receive messages. Please use a WhatsApp number.",
  131047: "WhatsApp's 24-hour messaging window has closed for this number.",
  131049: "WhatsApp didn't deliver this message to protect the user experience. Please try again later.",
  131056: "Too many messages were sent to this number. Please wait a minute and try again.",
  130429: "WhatsApp's sending limit was reached. Please try again shortly.",
  131000: "WhatsApp had an internal error. Please try again.",
  131008: "WhatsApp OTP template is missing a required value.",
  131009: "WhatsApp OTP template parameter is invalid.",
  132000: "The WhatsApp OTP template parameters don't match the approved template.",
  132001: `The WhatsApp template "${TEMPLATE_NAME}" (${TEMPLATE_LANG}) doesn't exist or isn't approved.`,
  132007: "The WhatsApp OTP template was rejected by Meta's content policy.",
  132015: "The WhatsApp OTP template is paused because of low quality.",
  132016: "The WhatsApp OTP template is disabled.",
  133010: "This WhatsApp business number isn't registered.",
  131042: "WhatsApp payment issue on the business account (low balance / payment method).",
  368: "The WhatsApp business account is temporarily restricted.",
};

function describeFailure(status: number, result: any): string {
  const err = result?.error || result?.errors?.[0] || result;
  const code = Number(err?.code ?? err?.error_code);
  if (Number.isFinite(code) && META_ERRORS[code]) return META_ERRORS[code];
  if (status === 401 || status === 403) return "WhatsApp authentication failed. The WhatsApp API token needs to be renewed.";
  if (status === 402) return "WhatsApp sending is blocked: the Packvibe account balance may be low.";
  const detail = err?.error_data?.details || err?.message || result?.message;
  return detail ? `WhatsApp couldn't send the OTP: ${detail}` : "WhatsApp couldn't send the OTP. Please try again.";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const mobile = normalizeIndianMobile(req.body?.mobile);
    if (!mobile) {
      return res.status(400).json({ success: false, message: "Please enter a valid 10-digit mobile number." });
    }

    if (!process.env.PACKVIBE_TOKEN) {
      console.error("WHATSAPP OTP: PACKVIBE_TOKEN is not set on this server");
      return res.status(500).json({
        success: false,
        message: "WhatsApp OTP isn't configured on the server (PACKVIBE_TOKEN missing). Please contact support.",
      });
    }

    await dbConnect();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ mobile });
    await Otp.create({ mobile, otp, expire: new Date(Date.now() + 5 * 60 * 1000) });

    const payload = {
      messaging_product: "whatsapp",
      to: `91${mobile}`,
      recipient_type: "individual",
      type: "template",
      template: {
        name: TEMPLATE_NAME,
        language: { policy: "deterministic", code: TEMPLATE_LANG },
        components: [
          { type: "body", parameters: [{ type: "text", text: otp }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: otp }] },
        ],
      },
    };

    const response = await fetch(PACKVIBE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PACKVIBE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Packvibe can return an HTML error page or empty body — don't crash on it.
    const raw = await response.text();
    let result: any = null;
    try {
      result = raw ? JSON.parse(raw) : null;
    } catch {
      result = { message: raw.slice(0, 300) };
    }

    const messageId = result?.messages?.[0]?.id || result?.message_id || result?.data?.messages?.[0]?.id;
    const accepted = response.ok && !result?.error && !!messageId;

    console.log("WHATSAPP OTP", {
      to: `91${mobile.slice(0, 2)}******${mobile.slice(-2)}`,
      status: response.status,
      accepted,
      messageId: messageId || null,
      result,
    });

    if (!accepted) {
      // The OTP can't reach the user, so don't leave a usable one behind.
      await Otp.deleteMany({ mobile });
      return res.status(502).json({ success: false, message: describeFailure(response.status, result) });
    }

    return res.status(200).json({ success: true, message: "OTP sent on WhatsApp", messageId });
  } catch (error: any) {
    console.log("SEND WHATSAPP OTP ERROR", error);
    return res.status(500).json({ success: false, message: friendlyMessage(error) });
  }
}
