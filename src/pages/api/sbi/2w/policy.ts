import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    const {
      proposalNumber,
    } = req.body;

    // MOCK POLICY PDF

    const policyData = {
      policyNumber:
        "POL" + Date.now(),

      proposalNumber,

      pdfUrl:
"http://localhost:3000/sample-policy.pdf",

      status: "ISSUED",
    };

    return res.status(200).json({
      success: true,
      data: policyData,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}