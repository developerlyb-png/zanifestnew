// /pages/api/managers/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Manager from '@/models/Manager';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.managerToken; // ensure you're setting this on manager login

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded?.id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const manager = await Manager.findById(decoded.id).lean();
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    // Don't send password
    delete (manager as any).password;

    return res.status(200).json(manager);
  } catch (err) {
    console.error('GET /api/manager/getmanagerdetails Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
