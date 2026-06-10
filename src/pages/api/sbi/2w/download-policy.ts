import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import mongoose from "mongoose";

import fs from "fs";

import path from "path";

import QRCode from "qrcode";

import {
  PDFDocument,
  rgb,
  StandardFonts,
} from "pdf-lib";

import IssuedPolicy from "@/models/IssuedPolicy";

// DB CONNECT

const MONGO_URI =
  process.env.MONGODB_URI || "";

async function connectDB() {

  if (
    mongoose.connections[0]
      .readyState
  )
    return;

  await mongoose.connect(
    MONGO_URI
  );

}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {

    // ONLY POST

    if (req.method !== "POST") {

      return res.status(405).json({

        success: false,

        message:
          "Method not allowed",

      });

    }

    // CONNECT DB

    await connectDB();

    // GET ID

    const { id } = req.body;

    // FIND POLICY

    const policy =
      await IssuedPolicy.findById(
        id
      );

    if (!policy) {

      return res.status(404).json({

        success: false,

        message:
          "Policy not found",

      });

    }

    // FORMAT DATES

    const startDate =
      policy.startDate
        ? new Date(
            policy.startDate
          ).toLocaleDateString(
            "en-GB"
          )
        : "N/A";

    const endDate =
      policy.endDate
        ? new Date(
            policy.endDate
          ).toLocaleDateString(
            "en-GB"
          )
        : "N/A";

    // CREATE PDF

    const pdfDoc =
      await PDFDocument.create();

    // LOAD LOGO

    const logoPath =
      path.join(
        process.cwd(),
        "public/assets/bajaj.png"
      );

    const logoBytes =
      fs.readFileSync(
        logoPath
      );

    const logoImage =
      await pdfDoc.embedPng(
        logoBytes
      );

    // GENERATE QR CODE

    const qrData =
      `Policy No: ${policy.policyNumber}
Customer: ${policy.customer?.fullName}
Vehicle: ${policy.vehicle?.number}
Status: ${policy.status}`;

    const qrImageData =
      await QRCode.toDataURL(
        qrData
      );

    const qrImageBytes =
      Buffer.from(
        qrImageData.replace(
          /^data:image\/png;base64,/,
          ""
        ),
        "base64"
      );

    const qrImage =
      await pdfDoc.embedPng(
        qrImageBytes
      );

    // PAGE

    const page =
      pdfDoc.addPage([
        600,
        800,
      ]);

    // FONT

    const font =
      await pdfDoc.embedFont(
        StandardFonts.Helvetica
      );

    // HEADER BG

    page.drawRectangle({

      x: 0,

      y: 720,

      width: 600,

      height: 80,

      color: rgb(
        0,
        0.2,
        0.6
      ),

    });

    // LOGO

    page.drawImage(
      logoImage,
      {

        x: 40,

        y: 730,

        width: 120,

        height: 40,

      }
    );

    // TITLE

    page.drawText(
      "BIKE INSURANCE POLICY",
      {

        x: 190,

        y: 745,

        size: 22,

        font,

        color: rgb(
          1,
          1,
          1
        ),

      }
    );

    // POLICY BOX

    page.drawRectangle({

      x: 40,

      y: 360,

      width: 520,

      height: 300,

      borderColor: rgb(
        0.8,
        0.8,
        0.8
      ),

      borderWidth: 1,

    });

    // SECTION TITLE

    page.drawText(
      "Policy Details",
      {

        x: 60,

        y: 630,

        size: 18,

        font,

        color: rgb(
          0,
          0.2,
          0.6
        ),

      }
    );

    // POLICY NUMBER

    page.drawText(
      `Policy Number: ${policy.policyNumber}`,
      {

        x: 60,

        y: 590,

        size: 14,

        font,

      }
    );

    // CUSTOMER

    page.drawText(
      `Customer Name: ${policy.customer?.fullName}`,
      {

        x: 60,

        y: 555,

        size: 14,

        font,

      }
    );

    // VEHICLE

    page.drawText(
      `Vehicle Number: ${
        policy.vehicle?.number ||
        "N/A"
      }`,
      {

        x: 60,

        y: 520,

        size: 14,

        font,

      }
    );

    // PREMIUM

    page.drawText(
      `Premium Paid: Rs.${policy.premium}`,
      {

        x: 60,

        y: 485,

        size: 14,

        font,

      }
    );

    // STATUS

    page.drawText(
      `Status: ${policy.status}`,
      {

        x: 60,

        y: 450,

        size: 14,

        font,

      }
    );

    // START DATE

    page.drawText(
      `Start Date: ${startDate}`,
      {

        x: 60,

        y: 415,

        size: 14,

        font,

      }
    );

    // EXPIRY DATE

    page.drawText(
      `Expiry Date: ${endDate}`,
      {

        x: 60,

        y: 380,

        size: 14,

        font,

      }
    );

    // QR CODE

    page.drawImage(
      qrImage,
      {

        x: 400,

        y: 380,

        width: 120,

        height: 120,

      }
    );

    // FOOTER BG

    page.drawRectangle({

      x: 0,

      y: 0,

      width: 600,

      height: 60,

      color: rgb(
        0,
        0.2,
        0.6
      ),

    });

    // FOOTER TEXT

    page.drawText(
      "Thank you for choosing Bajaj Insurance",
      {

        x: 120,

        y: 25,

        size: 14,

        font,

        color: rgb(
          1,
          1,
          1
        ),

      }
    );

    // SAVE PDF

    const pdfBytes =
      await pdfDoc.save();

    // HEADERS

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${policy.policyNumber}.pdf`
    );

    // SEND PDF

    return res.send(
      Buffer.from(
        pdfBytes
      )
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