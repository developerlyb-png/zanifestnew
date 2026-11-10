import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import InvoiceItem from "@/models/InvoiceItem";

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

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin: any = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const { id, q } = req.query;
      if (id) {
        const item = await InvoiceItem.findById(String(id)).lean();
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });
        return res.status(200).json({ success: true, item });
      }

      const query: any = {};
      if (q) {
        const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [{ name: rx }, { hsnSac: rx }, { category: rx }];
      }

      const items = await InvoiceItem.find(query)
        .sort({ name: 1 })
        .limit(q ? 20 : 0)
        .lean();
      return res.status(200).json({ success: true, items });
    } catch (err: any) {
      console.log("INVOICE ITEMS GET ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const b = req.body || {};
      if (!String(b.name || "").trim()) {
        return res.status(400).json({ success: false, message: "Item name is required" });
      }

      const adminName = `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email;
      const trackStock = !!b.trackStock;
      const openingStock = num(b.openingStock);

      const item = await InvoiceItem.create({
        name: String(b.name).trim(),
        hsnSac: String(b.hsnSac || "").trim(),
        unit: String(b.unit || "PCS").trim(),
        salesPrice: num(b.salesPrice),
        gstRate: num(b.gstRate),
        trackStock,
        openingStock,
        currentStock: trackStock ? openingStock : 0,
        category: String(b.category || "").trim(),
        createdBy: adminName,
      });

      return res.status(201).json({ success: true, item });
    } catch (err: any) {
      console.log("INVOICE ITEMS POST ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const b = req.body || {};
      const { id } = b;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      if (!String(b.name || "").trim()) {
        return res.status(400).json({ success: false, message: "Item name is required" });
      }

      const existing = await InvoiceItem.findById(id);
      if (!existing) return res.status(404).json({ success: false, message: "Item not found" });

      const trackStock = !!b.trackStock;
      const openingStock = num(b.openingStock);
      // Preserve how much stock has moved since the item was created: shifting
      // the opening figure shifts current stock by the same delta rather than
      // overwriting it outright (which would silently undo any sales already
      // recorded against this item).
      const openingDelta = openingStock - num(existing.openingStock);

      existing.name = String(b.name).trim();
      existing.hsnSac = String(b.hsnSac || "").trim();
      existing.unit = String(b.unit || "PCS").trim();
      existing.salesPrice = num(b.salesPrice);
      existing.gstRate = num(b.gstRate);
      existing.category = String(b.category || "").trim();
      existing.trackStock = trackStock;
      existing.openingStock = openingStock;
      existing.currentStock = trackStock ? num(existing.currentStock) + openingDelta : 0;

      await existing.save();
      return res.status(200).json({ success: true, item: existing });
    } catch (err: any) {
      console.log("INVOICE ITEMS PUT ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      const item = await InvoiceItem.findByIdAndDelete(id);
      if (!item) return res.status(404).json({ success: false, message: "Item not found" });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("INVOICE ITEMS DELETE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
