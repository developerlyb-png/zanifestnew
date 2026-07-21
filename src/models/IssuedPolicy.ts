import mongoose from "mongoose";

const IssuedPolicySchema =
  new mongoose.Schema({

    policyNumber: String,

    quoteNumber: String,

    quoteOptionNumber: String,

    proposalNumber: String,

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    userEmail: String,

    policyType: String,

    insurer: String,

    customer: {

      fullName: String,

      email: String,

      mobile: String,

    },

    vehicle: {

      number: String,

      make: String,

      model: String,

    },

    premium: Number,

    status: String,

    // ADD THESE

    startDate: {

      type: Date,

    },

    endDate: {

      type: Date,

    },

    createdAt: {

      type: Date,

      default: Date.now,

    },

  });

export default

mongoose.models.IssuedPolicy ||

mongoose.model(
  "IssuedPolicy",
  IssuedPolicySchema
);