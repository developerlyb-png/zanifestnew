import dbConnect from '@/lib/dbConnect';
import Manager from '@/models/Manager';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    try {

      const managers = await Manager
        .find({ category: 'district' })
        .select('firstName lastName managerId');

      console.log("District managers fetched:", managers);

      res.status(200).json({ managers });

    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch district managers' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}