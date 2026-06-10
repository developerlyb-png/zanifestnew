import mongoose, { Schema, Document } from "mongoose";

export interface IMember {
  name:
    | "Self"
    | "Wife"
    | "Husband"
    | "Son"
    | "Daughter"
    | "Father"
    | "Mother"
    | "Grandfather"
    | "Grandmother"
    | "Father-in-law"
    | "Mother-in-law";
  image?: string;
  age: number;
}

export interface IHealthInsurance extends Document {
  gender: "male" | "female";
  members: IMember[];
  city: string;
  fullName: string;
  mobile: string;
  medicalHistory: string[];
  email: string | null;

  // ⭐ Assignment fields
  assignedAgent: string | null;
  assignedTo: string | null;
  assignedAt: Date | null;

  createdAt: Date;
}

const MemberSchema = new Schema<IMember>({
  name: {
    type: String,
    enum: [
      "Self",
      "Wife",
      "Husband",
      "Son",
      "Daughter",
      "Father",
      "Mother",
      "Grandfather",
      "Grandmother",
      "Father-in-law",
      "Mother-in-law",
    ],
    required: true,
  },
  image: { type: String },
  age: { type: Number, min: 0, max: 120, required: true },
});

const HealthInsuranceSchema = new Schema<IHealthInsurance>(
  {
    gender: { type: String, enum: ["male", "female"], required: true },

    members: {
      type: [MemberSchema],
      required: true,
      validate: {
        validator: (members: IMember[]) =>
          members.filter((m) => m.name === "Son" || m.name === "Daughter").length <= 4,
        message: "You can select up to 4 children.",
      },
    },

    city: { type: String, required: true },
    fullName: { type: String, required: true },
    mobile: { type: String, required: true, match: /^[0-9]{10}$/ },
    medicalHistory: { type: [String], default: [] },

    email: { type: String, default: null },

    // ⭐ MUST BE INSIDE THE SCHEMA LIKE THIS
    assignedAgent: { type: String, default: null },
    assignedTo: { type: String, default: null },
    assignedAt: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.HealthInsurance ||
  mongoose.model<IHealthInsurance>("HealthInsurance", HealthInsuranceSchema);
