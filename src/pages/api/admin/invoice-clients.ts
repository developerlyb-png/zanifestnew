import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import InvoiceClient from "@/models/InvoiceClient";
import { logInvoiceAudit, diffSummary } from "@/lib/invoiceAudit";
import { friendlyMessage, errorStatus } from "@/utils/friendlyError";

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

// Falls back to a placeholder only for display (audit log entityLabel, the
// row's name link) when the client has no name — every field on this form
// is optional, so a blank name is valid and shouldn't crash either of those.
const displayName = (name?: string) => (name && name.trim()) || "(unnamed client)";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin: any = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();
  const adminName = `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email;

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
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "POST") {
    try {
      const b = req.body || {};

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

      await logInvoiceAudit({
        entityType: "InvoiceClient",
        entityId: client._id,
        entityLabel: displayName(client.name),
        action: "created",
        summary: `Created client "${displayName(client.name)}"`,
        performedBy: adminName,
      });

      return res.status(201).json({ success: true, client });
    } catch (err: any) {
      console.log("INVOICE CLIENTS POST ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "PUT") {
    try {
      const b = req.body || {};
      const { id } = b;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const before = await InvoiceClient.findById(id).lean();
      if (!before) return res.status(404).json({ success: false, message: "Client not found" });

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

      const changeSummary = diffSummary((before as any), (client as any).toObject(), [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "gstin", label: "GSTIN" },
        { key: "addressLine1", label: "Address" },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
      ]);
      await logInvoiceAudit({
        entityType: "InvoiceClient",
        entityId: client._id,
        entityLabel: displayName(client.name),
        action: "updated",
        summary: changeSummary
          ? `Updated client "${displayName(client.name)}": ${changeSummary}`
          : `Updated client "${displayName(client.name)}"`,
        performedBy: adminName,
      });

      return res.status(200).json({ success: true, client });
    } catch (err: any) {
      console.log("INVOICE CLIENTS PUT ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      const client = await InvoiceClient.findByIdAndDelete(id);
      if (!client) return res.status(404).json({ success: false, message: "Client not found" });

      await logInvoiceAudit({
        entityType: "InvoiceClient",
        entityId: client._id,
        entityLabel: displayName(client.name),
        action: "deleted",
        summary: `Deleted client "${displayName(client.name)}"`,
        performedBy: adminName,
      });

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("INVOICE CLIENTS DELETE ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
