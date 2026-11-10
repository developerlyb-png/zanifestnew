import mongoose, { Schema } from "mongoose";

const InvoiceItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    hsnSac: { type: String, trim: true },
    unit: { type: String, trim: true, default: "PCS" },
    salesPrice: { type: Number, required: true, default: 0 },
    gstRate: { type: Number, default: 0 },

    trackStock: { type: Boolean, default: false },
    openingStock: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },

    category: { type: String, trim: true },
    createdBy: String,
  },
  { timestamps: true }
);

InvoiceItemSchema.index({ name: 1 });
InvoiceItemSchema.index({ createdAt: -1 });

export default mongoose.models.InvoiceItem || mongoose.model("InvoiceItem", InvoiceItemSchema);
