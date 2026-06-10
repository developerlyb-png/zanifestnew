// import type { NextApiRequest, NextApiResponse } from "next";
// import { z } from "zod";
// // import { cf, AadhaarOtpVerifyResponse } from "@/lib/cashfree";

// const schema = z.object({
//   ref_id: z.string().min(1),
//   otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
// });

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST")
//     return res.status(405).json({ message: "Method Not Allowed" });

//   try {
//     const { ref_id, otp } = schema.parse(req.body);

//     const { data } = await cf.post<AadhaarOtpVerifyResponse>(
//       "/offline-aadhaar/verify",
//       { ref_id, otp }
//     );

//     // data includes status and KYC fields if valid
//     return res.status(200).json(data);
//   } catch (err: any) {
//     const code = err.response?.status ?? 500;
//     return res.status(code).json(err.response?.data ?? { message: "Server Error" });
//   }
// }
