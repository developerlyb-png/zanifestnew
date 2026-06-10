import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import path from "path";
import fs from "fs";
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

  const uploadDir = path.join(process.cwd(), "public", "certificates");

  // ensure folder exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

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

    const filePath = `/certificates/${path.basename(uploadedFile.filepath)}`;

    // Save certificate path
    await Agent.findByIdAndUpdate(agentId, {
      $set: {
        certificate1: filePath,
        certificate: filePath,
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
      url: filePath,
    });

  });
}