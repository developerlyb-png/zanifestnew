// models/Image.ts
import mongoose, { Schema, Document } from "mongoose";

export interface Image extends Document {
  title: string;
  imageUrl: string; // will store base64 / cloudinary url / s3 url
  createdAt: Date;
}

const ImageSchema: Schema<Image> = new Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Image ||
  mongoose.model<Image>("Image", ImageSchema);
