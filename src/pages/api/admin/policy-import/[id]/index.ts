import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import PolicyImport from "@/models/PolicyImport";

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

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Import id is required" });
  }

  await dbConnect();

  if (req.method === "DELETE") {
    try {
      // Only removes this import record (and the PDF stored on it) — a
      // policy it already saved to the Customer Dashboard is left alone;
      // that has its own delete flow there.
      const imp = await PolicyImport.findByIdAndDelete(id);
      if (!imp) {
        return res.status(404).json({ success: false, message: "Import not found" });
      }
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("POLICY IMPORT DELETE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
