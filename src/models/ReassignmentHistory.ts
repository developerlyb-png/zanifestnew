import mongoose from "mongoose";

const reassignmentHistorySchema = new mongoose.Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true },
  fromManager: { type: String, ref: "Manager" },
  salesUnderPrevDM : {type: Number, default: 0},
  toManager: { type: String, ref: "Manager", required: true },
  reassignedAt: { type: Date, default: Date.now },
});

export default mongoose.models.ReassignmentHistory ||
  mongoose.model("ReassignmentHistory", reassignmentHistorySchema);

  // A1 - DM1 (100) 
  // A1 - DM2 (300) 

  // A1 lifetime = 400