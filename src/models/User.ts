import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  userName: string;
  email: string;
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  aadhaarKyc?: {
    aadhaarLast4: string;
    name: string;
    dob: string;
    verified: boolean;
    verifiedAt: Date;
  };
}

const AadhaarSchema = new Schema(
  {
    aadhaarLast4: String,
    name: String,
    dob: String,
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>({
  userName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  aadhaarKyc: { type: AadhaarSchema, default: null },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
