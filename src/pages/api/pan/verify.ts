import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { cf } from "@/lib/cashfree";

const schema = z.object({
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { pan } = schema.parse(req.body);

    const { data } = await cf.post("/pan", { pan });   // ✅ FIXED
    return res.status(200).json(data);
  } catch (err: any) {
    console.log("PAN Verify Error:", err.response?.data);

    const code = err.response?.status ?? 500;
    return res
      .status(code)
      .json(err.response?.data ?? { message: "Server Error" });
  }
}
