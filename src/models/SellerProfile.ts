import mongoose, { Schema } from "mongoose";

const AddressSchema = new Schema(
  {
    line1: String,
    line2: String,
    pincode: String,
    city: String,
    state: String,
  },
  { _id: false }
);

const FileSchema = new Schema(
  {
    data: String,
    fileName: String,
  },
  { _id: false }
);

// A "seller profile" is the broker's own letterhead/invoicing identity —
// company + tax details, bank account, logo/signatures — used when
// generating invoices. A broker usually has one, but can keep several
// (e.g. per entity) and mark one as the default used unless overridden.
const SellerProfileSchema = new Schema(
  {
    companyName: { type: String, required: true, trim: true },
    irdaLicenseNo: { type: String, trim: true },
    licenseExpiryDate: Date,
    pan: { type: String, required: true, trim: true, uppercase: true },
    gstin: { type: String, required: true, trim: true, uppercase: true },
    cin: { type: String, trim: true, uppercase: true },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    website: { type: String, required: true, trim: true },

    registeredAddress: { type: AddressSchema, required: true },

    // When true, corporateAddress is ignored and the registered address is
    // used everywhere a corporate address is needed.
    useRegisteredAsCorporate: { type: Boolean, default: true },
    corporateAddress: AddressSchema,

    coinSection: { type: String, required: true, default: "Coin" },
    coinValueInr: { type: Number, required: true },

    invoiceSeries: { type: String, required: true, trim: true },
    lastSequenceUsed: { type: Number, default: 0 },

    bank: {
      accountName: { type: String, required: true, trim: true },
      accountNumber: { type: String, required: true, trim: true },
      ifscCode: { type: String, required: true, trim: true, uppercase: true },
      bankName: { type: String, required: true, trim: true },
      branch: { type: String, required: true, trim: true },
    },
    showBankDetailsOnInvoice: { type: Boolean, default: true },

    companyLogo: { type: FileSchema, required: true },
    signatureImage: { type: FileSchema, required: true },

    principalOfficerName: { type: String, required: true, trim: true },
    principalOfficerStamp: { type: FileSchema, required: true },
    principalOfficerSignature: { type: FileSchema, required: true },

    isDefault: { type: Boolean, default: false },
    createdBy: String,
    updatedBy: String,
  },
  { timestamps: true }
);

export default mongoose.models.SellerProfile || mongoose.model("SellerProfile", SellerProfileSchema);
