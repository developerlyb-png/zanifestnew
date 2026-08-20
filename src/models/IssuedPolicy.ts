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

      address: String,

      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      subClientName: String,

    },

    vehicle: {

      number: String,

      make: String,

      model: String,

      vehicleType: String,

      fuelType: String,

      modelYear: String,

      itemsCovered: String,

      ncbApplicable: String,

      caseType: String,

    },

    businessSegment: String,

    lineOfBusiness: String,

    product: String,

    paymentReceivedDate: Date,

    paymentMode: String,

    policyTypeStructure: String,

    mediumOfIssuance: String,

    assignment: {

      branchName: String,

      reportingManager: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Manager",
        },
        name: String,
      },

      agentType: String,

      posAgentInList: String,

      pospPartner: String,

      pospAgent: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Agent",
        },
        name: String,
      },

      // Some high-value cases are sourced/issued via a POSP but legally
      // cannot be booked under the POSP's own code (ticket-size limits) —
      // this flag captures that distinction independent of agentType.
      caseBookedUnderPosp: String,

    },

    premiumBreakdown: [
      {
        label: String,
        sumInsured: Number,
        premiumAmount: Number,
        commissionPercent: Number,
        commissionAmount: Number,
      },
    ],

    rewardAmount: Number,

    gstAmount: Number,

    taxRate: Number,

    paymentDetails: {

      mode: String,

      transactionId: String,

      transactionDate: Date,

      transactionAmount: Number,

      transactionProof: {
        data: String,
        fileName: String,
      },

      partiallyPaid: Boolean,

      amountPaid: Number,

      partialPaymentRemarks: String,

    },

    rewardStatus: String,

    commissionRemark: String,

    policyDocuments: [
      {
        data: String,
        fileName: String,
      },
    ],

    source: {
      type: String,
      default: "online",
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

    createdBy: String,

    createdByAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },

    updatedBy: String,

    updatedAt: {

      type: Date,

    },

  });

export default

mongoose.models.IssuedPolicy ||

mongoose.model(
  "IssuedPolicy",
  IssuedPolicySchema
);