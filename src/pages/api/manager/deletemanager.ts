import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Manager from '@/models/Manager';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query;
  console.log("Deleting manager with ID:", id);

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    await dbConnect();
    console.log("connected to db");

    const manager = await Manager.findByIdAndDelete(id);
    console.log("Manager findByIdAndDelete:", manager);

    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

return res.status(200).json({ success: true, message: 'Manager deleted successfully' });
  } catch (error) {
    console.error('Error deleting manager:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}