import dbConnect from '@/lib/dbConnect';
import Manager from '@/models/Manager';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
    console.log("Connected to database to fetch state managers");
  if (req.method === 'GET') {
    try {
      const stateManagers = await Manager.find({ category: 'state' });
      // console.log("Fetched state managers:", stateManagers);
      res.status(200).json({ success: true, data: stateManagers });
    } catch (error) {
        console.error("Error fetching state managers:", error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
