import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import LineOfBusiness, {
  LOB_SEGMENTS,
  LOB_IRDAI_GROUPS,
} from "@/models/LineOfBusiness";

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

function deriveIrdaiType(irdaiGroup: string): "GI" | "LI" {
  return irdaiGroup === "Life Insurance" ? "LI" : "GI";
}

function slugify(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function generateUniqueCode(name: string, segment: string) {
  const base = `${slugify(name)}_${segment.toUpperCase()}`;
  let code = base;
  let suffix = 2;
  while (await LineOfBusiness.exists({ code })) {
    code = `${base}_${suffix}`;
    suffix += 1;
  }
  return code;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const items = await LineOfBusiness.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, items });
    } catch (err: any) {
      console.log("LINE OF BUSINESS LIST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const name = String(req.body?.name || "").trim();
      const segment = String(req.body?.segment || "").trim();
      const irdaiGroup = String(req.body?.irdaiGroup || "").trim();
      const description = String(req.body?.description || "").trim();

      if (!name) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      if (!LOB_SEGMENTS.includes(segment as any)) {
        return res.status(400).json({ success: false, message: "Invalid business segment" });
      }
      if (!LOB_IRDAI_GROUPS.includes(irdaiGroup as any)) {
        return res.status(400).json({ success: false, message: "Invalid IRDAI group" });
      }

      const code = await generateUniqueCode(name, segment);
      const irdaiType = deriveIrdaiType(irdaiGroup);

      const item = await LineOfBusiness.create({
        name,
        code,
        segment,
        irdaiGroup,
        irdaiType,
        description,
      });

      return res.status(201).json({ success: true, item });
    } catch (err: any) {
      console.log("LINE OF BUSINESS CREATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const id = String(req.body?.id || "");
      const name = String(req.body?.name || "").trim();
      const segment = String(req.body?.segment || "").trim();
      const irdaiGroup = String(req.body?.irdaiGroup || "").trim();
      const description = String(req.body?.description || "").trim();

      if (!id) {
        return res.status(400).json({ success: false, message: "Id is required" });
      }
      if (!name) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      if (!LOB_SEGMENTS.includes(segment as any)) {
        return res.status(400).json({ success: false, message: "Invalid business segment" });
      }
      if (!LOB_IRDAI_GROUPS.includes(irdaiGroup as any)) {
        return res.status(400).json({ success: false, message: "Invalid IRDAI group" });
      }

      const irdaiType = deriveIrdaiType(irdaiGroup);

      const item = await LineOfBusiness.findByIdAndUpdate(
        id,
        { name, segment, irdaiGroup, irdaiType, description },
        { new: true }
      );

      if (!item) {
        return res.status(404).json({ success: false, message: "Line of business not found" });
      }

      return res.status(200).json({ success: true, item });
    } catch (err: any) {
      console.log("LINE OF BUSINESS UPDATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
