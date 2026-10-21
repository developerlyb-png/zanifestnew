import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import Branch from "@/models/Branch";

// Full CRUD for Configuration Management's Branch tab — same Branch
// collection /api/admin/branches already reads (AddPolicyForm's simple
// name-only dropdown), so a branch created here shows up there too.
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

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const items = await Branch.find().sort({ name: 1 });
      return res.status(200).json({ success: true, items });
    } catch (err: any) {
      console.log("CONFIG BRANCHES LIST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const name = String(req.body?.name || "").trim();
      const code = String(req.body?.code || "").trim().toUpperCase();
      const active = req.body?.active !== false;

      if (!name) return res.status(400).json({ success: false, message: "Branch name is required" });
      if (!code) return res.status(400).json({ success: false, message: "Branch code is required" });

      const [nameClash, codeClash] = await Promise.all([
        Branch.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } }),
        Branch.findOne({ code }),
      ]);
      if (nameClash) return res.status(409).json({ success: false, message: "A branch with this name already exists" });
      if (codeClash) return res.status(409).json({ success: false, message: "A branch with this code already exists" });

      const item = await Branch.create({ name, code, active });
      return res.status(201).json({ success: true, item });
    } catch (err: any) {
      console.log("CONFIG BRANCHES CREATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const id = String(req.body?.id || "");
      const name = String(req.body?.name || "").trim();
      const code = String(req.body?.code || "").trim().toUpperCase();
      const active = req.body?.active !== false;

      if (!id) return res.status(400).json({ success: false, message: "Id is required" });
      if (!name) return res.status(400).json({ success: false, message: "Branch name is required" });
      if (!code) return res.status(400).json({ success: false, message: "Branch code is required" });

      const [nameClash, codeClash] = await Promise.all([
        Branch.findOne({ _id: { $ne: id }, name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } }),
        Branch.findOne({ _id: { $ne: id }, code }),
      ]);
      if (nameClash) return res.status(409).json({ success: false, message: "A branch with this name already exists" });
      if (codeClash) return res.status(409).json({ success: false, message: "A branch with this code already exists" });

      const item = await Branch.findByIdAndUpdate(id, { name, code, active }, { new: true });
      if (!item) return res.status(404).json({ success: false, message: "Branch not found" });
      return res.status(200).json({ success: true, item });
    } catch (err: any) {
      console.log("CONFIG BRANCHES UPDATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PATCH") {
    try {
      const id = String(req.body?.id || "");
      if (!id) return res.status(400).json({ success: false, message: "Id is required" });
      const item = await Branch.findByIdAndUpdate(
        id,
        { active: req.body?.active === true },
        { new: true }
      );
      if (!item) return res.status(404).json({ success: false, message: "Branch not found" });
      return res.status(200).json({ success: true, item });
    } catch (err: any) {
      console.log("CONFIG BRANCHES TOGGLE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
