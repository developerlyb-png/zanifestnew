import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { file } = req.query;

    if (!file || typeof file !== "string") {
      return res.status(400).json({ error: "File name required" });
    }

    const filePath = path.join(process.cwd(), "public/certificates", file);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const fileStream = fs.createReadStream(filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${file}"`);

    fileStream.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
