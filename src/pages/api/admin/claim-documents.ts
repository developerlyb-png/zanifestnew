import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import Claim from "@/models/Claim";

export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

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
  return data as any;
}

const MAX_BYTES = 8 * 1024 * 1024;

// POST { id, name, mimeType, data(data URI) } uploads; DELETE { id, docId } removes.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: "Not authorized" });
  await dbConnect();

  try {
    if (req.method === "POST") {
      const { id, name, mimeType, data } = req.body || {};
      if (!id || !name || typeof data !== "string" || !data.startsWith("data:")) {
        return res
          .status(400)
          .json({ success: false, message: "id, name and file data are required" });
      }
      const size = Math.floor((data.length * 3) / 4);
      if (size > MAX_BYTES) {
        return res.status(413).json({ success: false, message: "File is too large (max 8 MB)" });
      }
      const by = `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email;
      const claim = await Claim.findByIdAndUpdate(
        id,
        { $push: { documents: { name, mimeType, size, data, uploadedBy: by } } },
        { new: true, projection: { "documents.data": 0 } }
      ).lean();
      if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
      return res.status(200).json({ success: true, documents: (claim as any).documents });
    }

    if (req.method === "DELETE") {
      const { id, docId } = req.body || {};
      if (!id || !docId) {
        return res.status(400).json({ success: false, message: "id and docId are required" });
      }
      const claim = await Claim.findByIdAndUpdate(
        id,
        { $pull: { documents: { _id: docId } } },
        { new: true, projection: { "documents.data": 0 } }
      ).lean();
      if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
      return res.status(200).json({ success: true, documents: (claim as any).documents });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (err: any) {
    console.log("CLAIM DOCUMENTS ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
