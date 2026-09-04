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
async function drawCertificatePdf(agent: any): Promise<string> {
  const doc = new PDFDocument({ size: "A4", margin: 30 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const logoPath = path.join(process.cwd(), "public/logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 40, 30, { width: 120 });
  }

  // Header — company name + license line, alongside the logo (new content,
  // same header zone/format as before).
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#1a1a1a")
    .text("ZANIFEST INSURANCE BROKER PVT. LTD.", 170, 38, { width: 330 });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#555")
    .text("IRDA License No.: 1119, Expiry Date: 27/11/2028", 170, 58);

  const watermarkPath = path.join(process.cwd(), "public/wa.png");
  if (fs.existsSync(watermarkPath)) {
    doc.save();
    doc.opacity(0.12);
    doc.image(watermarkPath, doc.page.width - 200, -75, { width: 240 });
    doc.opacity(1);
    doc.restore();
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#2c6fb7")
    .text("CERTIFICATE OF COMPLETION", 0, 90, { align: "center" });

  doc.font("Helvetica").fontSize(11).fillColor("black");

  let y = 155; // extra breathing room below the heading before the body starts

  const write = (text: string, gap = 18) => {
    doc.text(text, 60, y, { width: 480 });
    y += gap;
  };

  write("This is in reference to the application made by", 20);

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("black")
    .text(`${agent.firstName} ${agent.lastName}`.trim().toUpperCase(), 60, y);
  y += 22;
  doc.font("Helvetica").fontSize(11);

  if (agent.profileImage) {
    try {
      const base64Data = agent.profileImage.split(",")[1];
      const imgBuffer = Buffer.from(base64Data, "base64");
      const pngBuffer = await sharp(imgBuffer).png().toBuffer();
      doc.image(pngBuffer, doc.page.width - 130, 80, { width: 70, height: 70 });
    } catch (err) {
      console.log("Profile image load error:", err);
    }
  }

  // Dynamic residence — built from the agent's own city/district/state
  // (there's no free-text street-address field on the Agent model).
  const residence = [agent.city, agent.district, agent.state].filter(Boolean).join(", ");
  write(
    `residing at ${residence || "N/A"} requesting to enroll as a Point of Sales Person.`,
    34
  );

  write(
    "This is to confirm that you have successfully completed the prescribed training and have also passed the examination specified for Point of Sales examination conducted by ZANIFEST INSURANCE BROKER PVT. LTD. under the Guidelines on Point of Sales Person.",
    46
  );

  // Real POS code now — ensureAgentCode() (called before this function) has
  // already assigned one, so this no longer permanently bakes in "N/A".
  write(`PAN No.: ${agent.panNumber || "N/A"}`, 16);
  write(`IRDAI POSP Code: ${agent.agentCode || "N/A"}`, 26);

  write(
    "This letter authorizes you to act as Point of Sales Person for ZANIFEST INSURANCE BROKER PVT. LTD. to market products categorized and identified under the Guidelines only.",
    36
  );

  write(
    "In case you wish to work for another company, you are required to obtain a fresh letter from the new insurer / insurance intermediary in order to act as Point of Sales Person for that entity.",
    36
  );

  const lineY = doc.page.height - 210;

  const signPath = path.join(process.cwd(), "public/Ca.jpeg");
  if (fs.existsSync(signPath)) {
    doc.image(signPath, 70, lineY - 130, { width: 140 });
  }

  doc.lineWidth(1).strokeColor("#2c6fb7").moveTo(60, lineY).lineTo(250, lineY).stroke();

  doc
    .fillColor("black")
    .fontSize(11)
    .text("Authorised Signatory\nMANDEEP RATHEE\nPrincipal Officer", 60, lineY + 5);

  const today = new Date().toLocaleDateString("en-GB");
  doc.text(`Date: ${today}`, 420, lineY + 5);

  doc
    .fontSize(8)
    .fillColor("gray")
    .text(
      "Reg. Office: SCF-8, FIRST FLOOR, OLD AMABALA ROAD, DHAKOLI, ZIRAKPUR, MOHALI, PUNJAB, 140603\nVisit us at: www.zanifestinsurance.com      Email ID – mandeep.rathee@zanifestinsurance.com      Ph.01762-496934",
      50,
      doc.page.height - 65,
      { width: doc.page.width - 100, align: "center" }
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
