import mongoose, { Schema } from "mongoose";

const InvoiceClientSchema = new Schema(
  {
    name: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },

    gstin: { type: String, trim: true, uppercase: true },
    pan: { type: String, trim: true, uppercase: true },

    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    pincode: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },

    createdBy: String,
  },
  { timestamps: true }
);

InvoiceClientSchema.index({ createdAt: -1 });

export default mongoose.models.InvoiceClient || mongoose.model("InvoiceClient", InvoiceClientSchema);
