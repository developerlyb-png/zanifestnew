import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import { ensureAgentCode } from "@/lib/agentCode";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Same "Appointment Letter" layout previously only reachable via the admin's
// manual /api/createCertificate button — extracted so it can also run
// automatically the moment an agent passes their exam (see
// src/pages/api/agent/complete-training.ts), with a real POS Code instead of
// the permanent "N/A" that resulted from generating before agentCode existed.
//
// Rendered straight to an in-memory buffer and stored as a base64 data URI
// (same convention as PAN/Aadhaar/cheque uploads elsewhere in this app)
// instead of writing a file under public/certificates — a runtime-written
// file there doesn't survive a redeploy (that folder isn't in git, so a
// fresh deploy has nothing to restore it from), which is exactly why
// previously-generated certificates started 404ing on the live site.

const BRAND_BLUE = "#1c75bb";

// Scales an image to a target width and reports the height it will render
// at, so absolutely-positioned elements after it don't have to guess.
async function imageHeightForWidth(imgPath: string, width: number, fallbackRatio = 0.35): Promise<number> {
  try {
    const meta = await sharp(imgPath).metadata();
    if (meta.width && meta.height) return (width / meta.width) * meta.height;
  } catch {
    // ignore — fall back below
  }
  return width * fallbackRatio;
}

