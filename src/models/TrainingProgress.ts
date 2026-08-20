import mongoose, { Schema, Document } from "mongoose";

export interface IModuleProgress {
  secondsSpent: number;
  completed: boolean;
  completedAt: Date | null;
}

export interface ITrainingProgress extends Document {
  agentId: mongoose.Types.ObjectId;
  currentVideo: number;
  videoTime: number; // seconds
  completedVideos: number[];
  testStarted: boolean;
  testCompleted: boolean;

  // Module-based training (3 modules, 5 hours / 18000s each).
  modules: IModuleProgress[];
  currentModule: number;
}

const ModuleProgressSchema = new Schema<IModuleProgress>(
  {
    secondsSpent: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const TrainingProgressSchema = new Schema<ITrainingProgress>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", unique: true },
    currentVideo: { type: Number, default: 1 },
    videoTime: { type: Number, default: 0 },
    completedVideos: { type: [Number], default: [] },
    testStarted: { type: Boolean, default: false },
    testCompleted: { type: Boolean, default: false },

    modules: {
      type: [ModuleProgressSchema],
      default: () => [
        { secondsSpent: 0, completed: false, completedAt: null },
        { secondsSpent: 0, completed: false, completedAt: null },
        { secondsSpent: 0, completed: false, completedAt: null },
      ],
    },
    currentModule: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.TrainingProgress ||
  mongoose.model<ITrainingProgress>(
    "TrainingProgress",
    TrainingProgressSchema
  );
