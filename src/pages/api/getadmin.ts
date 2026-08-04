// pages/api/admins.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Admin from '@/models/Admin';
import { verifyToken } from '@/utils/verifyToken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const token = req.cookies['adminToken'];
      const data = token ? await verifyToken(token) : null;

      if (
        !data ||
        typeof data !== 'object' ||
        !('role' in data) ||
        !['superadmin', 'admin'].includes((data as any).role)
      ) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      const admins = await Admin.find().select('-password');
      return res.status(200).json(admins);
    } catch (error) {
      console.error('Error fetching admins:', error);
      return res.status(500).json({ message: 'Failed to fetch admins' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
