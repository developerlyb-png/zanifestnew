// import type { NextApiRequest, NextApiResponse } from "next";
// import { z } from "zod";
// import { cf, AadhaarOtpStartResponse } from "@/lib/cashfree";

// const schema = z.object({
//   aadhaar_number: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
// });

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST")
//     return res.status(405).json({ message: "Method Not Allowed" });

//   try {
//     const { aadhaar_number } = schema.parse(req.body);

//     const { data } = await cf.post<AadhaarOtpStartResponse>(
//       "/offline-aadhaar/otp",
//       { aadhaar_number }
//     );

//     // data looks like: { status: "SUCCESS", message: "OTP sent...", ref_id: "12345" }
//     return res.status(200).json(data);
//   } catch (err: any) {
//     const code = err.response?.status ?? 500;
//     return res.status(code).json(err.response?.data ?? { message: "Server Error" });
//   }
// }
