import mongoose, { Schema, Document, models } from "mongoose";

/* Traveller Interface */
export interface ITraveller {
  travellerId: number;
  age: number;
  hasMedicalCondition: boolean;
}

export interface ITravelInsurance extends Document {
  countries: string[];
  startDate: string;
  endDate: string;
  travellers: number;
  travellersInfo: ITraveller[];
  medicalCondition: "Yes" | "No";
  email: string | null;
  phoneNumber?: string;
  createdAt: Date;

  // ⭐ Assignment fields
  assignedAgent?: string | null;
  assignedTo?: string | null;
  assignedAt?: Date | null;
}

const TravellerSchema = new Schema<ITraveller>(
  {
    travellerId: { type: Number, required: true },
    age: { type: Number, default: null },
    hasMedicalCondition: { type: Boolean, default: false },
  },
  { _id: false }
);

const TravelInsuranceSchema = new Schema<ITravelInsurance>(
  {
    countries: { type: [String], required: true },

    startDate: { type: String, required: true },

    endDate: { type: String, required: true },

    travellers: { type: Number, required: true },

    travellersInfo: { type: [TravellerSchema], required: true },

    medicalCondition: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    email: { type: String, default: null },

    phoneNumber: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },

    /* -------------------------------------------------------------------------- */
    /*                       ⭐ Mandatory Assignment Fields                        */
    /* -------------------------------------------------------------------------- */

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      default: null,
    },

    assignedTo: {
      type: String,
      default: null,
    },

    assignedAt: {
      type: Date,
      default: null,
    },
  },

  { timestamps: true }
);

const TravelInsurance =
  models.TravelInsurance ||
  mongoose.model<ITravelInsurance>("TravelInsurance", TravelInsuranceSchema);

export default TravelInsurance;
 