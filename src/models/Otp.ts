import mongoose from "mongoose";


const OtpSchema = new mongoose.Schema(
{

 mobile:{
  type:String,
  required:true
 },

 email:{
  type:String
 },

 otp:{
  type:String,
  required:true
 },

 expire:{
  type:Date,
  required:true
 }

},
{
 timestamps:true
}
);


export default mongoose.models.Otp ||
mongoose.model(
"Otp",
OtpSchema
);