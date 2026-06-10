import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Manager from '@/models/Manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();

    if (req.method === 'GET') {
      const managers = await Manager.find().populate('assignedTo', 'firstName lastName managerId');
      return res.status(200).json(managers);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } 
  catch (error) {
    console.error('Error fetching managers:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
