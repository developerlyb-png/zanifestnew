import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import Invoice from "@/models/Invoice";
import SellerProfile from "@/models/SellerProfile";
import InvoiceClient from "@/models/InvoiceClient";
import { INVOICE_STATUSES } from "@/constants/invoice";
import { logInvoiceAudit, diffSummary } from "@/lib/invoiceAudit";
import { friendlyMessage, errorStatus } from "@/utils/friendlyError";

export const config = {
  api: {
    bodyParser: {
      // Covers the signed-PDF upload (base64) on top of the usual invoice body.
      sizeLimit: "12mb",
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

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Computes each line's amount and the subtotal/tax/grand total the same way
// on every save, so the stored totals always match the line items.
function computeTotals(lineItems: any[], taxMode: string, taxRatePercent: number) {
  const items = (lineItems || []).map((it: any) => {
    const qty = num(it.qty);
    const rate = num(it.rate);
    const gross = qty * rate;
    const discount =
      it.discountType === "%" ? (gross * num(it.discountValue)) / 100 : num(it.discountValue);
    const amount = Math.max(0, gross - discount);
    return {
      itemId: it.itemId || undefined,
      description: String(it.description || "").trim(),
      hsnSac: String(it.hsnSac || "").trim(),
      qty,
      rate,
      discountType: it.discountType === "%" ? "%" : "₹",
      discountValue: num(it.discountValue),
      amount: Math.round(amount * 100) / 100,
    };
  });

  const subtotal = Math.round(items.reduce((s, it) => s + it.amount, 0) * 100) / 100;
  const rate = num(taxRatePercent);

  const taxBreakup =
    taxMode === "INTRA"
      ? [
          { type: "CGST", ratePercent: rate / 2, amount: Math.round(((subtotal * rate) / 2 / 100) * 100) / 100 },
          { type: "SGST", ratePercent: rate / 2, amount: Math.round(((subtotal * rate) / 2 / 100) * 100) / 100 },
        ]
      : [{ type: "IGST", ratePercent: rate, amount: Math.round(((subtotal * rate) / 100) * 100) / 100 }];

  const totalTax = Math.round(taxBreakup.reduce((s, t) => s + t.amount, 0) * 100) / 100;
  const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

  return { items, subtotal, taxBreakup, totalTax, grandTotal };
}

function sellerSnapshot(sellerProfile: any) {
  return {
    profileId: sellerProfile._id,
    companyName: sellerProfile.companyName,
    contactPerson: sellerProfile.contactPerson,
    email: sellerProfile.email,
    phone: sellerProfile.phone,
    gstin: sellerProfile.gstin,
    pan: sellerProfile.pan,
    registeredAddress: sellerProfile.registeredAddress,
    corporateAddress: sellerProfile.corporateAddress,
    useRegisteredAsCorporate: sellerProfile.useRegisteredAsCorporate,
    bank: sellerProfile.bank,
    showBankDetailsOnInvoice: sellerProfile.showBankDetailsOnInvoice,
    companyLogo: sellerProfile.companyLogo,
    signatureImage: sellerProfile.signatureImage,
    principalOfficerName: sellerProfile.principalOfficerName,
    principalOfficerStamp: sellerProfile.principalOfficerStamp,
    principalOfficerSignature: sellerProfile.principalOfficerSignature,
  };
}

function clientSnapshot(client: any) {
  return {
    clientId: client._id,
    name: client.name,
    contactPerson: client.contactPerson,
    email: client.email,
    phone: client.phone,
    gstin: client.gstin,
    pan: client.pan,
    addressLine1: client.addressLine1,
    addressLine2: client.addressLine2,
    pincode: client.pincode,
    city: client.city,
    state: client.state,
  };
}

function validate(b: any): string | null {
  if (!b.sellerProfileId) return "Seller profile is required";
  if (!b.clientId) return "Client is required";
  if (!b.invoiceDate) return "Invoice date is required";
  if (!String(b.placeOfSupply || "").trim()) return "Place of supply is required";
  if (!["INTRA", "INTER"].includes(b.taxMode)) return "Tax mode is required";
  if (!Array.isArray(b.lineItems) || b.lineItems.length === 0) return "Add at least one line item";
  const badItem = b.lineItems.find((it: any) => !String(it.description || "").trim() || num(it.qty) <= 0);
  if (badItem) return "Every line item needs a description and a quantity greater than 0";
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin: any = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();
  const adminName = `${admin.userFirstName ?? ""} ${admin.userLastName ?? ""}`.trim() || admin.email;

  if (req.method === "GET") {
    try {
      const { id, from, to } = req.query;
      if (id) {
        const invoice = await Invoice.findById(String(id)).lean();
        if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
        return res.status(200).json({ success: true, invoice });
      }

      const query: any = {};
      if (from || to) {
        query.invoiceDate = {};
        if (from) query.invoiceDate.$gte = new Date(String(from));
        if (to) query.invoiceDate.$lte = new Date(String(to));
      }
      const invoices = await Invoice.find(query, {
        lineItems: 0,
        "seller.companyLogo": 0,
        "seller.signatureImage": 0,
        "seller.principalOfficerStamp": 0,
        "seller.principalOfficerSignature": 0,
        signedPdf: 0,
      })
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, invoices });
    } catch (err: any) {
      console.log("INVOICES GET ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "POST") {
    try {
      const b = req.body || {};
      const invalid = validate(b);
      if (invalid) return res.status(400).json({ success: false, message: invalid });

      const sellerProfile: any = await SellerProfile.findById(b.sellerProfileId);
      if (!sellerProfile) return res.status(400).json({ success: false, message: "Seller profile not found" });

      const client: any = await InvoiceClient.findById(b.clientId);
      if (!client) return res.status(400).json({ success: false, message: "Client not found" });

      // Atomic increment — two invoices created at the same moment still get
      // two different sequence numbers.
      const updatedProfile: any = await SellerProfile.findByIdAndUpdate(
        sellerProfile._id,
        { $inc: { lastSequenceUsed: 1 } },
        { new: true }
      );
      const seq = updatedProfile.lastSequenceUsed;
      const invoiceNo = `${sellerProfile.invoiceSeries}${String(seq).padStart(3, "0")}`;

      const { items, subtotal, taxBreakup, totalTax, grandTotal } = computeTotals(
        b.lineItems,
        b.taxMode,
        b.taxRatePercent
      );

      const invoice = await Invoice.create({
        invoiceNo,
        seller: sellerSnapshot(sellerProfile),
        client: clientSnapshot(client),
        invoiceDate: b.invoiceDate,
        dueDate: b.dueDate || undefined,
        placeOfSupply: String(b.placeOfSupply).trim(),
        taxMode: b.taxMode,
        reverseCharge: !!b.reverseCharge,
        status: INVOICE_STATUSES.includes(b.status) ? b.status : "Draft",
        lineItems: items,
        taxRatePercent: num(b.taxRatePercent),
        taxBreakup,
        subtotal,
        totalTax,
        grandTotal,
        amountReceived: 0,
        balanceDue: grandTotal,
        createdBy: adminName,
      });

      await logInvoiceAudit({
        entityType: "Invoice",
        entityId: invoice._id,
        entityLabel: invoice.invoiceNo,
        action: "created",
        summary: `Created invoice ${invoice.invoiceNo} for ${client.name} (₹${grandTotal.toLocaleString("en-IN")})`,
        performedBy: adminName,
      });

      return res.status(201).json({ success: true, invoice });
    } catch (err: any) {
      console.log("INVOICES POST ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "PUT") {
    try {
      const b = req.body || {};
      const { id } = b;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const invalid = validate(b);
      if (invalid) return res.status(400).json({ success: false, message: invalid });

      const existing = await Invoice.findById(id);
      if (!existing) return res.status(404).json({ success: false, message: "Invoice not found" });

      const sellerProfile: any = await SellerProfile.findById(b.sellerProfileId);
      if (!sellerProfile) return res.status(400).json({ success: false, message: "Seller profile not found" });

      const client: any = await InvoiceClient.findById(b.clientId);
      if (!client) return res.status(400).json({ success: false, message: "Client not found" });

      const { items, subtotal, taxBreakup, totalTax, grandTotal } = computeTotals(
        b.lineItems,
        b.taxMode,
        b.taxRatePercent
      );

      const before = {
        clientName: existing.client?.name,
        status: existing.status,
        taxMode: existing.taxMode,
        grandTotal: existing.grandTotal,
        lineItemCount: (existing.lineItems || []).length,
      };

      existing.seller = sellerSnapshot(sellerProfile) as any;
      existing.client = clientSnapshot(client) as any;
      existing.invoiceDate = b.invoiceDate;
      existing.dueDate = b.dueDate || undefined;
      existing.placeOfSupply = String(b.placeOfSupply).trim();
      existing.taxMode = b.taxMode;
      existing.reverseCharge = !!b.reverseCharge;
      existing.status = INVOICE_STATUSES.includes(b.status) ? b.status : existing.status;
      existing.lineItems = items as any;
      existing.taxRatePercent = num(b.taxRatePercent);
      existing.taxBreakup = taxBreakup as any;
      existing.subtotal = subtotal;
      existing.totalTax = totalTax;
      existing.grandTotal = grandTotal;
      // Line items (and so grandTotal) can change on edit; payments already
      // recorded are untouched, so balanceDue is simply re-derived from them.
      existing.balanceDue = Math.round((grandTotal - (existing.amountReceived || 0)) * 100) / 100;
      existing.updatedBy = adminName;

      await existing.save();

      const changeSummary = diffSummary(
        before,
        {
          clientName: client.name,
          status: existing.status,
          taxMode: existing.taxMode,
          grandTotal: existing.grandTotal,
          lineItemCount: items.length,
        },
        [
          { key: "clientName", label: "Bill To" },
          { key: "status", label: "Status" },
          { key: "taxMode", label: "Tax Mode" },
          { key: "grandTotal", label: "Grand Total" },
          { key: "lineItemCount", label: "Line Items" },
        ]
      );
      await logInvoiceAudit({
        entityType: "Invoice",
        entityId: existing._id,
        entityLabel: existing.invoiceNo,
        action: "updated",
        summary: changeSummary
          ? `Updated invoice ${existing.invoiceNo}: ${changeSummary}`
          : `Updated invoice ${existing.invoiceNo}`,
        performedBy: adminName,
      });

      return res.status(200).json({ success: true, invoice: existing });
    } catch (err: any) {
      console.log("INVOICES PUT ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id, status, signedPdf, addPayment, removePaymentId } = req.body || {};
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      // Payments mutate an array and a denormalized running total together,
      // so they go through load-modify-save rather than a single $set.
      if (addPayment || removePaymentId) {
        const invoiceDoc: any = await Invoice.findById(id);
        if (!invoiceDoc) return res.status(404).json({ success: false, message: "Invoice not found" });

        let paymentAuditAmount = 0;
        if (addPayment) {
          const amount = num(addPayment.amount);
          if (amount <= 0) return res.status(400).json({ success: false, message: "Payment amount must be greater than 0" });
          paymentAuditAmount = amount;
          invoiceDoc.payments.push({
            date: addPayment.date ? new Date(addPayment.date) : new Date(),
            amount,
            mode: addPayment.mode || "Bank Transfer",
            note: addPayment.note || "",
            recordedBy: adminName,
          });
        }
        if (removePaymentId) {
          const removed = invoiceDoc.payments.find((p: any) => String(p._id) === String(removePaymentId));
          paymentAuditAmount = num(removed?.amount);
          invoiceDoc.payments = invoiceDoc.payments.filter((p: any) => String(p._id) !== String(removePaymentId));
        }

        invoiceDoc.amountReceived =
          Math.round(invoiceDoc.payments.reduce((s: number, p: any) => s + num(p.amount), 0) * 100) / 100;
        invoiceDoc.balanceDue = Math.round((invoiceDoc.grandTotal - invoiceDoc.amountReceived) * 100) / 100;
        invoiceDoc.updatedBy = adminName;

        await invoiceDoc.save();

        await logInvoiceAudit({
          entityType: "Invoice",
          entityId: invoiceDoc._id,
          entityLabel: invoiceDoc.invoiceNo,
          action: addPayment ? "payment_added" : "payment_removed",
          summary: addPayment
            ? `Recorded a payment of ₹${paymentAuditAmount.toLocaleString("en-IN")} (${addPayment.mode || "Bank Transfer"}) on invoice ${invoiceDoc.invoiceNo}`
            : `Removed a payment of ₹${paymentAuditAmount.toLocaleString("en-IN")} from invoice ${invoiceDoc.invoiceNo}`,
          performedBy: adminName,
        });

        return res.status(200).json({ success: true, invoice: invoiceDoc });
      }

      const current = await Invoice.findById(id).select("invoiceNo status").lean();
      if (!current) return res.status(404).json({ success: false, message: "Invoice not found" });

      const update: any = { updatedBy: adminName };
      if (status) {
        if (!INVOICE_STATUSES.includes(status)) {
          return res.status(400).json({ success: false, message: "Invalid status" });
        }
        update.status = status;
      }
      if (signedPdf?.data) {
        update.signedPdf = { data: signedPdf.data, fileName: signedPdf.fileName || "signed-invoice.pdf" };
        if (!status) update.status = "Signed";
      }

      const invoice: any = await Invoice.findByIdAndUpdate(id, update, { new: true }).lean();
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

      if (status && status !== (current as any).status) {
        await logInvoiceAudit({
          entityType: "Invoice",
          entityId: invoice._id,
          entityLabel: invoice.invoiceNo,
          action: "status_changed",
          summary: `Status changed from ${(current as any).status} to ${status} on invoice ${invoice.invoiceNo}`,
          performedBy: adminName,
        });
      }
      if (signedPdf?.data) {
        await logInvoiceAudit({
          entityType: "Invoice",
          entityId: invoice._id,
          entityLabel: invoice.invoiceNo,
          action: "signed_pdf_uploaded",
          summary: `Uploaded signed PDF "${signedPdf.fileName || "signed-invoice.pdf"}" for invoice ${invoice.invoiceNo}`,
          performedBy: adminName,
        });
      }

      return res.status(200).json({ success: true, invoice });
    } catch (err: any) {
      console.log("INVOICES PATCH ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      const invoice: any = await Invoice.findByIdAndDelete(id);
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

      await logInvoiceAudit({
        entityType: "Invoice",
        entityId: invoice._id,
        entityLabel: invoice.invoiceNo,
        action: "deleted",
        summary: `Deleted invoice ${invoice.invoiceNo} (₹${(invoice.grandTotal || 0).toLocaleString("en-IN")})`,
        performedBy: adminName,
      });

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("INVOICES DELETE ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
