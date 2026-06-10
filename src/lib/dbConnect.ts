import mongoose from "mongoose";

const MONGODB_URI ="mongodb+srv://zanifest:admin12345@cluster0.xncvdh7.mongodb.net/?appName=Cluster0";
;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables.");
}

const dbConnect = async () => {
  console.log("connecting to db");
  if (mongoose.connections[0].readyState) return;

  await mongoose.connect(MONGODB_URI);
};

export default dbConnect;