import mongoose, { Schema } from "mongoose";

const InvoiceClientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },

    gstin: { type: String, required: true, trim: true, uppercase: true },
    pan: { type: String, required: true, trim: true, uppercase: true },

    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    pincode: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },

    createdBy: String,
  },
  { timestamps: true }
);

InvoiceClientSchema.index({ createdAt: -1 });

export default mongoose.models.InvoiceClient || mongoose.model("InvoiceClient", InvoiceClientSchema);
