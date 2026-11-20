// POST /api/sbi/gcv/razorpay-order — SBI-issued Razorpay order for a GCV
// quote. Same gateway account as 4W; only the ProductName note differs.
// Body: { amountInRupees, quotationNo }
import type { NextApiRequest, NextApiResponse } from "next";
import sbiRazorpayOrder from "../4w/razorpay-order";
import { SBI_GCV_PRODUCT_CODE } from "@/lib/sbiGcv/constants";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  req.body = { ...(req.body || {}), productName: SBI_GCV_PRODUCT_CODE };
  return sbiRazorpayOrder(req, res);
}
