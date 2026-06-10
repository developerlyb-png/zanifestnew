// models/AgentAssignment.ts
import mongoose from "mongoose";

const AgentAssignmentSchema = new mongoose.Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true },
  manager: { type: String, ref: "Manager", required: true },
  salesDuringAssignment: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

export default mongoose.models.AgentAssignment ||
  mongoose.model("AgentAssignment", AgentAssignmentSchema);
