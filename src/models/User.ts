import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  userName: string;
  email?: string;
  mobile?: string;
  password?: string;

  isVerified?: boolean;

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


const UserSchema = new Schema<IUser>(
  {
    userName: {
      type: String,
      default: "Customer",
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      unique: true,
      sparse: true,
      default: undefined,
    },

    mobile: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpires: {
      type: Date,
    },

    aadhaarKyc: {
      type: AadhaarSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


export default mongoose.models.User ||
mongoose.model<IUser>("User", UserSchema);