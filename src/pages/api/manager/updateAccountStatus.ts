import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Manager from '@/models/Manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'PATCH') {
    
    try {
      const { id } = req.query;
      const { accountStatus } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: "Manager ID is required" });
      }

      if (!['active', 'inactive'].includes(accountStatus)) {
        return res.status(400).json({ success: false, message: "Invalid accountStatus value" });
      }

      const updatedManager = await Manager.findByIdAndUpdate(
        id,
        { accountStatus },
        { new: true }
      );

      if (!updatedManager) {
        return res.status(404).json({ success: false, message: "Manager not found" });
      }

      return res.status(200).json({ success: true, data: updatedManager });
    } 
    
    catch (error) {
      console.error("Error updating manager status:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  } 
  
  else {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
}
