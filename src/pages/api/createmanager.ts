import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Manager from '@/models/Manager';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // allow larger payloads for base64 files
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();
    console.log("connected to db");

    const {
      firstName,
      lastName,
      email,
      phone,
      managerId,
      dateOfJoining,
      password,
      pinCode,
      city,
      district,
      state,
      managerPanNumber,
      managerAadharNumber,
      nomineeName,
      nomineeRelation,
      nomineePanNumber,
      nomineeAadharNumber,
      accountHoldername,
      bankName,
      accountNumber,
      ifscCode,
      branchLoaction,
      category,
      assignedTo,

      // Base64 strings come here
      managerPanAttachment,
      managerAadharAttachment,
      nomineePanAttachment,
      nomineeAadharAttachment,
      cancelledChequeAttachment,
    } = req.body;

    // ✅ KEEP EXISTING VALIDATION LOGIC
    if (
      !firstName || !lastName || !email || !phone || !managerId || !password ||
      !pinCode || !city || !district || !state || !category
    ) {
      console.log("some field is missing");
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let assignedToId = null;

    if (category !== 'national') {
      if (!assignedTo) {
        return res.status(400).json({
          message: 'assignedTo is required for state and district managers',
        });
      }

      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ message: 'Invalid assignedTo ID format' });
      }

      const assignedManager = await Manager.findById(assignedTo);
      if (!assignedManager) {
        return res.status(400).json({ message: `Assigned manager not found: ${assignedTo}` });
      }

      console.log("manager assigned");

      if (
        (category === 'state' && assignedManager.category !== 'national') ||
        (category === 'district' && assignedManager.category !== 'state')
      ) {
        return res.status(400).json({
          message: `Invalid assignment. A ${category} manager must be assigned to a ${category === 'state' ? 'national' : 'state'} manager.`,
        });
      }

      assignedToId = assignedManager._id;
    }

    console.log("creating new manager");

    // Instead of multer's req.files, save base64 strings directly
    const newManager = new Manager({
      firstName,
      lastName,
      email,
      phone,
      managerId,
      dateOfJoining: dateOfJoining || new Date(),
      password,
      pinCode,
      city,
      district,
      state,

      managerPanNumber,
      managerAadharNumber,

      nomineeName,
      nomineeRelation,
      nomineePanNumber,
      nomineeAadharNumber,

      accountHoldername,
      bankName,
      accountNumber,
      ifscCode,
      branchLoaction,

      managerPanAttachment,       // base64 string
      managerAadharAttachment,    // base64 string
      nomineePanAttachment,       // base64 string
      nomineeAadharAttachment,    // base64 string
      cancelledChequeAttachment,  // base64 string

      category,
      assignedTo: assignedToId,
    });

    await newManager.save();

    return res.status(201).json({
      message: 'Manager created successfully',
      manager: newManager,
    });

  } catch (error: any) {
    console.error('❌ Error creating manager:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
