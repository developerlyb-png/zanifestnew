import mongoose, { Schema, Document } from "mongoose";

/* =========================
   TypeScript Interface
========================= */
export interface IAgent extends Document {
  // Auth / Identity
  loginId: string;          // internal login
  agentCode: string;        // public/unique agent code
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  profileImage?: string;
  // Address
  city: string;
  district: string;
  state: string;
  pinCode: string;

  // PAN / Aadhaar
  panNumber?: string;
  panAttachment?: string;
  adhaarNumber?: string;
  adhaarAttachment?: string;
  adhaarBackAttachment?: string;
 certificate?: string;
 certificate1?: string;
 certificate2?: string;
  // Nominee
  nomineeName?: string;
  nomineeRelation?: string;
  nomineePanNumber?: string;
  nomineeAadharNumber?: string;
  nomineePanAttachment?: string;
  nomineeAadhaarAttachment?: string;

  // Bank
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchLocation?: string;
  cancelledChequeAttachment?: string;

  // Generic attachments (extra docs)
  attachments?: {
    filename: string;
    data?: Buffer;
    url?: string;
    mimetype?: string;
  }[];

  // Assignment
  assignedTo: string;
  // Training / Certification
  trainingCompleted?: boolean;
  trainingScore?: number | null;
  trainingTotal?: number | null;
  trainingCompletedAt?: Date | null;
  // Sales tracking
  lifetimeSales: number;
  currentDMSales: number;

  reassignmentHistory?: {
    fromManager?: string;
    toManager?: string;
    salesUnderPrevManager?: number;
    reassignedAt?: Date;
  }[];

  // Status
  status: "pending" | "reviewed" | "approved" | "rejected";
  accountStatus: "active" | "inactive";

  // 🔥 ADD BELOW status fields (NO REMOVAL)

rejectedFields: {
  type: [String],
  default: [],
},

rejectionRemark: {
  type: String,
},
tenthMarksheetAttachment: {
  type: String,
  default: null,
},

twelfthMarksheetAttachment: {
  type: String,
  default: null,
},

yearofpassing10th: String,
yearofpassing12th: String,


}

/* =========================
   Mongoose Schema
========================= */
const agentSchema = new Schema<IAgent>(
  {
    // Auth / Identity
    loginId: { type: String, required: true },
agentCode: { type: String, unique: true, sparse: true },

    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    profileImage: { type: String, default: null },
    // Address
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },

    // PAN / Aadhaar
    panNumber: { type: String },
    panAttachment: { type: String },
    adhaarNumber: { type: String },
    adhaarAttachment: { type: String },
    adhaarBackAttachment: { type: String },
    // ===== EDUCATION DETAILS =====
yearofpassing10th: { type: String },
tenthMarksheetAttachment: { type: String, default: null },

yearofpassing12th: { type: String },
twelfthMarksheetAttachment: { type: String, default: null },

    // Nominee
    nomineeName: { type: String },
    nomineeRelation: { type: String },
    nomineePanNumber: { type: String },
    nomineeAadharNumber: { type: String },
    nomineePanAttachment: { type: String },
    nomineeAadhaarAttachment: { type: String },

    // Bank
    accountHolderName: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    branchLocation: { type: String },
    cancelledChequeAttachment: { type: String },

    // Attachments
    attachments: [
      {
        filename: String,
        data: Buffer,
        url: String,
        mimetype: String,
      },
    ],

    //Assignment
    assignedTo: {
      type: String,
      ref: "Manager",
      // required: true,
      default: null,
    },
  // 🔥 TRAINING DATA
    trainingCompleted: { type: Boolean, default: false },
    trainingScore: { type: Number, default: null },
    trainingTotal: { type: Number, default: null },
    trainingCompletedAt: { type: Date, default: null },


    // Sales tracking
    lifetimeSales: { type: Number, default: 0 },
    currentDMSales: { type: Number, default: 0 },

    reassignmentHistory: [
      {
        fromManager: { type: String, ref: "Manager" },
        toManager: { type: String, ref: "Manager" },
        salesUnderPrevManager: { type: Number, default: 0 },
        reassignedAt: { type: Date, default: Date.now },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ["pending", "reviewed", "approved", "rejected"],
      default: "pending",
    },
    certificate: {
  type: String,
  default: ""
},
certificate1: {
  type: String,
  default: ""
},
certificate2: {
  type: String,
  default: ""
},

rejectedFields: {
  type: [String],
  default: [],
},

rejectionRemark: {
  type: String,
},

    accountStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

/* =========================
   Safety Defaults
========================= */
agentSchema.pre("save", function (next) {
  if (this.lifetimeSales == null) this.lifetimeSales = 0;
  if (this.currentDMSales == null) this.currentDMSales = 0;
  next();
});

/* =========================
   Export Model
========================= */
export default mongoose.models.Agent ||
  mongoose.model<IAgent>("Agent", agentSchema);