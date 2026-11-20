// POST /api/sbi/gcv/quick-quote — SBI GCV (CMVGC01) indicative premium.
// Body: GcvQuoteInput (see src/lib/sbiGcv/requestBuilder.ts).
import type { NextApiRequest, NextApiResponse } from "next";
import { sbiGcvPost } from "@/lib/sbiGcv/client";
import { SBI_GCV_PATHS } from "@/lib/sbiGcv/constants";
import {
  buildGcvQuickQuoteBody,
  summariseGcvQuote,
  sbiErrorMessages,
  GcvInputError,
  GcvQuoteInput,
} from "@/lib/sbiGcv/requestBuilder";
import { friendlyMessage } from "@/utils/friendlyError";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  let built;
  try {
    built = buildGcvQuickQuoteBody((req.body || {}) as GcvQuoteInput);
  } catch (e: any) {
    if (e instanceof GcvInputError) return res.status(200).json({ success: false, message: friendlyMessage(e) });
    throw e;
  }

  try {
    const { raw } = await sbiGcvPost(SBI_GCV_PATHS.quickQuote, "quickQuote", built.body);
    const errors = sbiErrorMessages(raw);
    if (errors || raw?.IsPremiumCalcSuccess !== "Y") {
      return res.status(200).json({
        success: false,
        message: errors?.[0] || "SBI could not calculate a premium for this vehicle",
        errors,
        data: raw,
      });
    }

    const { vehicle, rto } = built.resolved;
    return res.status(200).json({
      success: true,
      quote: summariseGcvQuote(raw),
      // Echo the SBI ids so the checkout can pin the exact same vehicle.
      sbiVehicle: {
        makeId: vehicle.make.id,
        make: vehicle.make.name,
        modelId: vehicle.model.id,
        model: vehicle.model.name,
        variantId: vehicle.variant.id,
        variant: vehicle.variant.name,
        gvw: vehicle.variant.gvw,
        fuel: vehicle.variant.fuel,
        matchReasons: vehicle.reasons,
      },
      sbiRto: rto,
      data: raw,
    });
  } catch (error: any) {
    console.log("SBI GCV QUICKQUOTE ERROR", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
}
