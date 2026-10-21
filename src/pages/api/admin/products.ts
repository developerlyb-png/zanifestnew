import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import Product, {
  PRODUCT_DOCUMENT_CATEGORIES,
  PRODUCT_DOCUMENT_OPTIONS,
} from "@/models/Product";
import LineOfBusiness from "@/models/LineOfBusiness";

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

function slugify(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function generateUniqueCode(name: string, segment: string) {
  const base = `${slugify(name)}_${slugify(segment)}`;
  let code = base;
  let suffix = 2;
  while (await Product.exists({ code })) {
    code = `${base}_${suffix}`;
    suffix += 1;
  }
  return code;
}

function normalizeRequiredDocuments(input: any) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((g) => g && PRODUCT_DOCUMENT_CATEGORIES.includes(g.category))
    .map((g) => ({
      category: g.category,
      documents: Array.isArray(g.documents)
        ? g.documents.filter((d: string) => PRODUCT_DOCUMENT_OPTIONS.includes(d as any))
        : [],
    }))
    .filter((g) => g.documents.length > 0);
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
      const items = await Product.find()
        .populate("lineOfBusiness", "name code segment")
        .sort({ createdAt: -1 });
      return res.status(200).json({ success: true, items });
    } catch (err: any) {
      console.log("PRODUCTS LIST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const name = String(req.body?.name || "").trim();
      const lineOfBusinessId = String(req.body?.lineOfBusiness || "").trim();
      const description = String(req.body?.description || "").trim();

      if (!name) {
        return res.status(400).json({ success: false, message: "Product name is required" });
      }
      if (!lineOfBusinessId) {
        return res.status(400).json({ success: false, message: "Line of business is required" });
      }

      const lob = await LineOfBusiness.findById(lineOfBusinessId);
      if (!lob) {
        return res.status(400).json({ success: false, message: "Invalid line of business" });
      }

      const code = await generateUniqueCode(name, lob.segment);
      const requiredDocuments = normalizeRequiredDocuments(req.body?.requiredDocuments);

      const item = await Product.create({
        name,
        code,
        lineOfBusiness: lob._id,
        description,
        requiredDocuments,
      });

      const populated = await item.populate("lineOfBusiness", "name code segment");
      return res.status(201).json({ success: true, item: populated });
    } catch (err: any) {
      console.log("PRODUCTS CREATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const id = String(req.body?.id || "");
      const name = String(req.body?.name || "").trim();
      const lineOfBusinessId = String(req.body?.lineOfBusiness || "").trim();
      const description = String(req.body?.description || "").trim();

      if (!id) {
        return res.status(400).json({ success: false, message: "Id is required" });
      }
      if (!name) {
        return res.status(400).json({ success: false, message: "Product name is required" });
      }
      if (!lineOfBusinessId) {
        return res.status(400).json({ success: false, message: "Line of business is required" });
      }

      const lob = await LineOfBusiness.findById(lineOfBusinessId);
      if (!lob) {
        return res.status(400).json({ success: false, message: "Invalid line of business" });
      }

      const requiredDocuments = normalizeRequiredDocuments(req.body?.requiredDocuments);

      const item = await Product.findByIdAndUpdate(
        id,
        { name, lineOfBusiness: lob._id, description, requiredDocuments },
        { new: true }
      ).populate("lineOfBusiness", "name code segment");

      if (!item) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      return res.status(200).json({ success: true, item });
    } catch (err: any) {
      console.log("PRODUCTS UPDATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
