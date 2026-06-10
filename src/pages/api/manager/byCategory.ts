import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Manager from '@/models/Manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
    console.log("Connected to database to fetch managers by category");

  const { category } = req.query;
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

  try {

    const managers = await Manager.find({ category }).select('managerId name');
    console.log(`Fetched managers for category ${category}:`, managers);
    return res.status(200).json(managers);
  } catch (error) {
    
    console.error('Error fetching managers by category:', error);
    return res.status(500).json({ message: 'Failed to fetch managers' });
  }
}
