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
  }

},
{
 timestamps:true
}
);


export default mongoose.models.User ||
mongoose.model<IUser>("User",UserSchema);