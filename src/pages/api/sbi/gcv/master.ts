// GET /api/sbi/gcv/master — SBI GCV master lists for manual selection.
//   ?type=make
//   ?type=model&makeId=15
//   ?type=variant&modelId=95
//   ?type=match&make=TATA&model=ACE&gvw=1550&fuel=Diesel   (debug: what auto-match picks)
//   ?type=rto&code=MH01
import type { NextApiRequest, NextApiResponse } from "next";
import { listMakes, listModels, listVariants, matchVehicle, matchRto } from "@/lib/sbiGcv/masterMatch";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = req.query as Record<string, string>;
  switch (q.type) {
    case "make":
      return res.status(200).json({ success: true, data: listMakes() });
    case "model":
      return res.status(200).json({ success: true, data: listModels(q.makeId) });
    case "variant":
      return res.status(200).json({ success: true, data: listVariants(q.modelId) });
    case "match":
      return res.status(200).json({
        success: true,
        data: matchVehicle({ make: q.make, model: q.model, variant: q.variant, gvw: q.gvw, fuel: q.fuel }),
      });
    case "rto":
      return res.status(200).json({ success: true, data: matchRto(q.code, q.place) });
    default:
      return res.status(400).json({ success: false, message: "type must be make | model | variant | match | rto" });
  }
}
