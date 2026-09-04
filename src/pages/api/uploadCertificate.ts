import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import fs from "fs";
import os from "os";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  // formidable needs a scratch directory to stream the upload into while
  // parsing — os.tmpdir() instead of public/certificates since the file is
  // only read back into a base64 data URI below and then deleted; nothing
  // is meant to persist there (a file left under public/ wouldn't survive
  // a redeploy anyway, which is exactly what made generated certificates
  // 404 on the live site before).
  const uploadDir = os.tmpdir();

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields: any, files: any) => {

    if (err) {
      console.log("UPLOAD ERROR:", err);
      return res.status(500).json({ error: "Upload failed" });
    }

    const agentId = Array.isArray(fields.agentId)
      ? fields.agentId[0]
      : fields.agentId;

    if (!agentId) {
      return res.status(400).json({ error: "Agent ID missing" });
    }

    let uploadedFile: any = null;

    if (files.file) {
      uploadedFile = Array.isArray(files.file)
        ? files.file[0]
        : files.file;
    } else if (files.certificate) {
      uploadedFile = Array.isArray(files.certificate)
        ? files.certificate[0]
        : files.certificate;
    }

    if (!uploadedFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read the uploaded temp file into a base64 data URI and store that
    // directly on the agent document, then discard the temp file — the
    // certificate itself must not live under public/ (see note above).
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    const mimeType = uploadedFile.mimetype || "application/pdf";
    const dataUri = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
    fs.unlink(uploadedFile.filepath, () => {});

    // Save certificate data
    await Agent.findByIdAndUpdate(agentId, {
      $set: {
        certificate1: dataUri,
        certificate: dataUri,
      },
    });

    // =========================
    // ZIP AGENT CODE GENERATION
    // =========================

    const agent = await Agent.findById(agentId);

    if (agent && !agent.agentCode) {

      const lastAgent = await Agent.findOne({
        agentCode: { $regex: /^ZIP\d+$/ }
      })
        .sort({ createdAt: -1 })  // safer than string sort
        .select("agentCode");

      let nextNumber = 1309; // Starting ZIP number

      if (lastAgent?.agentCode) {
        const num = parseInt(
          lastAgent.agentCode.replace("ZIP", ""),
          10
        );

        if (!isNaN(num)) {
          nextNumber = num + 1;
        }
      }

      const newCode = `ZIP${nextNumber}`;

      await Agent.findByIdAndUpdate(agentId, {
        $set: { agentCode: newCode },
      });

      console.log("✅ ZIP Agent Code Generated:", newCode);
    }

    return res.status(200).json({
      success: true,
      url: dataUri,
    });

  });
}