// Writes a paragraph where one or more exact substrings render bold while
// the rest stays regular weight — used for "...conducted by ZANIFEST
// INSURANCE BROKER PVT. LTD. under..." style sentences.
function writeWithBoldPhrases(doc: PDFKit.PDFDocument, text: string, boldPhrases: string[], x: number, width: number) {
  const pattern = new RegExp(`(${boldPhrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = text.split(pattern).filter((p) => p.length > 0);

  parts.forEach((part, i) => {
    const isBold = boldPhrases.includes(part);
    doc.font(isBold ? "Helvetica-Bold" : "Helvetica");
    if (i === 0) {
      doc.text(part, x, doc.y, { width, continued: i < parts.length - 1, lineGap: 4 });
    } else {
      doc.text(part, { continued: i < parts.length - 1, lineGap: 4 });
    }
  });
  doc.font("Helvetica");
}

async function drawCertificatePdf(agent: any): Promise<string> {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const pageWidth = doc.page.width;
  const contentX = 60;
  const contentWidth = pageWidth - contentX * 2;

  // Outer border frame — gives the page a formal "certificate" feel.
  doc
    .lineWidth(1.2)
    .strokeColor(BRAND_BLUE)
    .rect(18, 18, pageWidth - 36, doc.page.height - 36)
    .stroke();
  doc
    .lineWidth(0.5)
    .strokeColor("#b9d4ea")
    .rect(24, 24, pageWidth - 48, doc.page.height - 48)
    .stroke();

  const watermarkPath = path.join(process.cwd(), "public/wa.png");
  if (fs.existsSync(watermarkPath)) {
    doc.save();
    doc.opacity(0.1);
    doc.image(watermarkPath, pageWidth - 220, 40, { width: 240 });
    doc.opacity(1);
    doc.restore();
  }

  // ---------------- Letterhead: centered logo + company name ----------------
  const logoPath = path.join(process.cwd(), "public/logo.png");
  let y = 42;
  if (fs.existsSync(logoPath)) {
    const logoWidth = 170;
    const logoHeight = await imageHeightForWidth(logoPath, logoWidth);
    doc.image(logoPath, pageWidth / 2 - logoWidth / 2, y, { width: logoWidth });
    y += logoHeight + 10;
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("#1a1a1a")
    .text("ZANIFEST INSURANCE BROKER PVT. LTD.", contentX, y, { width: contentWidth, align: "center" });
  y = doc.y + 4;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#666")
    .text("IRDA License No.: 1119, Expiry Date: 27/11/2028", contentX, y, { width: contentWidth, align: "center" });
  y = doc.y + 14;

  doc.lineWidth(1).strokeColor(BRAND_BLUE).moveTo(contentX, y).lineTo(pageWidth - contentX, y).stroke();
  y += 22;

  doc
    .font("Helvetica-Bold")
    .fontSize(21)
    .fillColor(BRAND_BLUE)
    .text("CERTIFICATE OF COMPLETION", contentX, y, { width: contentWidth, align: "center" });
  y = doc.y + 26;

  // ---------------- Applicant photo (top-right of the body) ----------------
  const photoSize = 95;
  let photoBottomY = y;
  if (agent.profileImage) {
    try {
      const base64Data = agent.profileImage.split(",")[1];
      const imgBuffer = Buffer.from(base64Data, "base64");
      const pngBuffer = await sharp(imgBuffer).resize(photoSize, photoSize, { fit: "cover" }).png().toBuffer();
      const photoX = pageWidth - contentX - photoSize;
      doc.image(pngBuffer, photoX, y, { width: photoSize, height: photoSize });
      doc.lineWidth(1).strokeColor(BRAND_BLUE).rect(photoX, y, photoSize, photoSize).stroke();
      photoBottomY = y + photoSize + 10;
    } catch (err) {
      console.log("Profile image load error:", err);
    }
  }

  // ---------------- Body ----------------
  // These three opening lines run in a column narrow enough to sit beside
  // the photo (not under it), so they start right under the title instead
  // of waiting for the photo to clear — that wait was leaving a tall empty
  // gap on the left, where the photo isn't even there.
  const introWidth = 340;
  doc.y = y;
  doc.font("Helvetica").fontSize(11).fillColor("black");

  doc.text("This is in reference to the application made by", contentX, doc.y, { width: introWidth, lineGap: 4 });
  doc.moveDown(0.3);

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("black")
    .text(`${agent.firstName} ${agent.lastName}`.trim().toUpperCase(), contentX, doc.y, { width: introWidth, lineGap: 4 });
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(11);

  // Dynamic residence — built from the agent's own city/district/state
  // (there's no free-text street-address field on the Agent model).
  const residence = [agent.city, agent.district, agent.state].filter(Boolean).join(", ");
  doc.text(
    `residing at ${residence || "N/A"} requesting to enroll as a Point of Sales Person.`,
    contentX,
    doc.y,
    { width: introWidth, lineGap: 4 }
  );
  doc.moveDown(0.5);

  // From here on, paragraphs span the full content width, so they must sit
  // below the photo rather than possibly running under it.
  doc.y = Math.max(doc.y, photoBottomY);

  writeWithBoldPhrases(
    doc,
    "This is to confirm that you have successfully completed the prescribed training and have also passed the examination specified for Point of Sales examination conducted by ZANIFEST INSURANCE BROKER PVT. LTD. under the Guidelines on Point of Sales Person.",
    ["ZANIFEST INSURANCE BROKER PVT. LTD."],
    contentX,
    contentWidth
  );
  doc.moveDown(0.6);

  // Real POS code now — ensureAgentCode() (called before this function) has
  // already assigned one, so this no longer permanently bakes in "N/A".
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("black")
    .text(`PAN No.: ${agent.panNumber || "N/A"}`, contentX, doc.y, { width: contentWidth, lineGap: 4 });
  doc.moveDown(0.25);
  doc
    .font("Helvetica-Bold")
    .text(`IRDAI POSP Code: ${agent.agentCode || "N/A"}`, contentX, doc.y, { width: contentWidth, lineGap: 4 });
  doc.font("Helvetica");
  doc.moveDown(0.6);

  writeWithBoldPhrases(
    doc,
    "This letter authorizes you to act as Point of Sales Person for ZANIFEST INSURANCE BROKER PVT. LTD. to market products categorized and identified under the Guidelines only.",
    ["ZANIFEST INSURANCE BROKER PVT. LTD."],
    contentX,
    contentWidth
  );
  doc.moveDown(0.6);

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("black")
    .text(
      "In case you wish to work for another company, you are required to obtain a fresh letter from the new insurer / insurance intermediary in order to act as Point of Sales Person for that entity.",
      contentX,
      doc.y,
      { width: contentWidth, lineGap: 4 }
    );

  // ---------------- Signature block ----------------
  // Anchored to wherever the body text actually finished (doc.y), not a
  // fixed distance from the page bottom — a fixed offset overlapped the
  // signature/stamp with the body whenever the body ran long enough
  // (longer residence/address text, extra wrapped lines, etc.).
  doc.moveDown(1);
  const sigTopY = doc.y;

  // Filename must match the case actually committed to git ("ca.jpeg") —
  // Windows' filesystem is case-insensitive so "Ca.jpeg" worked locally,
  // but Linux (the live server) is case-sensitive, so this silently found
  // nothing there and fs.existsSync's guard below just skipped the image.
  const signPath = path.join(process.cwd(), "public/ca.jpeg");
  const signWidth = 85;
  let signHeight = signWidth; // square fallback if the file is missing
  if (fs.existsSync(signPath)) {
    signHeight = await imageHeightForWidth(signPath, signWidth, 1);
    doc.image(signPath, contentX, sigTopY, { width: signWidth });
  }
  // The line sits just under the signature/stamp image's actual rendered
  // height (not a guessed fixed offset), so it never cuts through it.
  const lineY = sigTopY + signHeight + 8;

  doc.lineWidth(1).strokeColor(BRAND_BLUE).moveTo(contentX, lineY).lineTo(contentX + 190, lineY).stroke();

  doc
    .fillColor("black")
    .fontSize(11)
    .text("Authorised Signatory\nMANDEEP RATHEE\nPrincipal Officer", contentX, lineY + 8, { lineGap: 3 });

  const today = new Date().toLocaleDateString("en-GB");
  doc.text(`Date: ${today}`, pageWidth - contentX - 120, lineY + 8, { width: 120, align: "right" });

  // Positioned with enough clearance above the bottom margin that this
  // 2-line block can never trip PDFKit's automatic page break — it was
  // previously pinned at page.height - 60, which overflowed the margin by
  // a couple of points and silently pushed a near-empty second page onto
  // every certificate.
  doc
    .fontSize(8)
    .fillColor("gray")
    .text(
      "Reg. Office: SCF-8, FIRST FLOOR, OLD AMABALA ROAD, DHAKOLI, ZIRAKPUR, MOHALI, PUNJAB, 140603\nVisit us at: www.zanifestinsurance.com      Email ID – mandeep.rathee@zanifestinsurance.com      Ph.01762-496934",
      50,
      doc.page.height - 75,
      { width: doc.page.width - 100, align: "center", lineGap: 2 }
    );

  doc.end();
  await new Promise<void>((resolve) => doc.on("end", resolve));

  const pdfBuffer = Buffer.concat(chunks);
  return `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
}

// Ensures a real POS Code exists, renders the PDF with it, and persists the
// certificate path — the single place both the admin's manual "Generate
// Certificate" button and automatic post-exam generation now go through.
export async function generateAgentCertificate(agentId: string) {
  await dbConnect();

  const agent = await Agent.findById(agentId);
  if (!agent) throw new Error("Agent not found");

  const agentCode = await ensureAgentCode(agent);
  const url = await drawCertificatePdf(agent);

  await Agent.findByIdAndUpdate(agentId, {
    $set: { certificate: url, certificate2: url },
  });

  return { url, agentCode };
}
