import type { NextApiRequest, NextApiResponse } from "next";
import { formidable } from "formidable";
import fs from "fs";
import { extractText } from "unpdf";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const form = formidable();

  form.parse(req, async (err, fields, files: any) => {
    if (err) {
      return res.status(500).json({ error: "UPLOAD_FAILED" });
    }

    const file = files.pdf?.[0];
    if (!file) {
      return res.status(400).json({ error: "NO_FILE" });
    }

    const buffer = fs.readFileSync(file.filepath);

    try {
      // 🔓 If this succeeds → PDF is NOT password protected
      const result = await extractText(new Uint8Array(buffer));

      return res.status(200).json({
        encrypted: false,
        text: result.text || "",
      });
    } catch {
      // 🔐 If extractText fails → PDF IS password protected
      return res.status(200).json({
        encrypted: true,
      });
    }
  });
}
