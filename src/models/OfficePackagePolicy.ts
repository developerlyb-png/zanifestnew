import mongoose, { Schema, Document } from "mongoose";

export interface IOfficePackagePolicy extends Document {
  companyName: string;
  email: string | null;
  mobile: string;
  pincode?: string;
  firstTimeBuying?: string;
  lossHistory?: string;

  assignedAgent?: string | null;
  assignedTo?: string | null;
  assignedAt?: Date | null;

  createdAt: Date;
}

const OfficeSchema = new Schema<IOfficePackagePolicy>(
  {
    companyName: { type: String, required: true },
    email: { type: String, default: null },
    mobile: { type: String, required: true },
    pincode: { type: String },
    firstTimeBuying: { type: String, default: null },
    lossHistory: { type: String, default: null },

    // ⭐ NEW FIELDS (same as Travel, Shop, Home, Doctor)
    assignedAgent: { type: String, default: null },
    assignedTo: { type: String, default: null },
    assignedAt: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.OfficePackagePolicy ||
  mongoose.model<IOfficePackagePolicy>("OfficePackagePolicy", OfficeSchema);
