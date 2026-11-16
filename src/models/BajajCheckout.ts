import mongoose from "mongoose";

// A Bajaj Allianz proposal between "priced" and "paid". Saved server-side by
// /api/bajaj/<4w|2w>/issue-policy so that when Bajaj's payment page sends
// the customer back with a policy number, /api/bajaj/<4w|2w>/payment-return
// can record the IssuedPolicy itself — without depending on the customer's
// browser or login (a paid 2W policy was once lost when the client-side
// save was rejected for a missing login cookie).
const BajajCheckoutSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    vehicleClass: { type: String, enum: ["4W", "2W"], required: true },
    // paid_no_policy: Bajaj confirmed the payment but returned policyref=null
    // (seen on UAT, txn 1432798284) — needs follow-up with Bajaj
    status: { type: String, enum: ["priced", "issued", "paid", "paid_no_policy"], default: "priced" },
    // Bajaj/BillDesk payment reference from the payment return (v_restranid)
    paymentRef: String,
    product: String,
    premium: Number,
    netPremium: Number,
    gst: Number,
    idv: Number,
    termStart: Date,
    termEnd: Date,
    isNew: Boolean,
    // Customer's account, when they were logged in at checkout
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userEmail: String,
    customer: {
      fullName: String,
      email: String,
      mobile: String,
      address: String,
    },
    vehicle: {
      number: String,
      make: String,
      model: String,
    },
    policyNumber: String,
  },
  { timestamps: true }
);

export default mongoose.models.BajajCheckout || mongoose.model("BajajCheckout", BajajCheckoutSchema);
