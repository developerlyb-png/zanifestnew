import mongoose, { Schema, Document } from "mongoose";

export interface IDoctorInsurance extends Document {
  name: string;
  email: string | null;
  mobile: string;
  whatsapp: boolean;
  specialization?: string;
  firstTime?: string | null;
  facility?: string | null;
  createdAt: Date;

  assignedAgent?: string | null;
  assignedTo?: string | null;
  assignedAt?: Date | null;
}

const DoctorSchema = new Schema<IDoctorInsurance>(
  {
    name: { type: String, required: true },
    email: { type: String, default: null },
    mobile: { type: String, required: true },
    whatsapp: { type: Boolean, default: false },
    specialization: { type: String, default: null },
    firstTime: { type: String, default: null },
    facility: { type: String, default: null },

    assignedAgent: { type: String, default: null },
    assignedTo: { type: String, default: null },
    assignedAt: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.DoctorInsurance ||
  mongoose.model<IDoctorInsurance>("DoctorInsurance", DoctorSchema);
