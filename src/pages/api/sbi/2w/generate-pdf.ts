import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import {
  PDFDocument,
  rgb,
  StandardFonts,
} from "pdf-lib";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {

    // ONLY POST ALLOWED

    if (req.method !== "POST") {

      return res.status(405).json({

        success: false,

        message: "Method not allowed",

      });

    }

    console.log(req.body);

    const {
      policyNumber,
      customer,
      vehicle,
      premium,
    } = req.body;

    // VALIDATION

    if (
      !policyNumber ||
      !customer ||
      !vehicle
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Missing required fields",

      });

    }

    // CREATE PDF

    const pdfDoc =
      await PDFDocument.create();

    const page =
      pdfDoc.addPage([600, 800]);

    const font =
      await pdfDoc.embedFont(
        StandardFonts.Helvetica
      );

    // TITLE

    page.drawText(
      "SBI BIKE INSURANCE POLICY",
      {
        x: 120,
        y: 740,
        size: 22,
        font,
        color: rgb(1, 0.4, 0),
      }
    );

    // POLICY DETAILS

    page.drawText(
      `Policy Number: ${policyNumber}`,
      {
        x: 50,
        y: 650,
        size: 16,
        font,
      }
    );

    page.drawText(
      `Customer Name: ${customer?.fullName}`,
      {
        x: 50,
        y: 610,
        size: 16,
        font,
      }
    );

    page.drawText(
      `Vehicle Number: ${vehicle?.number}`,
      {
        x: 50,
        y: 570,
        size: 16,
        font,
      }
    );

    page.drawText(
      `Premium Paid: Rs. ${premium}`,
      {
        x: 50,
        y: 530,
        size: 16,
        font,
      }
    );

    page.drawText(
      `Policy Status: ISSUED`,
      {
        x: 50,
        y: 490,
        size: 16,
        font,
      }
    );

    page.drawText(
      "Thank you for choosing SBI General Insurance",
      {
        x: 50,
        y: 400,
        size: 14,
        font,
        color: rgb(0, 0.5, 0),
      }
    );

    // SAVE PDF

    const pdfBytes =
      await pdfDoc.save();

    // RESPONSE HEADERS

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      "inline; filename=policy.pdf"
    );

    // SEND PDF

    return res.send(
      Buffer.from(pdfBytes)
    );

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message:
        "PDF generation failed",

      error,

    });

  }

}