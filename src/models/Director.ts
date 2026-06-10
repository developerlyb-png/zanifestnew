import mongoose, { Schema, Document } from "mongoose";

if (mongoose.models.Director) {
  delete mongoose.models.Director;
}

export interface IDirector extends Document {
  mobileNumber: string;
  companyName: string;
  industryCategory: string;
  subCategory?: string;
  territory: string;
  jurisdiction: string;
  companyTurnover: string;
  limitOfLiability: string;
  whatsappOptIn: boolean;

  email?: string;
  isGuest?: boolean;

  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  assignedAt?: Date | null;
}

const DirectorSchema = new Schema<IDirector>(
  {
    mobileNumber: { type: String, required: true },
    companyName: { type: String, required: true },
    industryCategory: { type: String, required: true },
    subCategory: String,
    territory: { type: String, required: true },
    jurisdiction: { type: String, required: true },
    companyTurnover: { type: String, required: true },
    limitOfLiability: { type: String, required: true },
    whatsappOptIn: { type: Boolean, default: true },

    email: { type: String, default: null },
    isGuest: { type: Boolean, default: true },

    assignedAgentId: { type: String, default: null },
    assignedAgentName: { type: String, default: null },
    assignedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IDirector>("Director", DirectorSchema);
