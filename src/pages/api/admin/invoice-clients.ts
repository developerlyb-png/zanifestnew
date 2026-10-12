import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import InvoiceClient from "@/models/InvoiceClient";

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

const REQUIRED_FIELDS = [
  "name",
  "contactPerson",
  "email",
  "phone",
  "gstin",
  "pan",
  "addressLine1",
  "pincode",
  "city",
  "state",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin: any = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const { id, from, to, q } = req.query;
      if (id) {
        const client = await InvoiceClient.findById(String(id)).lean();
        if (!client) return res.status(404).json({ success: false, message: "Client not found" });
        return res.status(200).json({ success: true, client });
      }

      const query: any = {};

      // Used by the Create Invoice wizard's client search — a text search
      // looks across every client regardless of when it was added, so it
      // deliberately ignores the from/to date range the dashboard list uses.
      if (q) {
        const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [{ name: rx }, { email: rx }, { gstin: rx }, { contactPerson: rx }];
      } else if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(String(from));
        if (to) query.createdAt.$lte = new Date(String(to));
      }

      const clients = await InvoiceClient.find(query)
        .sort({ createdAt: -1 })
        .limit(q ? 20 : 0)
        .lean();
      return res.status(200).json({ success: true, clients });
    } catch (err: any) {
      console.log("INVOICE CLIENTS GET ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const b = req.body || {};
      const missing = REQUIRED_FIELDS.filter((f) => !String(b[f] || "").trim());
      if (missing.length) {
        return res.status(400).json({
          success: false,
          message: `Missing required field(s): ${missing.join(", ")}`,
        });
      }

      const adminName =
        `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email;

      const client = await InvoiceClient.create({
        name: String(b.name).trim(),
        contactPerson: String(b.contactPerson).trim(),
        email: String(b.email).trim(),
        phone: String(b.phone).trim(),
        gstin: String(b.gstin).trim(),
        pan: String(b.pan).trim(),
        addressLine1: String(b.addressLine1).trim(),
        addressLine2: String(b.addressLine2 || "").trim(),
        pincode: String(b.pincode).trim(),
        city: String(b.city).trim(),
        state: String(b.state).trim(),
        createdBy: adminName,
      });

      return res.status(201).json({ success: true, client });
    } catch (err: any) {
      console.log("INVOICE CLIENTS POST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const b = req.body || {};
      const { id } = b;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const missing = REQUIRED_FIELDS.filter((f) => !String(b[f] || "").trim());
      if (missing.length) {
        return res.status(400).json({
          success: false,
          message: `Missing required field(s): ${missing.join(", ")}`,
        });
      }

      const client = await InvoiceClient.findByIdAndUpdate(
        id,
        {
          name: String(b.name).trim(),
          contactPerson: String(b.contactPerson).trim(),
          email: String(b.email).trim(),
          phone: String(b.phone).trim(),
          gstin: String(b.gstin).trim(),
          pan: String(b.pan).trim(),
          addressLine1: String(b.addressLine1).trim(),
          addressLine2: String(b.addressLine2 || "").trim(),
          pincode: String(b.pincode).trim(),
          city: String(b.city).trim(),
          state: String(b.state).trim(),
        },
        { new: true }
      );
      if (!client) return res.status(404).json({ success: false, message: "Client not found" });
      return res.status(200).json({ success: true, client });
    } catch (err: any) {
      console.log("INVOICE CLIENTS PUT ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      const client = await InvoiceClient.findByIdAndDelete(id);
      if (!client) return res.status(404).json({ success: false, message: "Client not found" });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("INVOICE CLIENTS DELETE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
