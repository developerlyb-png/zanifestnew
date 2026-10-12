import mongoose, { Schema } from "mongoose";
import { INVOICE_STATUSES, DEFAULT_INVOICE_STATUS } from "@/constants/invoice";

// Snapshots of the seller and client are stored on the invoice itself (not
// just referenced) so a later edit to the seller profile or client record
// never changes an invoice that's already been issued.
const AddressSchema = new Schema(
  { line1: String, line2: String, pincode: String, city: String, state: String },
  { _id: false }
);

const SellerSnapshotSchema = new Schema(
  {
    profileId: { type: Schema.Types.ObjectId, ref: "SellerProfile" },
    companyName: String,
    contactPerson: String,
    email: String,
    phone: String,
    gstin: String,
    pan: String,
    registeredAddress: AddressSchema,
    corporateAddress: AddressSchema,
    useRegisteredAsCorporate: Boolean,
    bank: {
      accountName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branch: String,
    },
    showBankDetailsOnInvoice: Boolean,
    companyLogo: { data: String, fileName: String },
    signatureImage: { data: String, fileName: String },
    principalOfficerName: String,
    principalOfficerSignature: { data: String, fileName: String },
  },
  { _id: false }
);

const ClientSnapshotSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "InvoiceClient" },
    name: String,
    contactPerson: String,
    email: String,
    phone: String,
    gstin: String,
    pan: String,
    addressLine1: String,
    addressLine2: String,
    pincode: String,
    city: String,
    state: String,
  },
  { _id: false }
);

const LineItemSchema = new Schema(
  {
    description: String,
    hsnSac: String,
    qty: Number,
    rate: Number,
    discountType: { type: String, enum: ["₹", "%"], default: "₹" },
    discountValue: { type: Number, default: 0 },
    amount: Number,
  },
  { _id: false }
);

const TaxRowSchema = new Schema(
  { type: String, ratePercent: Number, amount: Number },
  { _id: false }
);

const InvoiceSchema = new Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, trim: true },

    seller: { type: SellerSnapshotSchema, required: true },
    client: { type: ClientSnapshotSchema, required: true },

    invoiceDate: { type: Date, required: true },
    dueDate: Date,
    placeOfSupply: { type: String, required: true },
    taxMode: { type: String, enum: ["INTRA", "INTER"], required: true },
    reverseCharge: { type: Boolean, default: false },
    status: { type: String, enum: INVOICE_STATUSES, default: DEFAULT_INVOICE_STATUS },

    lineItems: [LineItemSchema],

    taxRatePercent: { type: Number, default: 18 },
    taxBreakup: [TaxRowSchema],

    subtotal: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    signedPdf: { data: String, fileName: String },

    createdBy: String,
    updatedBy: String,
  },
  { timestamps: true }
);

InvoiceSchema.index({ invoiceDate: -1 });

if (process.env.NODE_ENV !== "production") delete mongoose.models.Invoice;

export default mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
