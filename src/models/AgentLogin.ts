import mongoose, { Schema, Document } from "mongoose";

export interface IAgentLogin extends Document {
  name: string;
  email: string;
  password: string;
  loginId: string;

  accountStatus: "INCOMPLETE" | "COMPLETED";

  createdAt: Date;
  updatedAt: Date;
}

const AgentLoginSchema = new Schema<IAgentLogin>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    loginId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    accountStatus: {
      type: String,
      enum: ["INCOMPLETE", "COMPLETED"],
      default: "INCOMPLETE",
    },
  },
  {
    timestamps: true, // ✅ createdAt, updatedAt automatically
  }
);

delete mongoose.models.AgentLogin;
export default mongoose.model<IAgentLogin>(
  "AgentLogin",
  AgentLoginSchema
);
