import { Schema, models, model, Document } from "mongoose";

export const MAX_OTP_ATTEMPTS = 5;

export type PasswordResetUserType = "admin" | "agent";

export interface IPasswordReset extends Document {
  email: string;
  userType: PasswordResetUserType;
  otpHash: string;
  expire: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    userType: {
      type: String,
      enum: ["admin", "agent"],
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expire: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One active OTP per account type + email
PasswordResetSchema.index({ email: 1, userType: 1 }, { unique: true });

// MongoDB removes the document automatically once it expires
PasswordResetSchema.index({ expire: 1 }, { expireAfterSeconds: 0 });

const PasswordReset =
  models.PasswordReset || model<IPasswordReset>("PasswordReset", PasswordResetSchema);

export default PasswordReset;
