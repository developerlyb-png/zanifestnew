// models/Manager.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// import Counter from './Counter';

const managerSchema = new mongoose.Schema({
 
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: {type: String},
  managerId: {
    type: String,
    required: true,
    unique: true, // now you enter 'NM1', 'SM2', etc. manually
  },
  dateOfJoining: {type: Date,   default: Date.now},
  password: { type: String, required: true },
  

    pinCode: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
    district: { type: String, required: true},
    state: { type: String, required: true},
  

  managerPanNumber: {type: String},
  managerAadharNumber:{type: String},
    managerPanAttachment: {
    type: String, // path or filename for uploaded PAN
  },
  managerAadharAttachment: {
    type: String,
  },

  nomineeName: {type: String},
  nomineeRelation : {type: String},
  nomineePanNumber: { type: String},
  nomineeAadharNumber: { type: String},
  nomineePanAttachment: { type: String},
  nomineeAadharAttachment: { type: String},

  //bank details 
  accountHoldername:{ type: String},
  bankName: { type: String},
  accountNumber: { type: String},
  ifscCode: { type: String},
  branchLoaction: { type: String},
  cancelledChequeAttachment: { type: String},

  category: {
    type: String,
    enum: ['national', 'state', 'district'],
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    default: null,
  },

  accountStatus: { type: String, enum: ['active', 'inactive'], default: 'active' }, // NEW
  // models/Manager.ts (add this field inside managerSchema)
totalSales: { type: Number, default: 0 },


}, {
  timestamps: true,
});



managerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});




// Auto-increment middleware before saving
// managerSchema.pre('save', async function (next) {
//   if (this.isNew) {
//     const counter = await Counter.findByIdAndUpdate(
//       { _id: 'managerId' },
//       { $inc: { seq: 1 } },
//       { new: true, upsert: true }
//     );
//     this.managerId = counter.seq;
//   }
//   next();
// });

const Manager = mongoose.models.Manager || mongoose.model('Manager', managerSchema);
export default Manager;
