import mongoose, { Schema } from "mongoose";

// One row per create/update/delete (and a few invoice-specific actions:
// status change, signed-PDF upload, payment add/remove, email send) across
// the whole Invoice tab — Invoice, InvoiceClient and InvoiceItem. Read-only
// from the UI's point of view; written only via src/lib/invoiceAudit.ts so
// every write point stays consistent.
const InvoiceAuditLogSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: ["Invoice", "InvoiceClient", "InvoiceItem"],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    // Denormalized (invoice no. / client name / item name) so the trail
    // reads clearly even after the underlying record is edited or deleted.
    entityLabel: { type: String, required: true, trim: true },
    action: {
      type: String,
      enum: [
        "created",
        "updated",
        "deleted",
        "status_changed",
        "payment_added",
        "payment_removed",
        "signed_pdf_uploaded",
        "email_sent",
      ],
      required: true,
    },
    summary: { type: String, required: true, trim: true },
    performedBy: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

InvoiceAuditLogSchema.index({ createdAt: -1 });
InvoiceAuditLogSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.models.InvoiceAuditLog ||
  mongoose.model("InvoiceAuditLog", InvoiceAuditLogSchema);
