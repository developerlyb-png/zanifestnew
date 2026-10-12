import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import IssuedPolicy from "@/models/IssuedPolicy";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
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

// Maps a User document (which doubles as the online-login account and the
// admin-managed insured/client directory) to the { name, email, phone, ... }
// shape the "Insured Name" / "Add Client" UI already speaks.
const toClientShape = (u: any) => ({
  _id: String(u._id),
  name: u.userName,
  email: u.email || "",
  phone: u.mobile || "",
  address: u.address || "",
  kycDocumentType: u.kycDocumentType || "",
  kycFiles: u.kycFiles || [],
  notifyWhatsapp: !!u.notifyWhatsapp,
  notifyEmail: !!u.notifyEmail,
  isGlobal: !!u.isGlobal,
  isActive: u.isActive !== false,
  subClients: u.subClients || [],
  createdAt: u.createdAt,
});

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
      const { id, q } = req.query;

      if (id) {
        if (String(id).startsWith("policy-")) {
          return res.status(400).json({
            success: false,
            message: "This client hasn't been saved to the client directory yet. Edit it via Add Client first.",
          });
        }
        const user = await User.findById(String(id));
        if (!user) return res.status(404).json({ success: false, message: "Client not found" });
        return res.status(200).json({ success: true, client: toClientShape(user) });
      }

      const query: any = {};
      if (q) {
        query.userName = { $regex: String(q), $options: "i" };
      }
      const users = await User.find(query).sort({ userName: 1 }).limit(200);
      const clients = users.map(toClientShape);

      // Also surface insured names that already exist in the Policy data table
      // (IssuedPolicy.customer) but don't (yet) match a User record, so the
      // dropdown isn't empty before any client has been created via "Add Insured".
      const policyNameQuery: any = { "customer.fullName": { $exists: true, $ne: "" } };
      if (q) {
        policyNameQuery["customer.fullName"] = { $regex: String(q), $options: "i" };
      }
      const policies = await IssuedPolicy.find(policyNameQuery, {
        "customer.fullName": 1,
        "customer.email": 1,
        "customer.mobile": 1,
        "customer.address": 1,
      })
        .sort({ createdAt: -1 })
        .limit(300);

      const seen = new Set(clients.map((c) => c.name.trim().toLowerCase()));
      const derived: any[] = [];
      for (const p of policies as any[]) {
        const name = p.customer?.fullName?.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        derived.push({
          _id: `policy-${p._id}`,
          name,
          email: p.customer?.email || "",
          phone: p.customer?.mobile || "",
          address: p.customer?.address || "",
          kycDocumentType: "",
          kycFiles: [],
          notifyWhatsapp: false,
          notifyEmail: false,
          isGlobal: false,
          isActive: true,
          subClients: [],
          createdAt: p.createdAt,
        });
      }

      const merged = [...clients, ...derived].sort((a, b) => a.name.localeCompare(b.name));
      return res.status(200).json({ success: true, clients: merged });
    } catch (err: any) {
      console.log("ADMIN CLIENTS ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      if (!body.name || !body.email || !body.phone) {
        return res.status(400).json({
          success: false,
          message: "Client Name, Email Address and Phone Number are required",
        });
      }

      // Reuse an existing User (e.g. an online-registered customer) with the
      // same email instead of creating a duplicate account for the same person.
      const user = await User.findOneAndUpdate(
        { email: String(body.email).toLowerCase() },
        {
          $set: {
            userName: body.name,
            mobile: body.phone,
            address: body.address,
            kycDocumentType: body.kycDocumentType,
            kycFiles: body.kycFiles || [],
            notifyWhatsapp: !!body.notifyWhatsapp,
            notifyEmail: !!body.notifyEmail,
            isGlobal: !!body.isGlobal,
            subClients: body.subClients || [],
          },
          $setOnInsert: { source: "manual" },
        },
        { new: true, upsert: true }
      );

      return res.status(201).json({ success: true, client: toClientShape(user) });
    } catch (err: any) {
      console.log("ADMIN CLIENTS CREATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PATCH") {
    try {
      const body = req.body || {};
      const { id } = body;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      if (String(id).startsWith("policy-")) {
        return res.status(400).json({
          success: false,
          message: "This client hasn't been saved to the client directory yet. Use Add Client to save it first.",
        });
      }

      const update: any = {};
      if (body.name !== undefined) update.userName = body.name;
      if (body.email !== undefined) update.email = String(body.email).toLowerCase();
      if (body.phone !== undefined) update.mobile = body.phone;
      if (body.address !== undefined) update.address = body.address;
      if (body.kycDocumentType !== undefined) update.kycDocumentType = body.kycDocumentType;
      if (body.kycFiles !== undefined) update.kycFiles = body.kycFiles;
      if (body.notifyWhatsapp !== undefined) update.notifyWhatsapp = !!body.notifyWhatsapp;
      if (body.notifyEmail !== undefined) update.notifyEmail = !!body.notifyEmail;
      if (body.isGlobal !== undefined) update.isGlobal = !!body.isGlobal;
      if (body.isActive !== undefined) update.isActive = !!body.isActive;
      if (body.subClients !== undefined) update.subClients = body.subClients;

      const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true });
      if (!user) return res.status(404).json({ success: false, message: "Client not found" });

      return res.status(200).json({ success: true, client: toClientShape(user) });
    } catch (err: any) {
      console.log("ADMIN CLIENTS PATCH ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
