// /pages/api/managers/me/update.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Manager from '@/models/Manager';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.managerToken;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (!decoded?.id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // What the manager is allowed to update
    const allowedFields = [
      'firstName','lastName','email','phone','dateOfJoining',
      'pinCode','city','district','state',
      'managerPanNumber','managerAadharNumber',
      'nomineeName','nomineeRelation','nomineePanNumber','nomineeAadharNumber',
      'accountHoldername','bankName','accountNumber','ifscCode','branchLoaction',
      'managerPanAttachment','managerAadharAttachment',
      'nomineePanAttachment','nomineeAadharAttachment','cancelledChequeAttachment'
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await Manager.findByIdAndUpdate(decoded.id, updates, {
      new: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    delete (updated as any).password;
    return res.status(200).json({ message: 'Profile updated', manager: updated });
  } catch (err) {
    console.error('PATCH /api/managers/me/update Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
