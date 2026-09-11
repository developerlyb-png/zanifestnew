import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import PolicyImport from "@/models/PolicyImport";
import { runExtractionJob } from "@/utils/aiPolicyExtractor";

// The frontend uploads one file per request (see PolicyDocumentImport.tsx),
// so this only ever needs to hold a single ~15MB PDF's base64 encoding
// (~20MB) plus JSON overhead — not a whole 25-file batch at once.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "22mb",
    },
  },
};

async function requireAdmin(req: NextApiRequest) {
  const token = req.cookies["adminToken"];
  const data = token ? await verifyToken(token) : null;

  if (
    !data ||
    typeof data !== "object" ||
    !("role" in data) ||
    !["superadmin", "admin"].includes((data as any).role)
  ) {
    return null;
  }
  return data;
}

// Matches the reference insurance-crm-mvp project: up to 25 PDFs per batch,
// 15MB max per file.
const MAX_FILES_PER_BATCH = 25;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const items = await PolicyImport.find({}, { fileData: 0 }).sort({ createdAt: -1 }).limit(100);
      return res.status(200).json({ success: true, items });
    } catch (err: any) {
      console.log("POLICY IMPORT LIST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const files = Array.isArray(req.body?.files) ? req.body.files : [];
      if (files.length === 0) {
        return res.status(400).json({ success: false, message: "No PDFs uploaded" });
      }
      if (files.length > MAX_FILES_PER_BATCH) {
        return res
          .status(400)
          .json({ success: false, message: `Maximum ${MAX_FILES_PER_BATCH} PDFs per batch` });
      }

      const adminName =
        `${(admin as any).userFirstName ?? ""} ${(admin as any).userLastName ?? ""}`.trim() ||
        (admin as any).email;

      const ids: string[] = [];
      const skipped: string[] = [];

      for (const f of files) {
        const fileName = String(f?.fileName || "").trim();
        const fileData = String(f?.fileData || "");
        if (!fileName || !fileData.startsWith("data:application/pdf")) {
          skipped.push(fileName || "unknown file");
          continue;
        }
        const approxBytes = (fileData.length * 3) / 4;
        if (approxBytes > MAX_FILE_BYTES) {
          skipped.push(fileName);
          continue;
        }

        const doc = await PolicyImport.create({
          originalName: fileName,
          fileData,
          status: "processing",
          createdBy: adminName,
        });
        ids.push(String(doc._id));
        // Fire-and-forget — the review queue polls GET / for status updates.
        runExtractionJob(String(doc._id));
      }

      if (ids.length === 0) {
        return res.status(400).json({ success: false, message: "No valid PDF files in this batch" });
      }

      return res.status(202).json({ success: true, ids, skipped });
    } catch (err: any) {
      console.log("POLICY IMPORT UPLOAD ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
