import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  userName: string;
  email: string;
  password?: string;

  mobile?: string;   // ✅ ADD THIS

  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  aadhaarKyc?: {
    aadhaarLast4: string;
    name: string;
    dob: string;
    verified: boolean;
    verifiedAt: Date;
  };

  // Fields for admin-managed insured/client directory (manual policy entry)
  address?: string;
  kycDocumentType?: string;
  kycFiles?: { data: string; fileName: string }[];
  notifyWhatsapp?: boolean;
  notifyEmail?: boolean;
  isGlobal?: boolean;
  subClients?: { name: string; phone: string; email: string }[];
  source?: string;
}


const AadhaarSchema = new Schema(
  {
    aadhaarLast4: String,
    name: String,
    dob: String,
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
  },
  {
    _id:false
  }
);

const SubClientSchema = new Schema(
  {
    name: String,
    phone: String,
    email: String,
  },
  { _id: true }
);



const UserSchema = new Schema<IUser>(
{

  userName:{
    type:String,
    required:true,
    trim:true
  },


  email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true
  },


  // password optional because health OTP user has no password

  password:{
    type:String,
    required:false
  },


  // HEALTH LOGIN MOBILE

  mobile:{
    type:String,
    unique:true,
    sparse:true
  },


  resetPasswordToken:{
    type:String
  },


  resetPasswordExpires:{
    type:Date
  },


  aadhaarKyc:{
    type:AadhaarSchema,
    default:null
  },

  address: String,
  kycDocumentType: String,
  kycFiles: [
    {
      data: String,
      fileName: String,
    },
  ],
  notifyWhatsapp: { type: Boolean, default: false },
  notifyEmail: { type: Boolean, default: false },
  isGlobal: { type: Boolean, default: false },
  subClients: [SubClientSchema],
  source: { type: String, default: "online" },

},
{
 timestamps:true
}
);


export default mongoose.models.User ||
mongoose.model<IUser>("User",UserSchema);