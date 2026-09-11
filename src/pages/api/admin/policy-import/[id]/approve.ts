import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import PolicyImport from "@/models/PolicyImport";
import IssuedPolicy from "@/models/IssuedPolicy";
import { findDuplicatePolicy, buildPolicyFromExtraction } from "@/utils/aiPolicyExtractor";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Import id is required" });
  }

  await dbConnect();

  try {
    const imp: any = await PolicyImport.findById(id);
    if (!imp) {
      return res.status(404).json({ success: false, message: "Import not found" });
    }
    if (imp.status === "saved") {
      return res.status(409).json({ success: false, message: "Already saved" });
    }

    const edits = req.body?.data && typeof req.body.data === "object" ? req.body.data : {};
    const merged = { ...(imp.extracted || {}), ...edits };

    const dup = await findDuplicatePolicy(merged);
    if (dup) {
      return res.status(409).json({ success: false, message: "Duplicate policy detected", duplicate: dup });
    }

    const adminName =
      `${(admin as any).userFirstName ?? ""} ${(admin as any).userLastName ?? ""}`.trim() ||
      (admin as any).email;

    const policyFields = buildPolicyFromExtraction(merged, {
      createdBy: adminName,
      importId: String(imp._id),
      fileData: imp.fileData,
      originalName: imp.originalName,
    });

    const policy = await IssuedPolicy.create(policyFields);

    imp.status = "saved";
    imp.extracted = merged;
    imp.confidence = merged.confidence ?? imp.confidence;
    imp.error = undefined;
    imp.savedPolicyId = policy._id;
    await imp.save();

    return res.status(200).json({ success: true, policy });
  } catch (err: any) {
    console.log("POLICY IMPORT APPROVE ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
