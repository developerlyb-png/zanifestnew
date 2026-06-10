import mongoose, { Document, Schema, Model } from "mongoose";

/* -------------------- Feedback Item Interface -------------------- */
export interface IFeedbackItem extends Document {
  name: string;
  post: string;
  desc: string;
  image: string; // base64 string
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------- Feedback Schema -------------------- */
const FeedbackItemSchema: Schema<IFeedbackItem> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    post: { type: String, required: true, trim: true },
    desc: { type: String, required: true, trim: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

/* -------------------- Config Interface -------------------- */
export interface IConfig extends Document {
  key: string;
  value: string;
}

/* -------------------- Config Schema -------------------- */
const ConfigSchema = new Schema<IConfig>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

/* -------------------- Models -------------------- */
export const FeedbackModel: Model<IFeedbackItem> =
  (mongoose.models.FeedbackItem as Model<IFeedbackItem>) ||
  mongoose.model<IFeedbackItem>("FeedbackItem", FeedbackItemSchema);

export const ConfigModel: Model<IConfig> =
  (mongoose.models.Config as Model<IConfig>) ||
  mongoose.model<IConfig>("Config", ConfigSchema);
