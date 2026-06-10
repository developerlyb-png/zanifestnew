import mongoose from "mongoose";

const IssuedPolicySchema =
  new mongoose.Schema({

    policyNumber: String,

    quoteNumber: String,

    quoteOptionNumber: String,

    proposalNumber: String,

    customer: {

      fullName: String,

    },

    vehicle: {

      number: String,

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