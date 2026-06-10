import mongoose, { Schema, Document } from "mongoose";

export interface ITrainingProgress extends Document {
  agentId: mongoose.Types.ObjectId;
  currentVideo: number;
  videoTime: number; // seconds
  completedVideos: number[];
  testStarted: boolean;
  testCompleted: boolean;
}

const TrainingProgressSchema = new Schema<ITrainingProgress>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", unique: true },
    currentVideo: { type: Number, default: 1 },
    videoTime: { type: Number, default: 0 },
    completedVideos: { type: [Number], default: [] },
    testStarted: { type: Boolean, default: false },
    testCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.TrainingProgress ||
  mongoose.model<ITrainingProgress>(
    "TrainingProgress",
    TrainingProgressSchema
  );
