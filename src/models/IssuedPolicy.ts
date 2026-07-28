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

    grossPremium: Number,

    status: String,

    subInsured: String,

    endorsementNo: {
      type: String,
      default: "-",
    },

    transactionType: String,

    pospPartner: {
      type: String,
      default: "Direct Business",
    },

    commissionAmount: {
      type: Number,
      default: null,
    },

    payoutAmount: {
      type: Number,
      default: null,
    },

    payoutStatus: {
      type: String,
      default: "PENDING",
    },

    policyDocumentStatus: {
      type: String,
      default: "Pending",
    },

    policyRemark: {
      type: String,
      default: "",
    },

    reconcile: {
      type: String,
      default: "No",
    },

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