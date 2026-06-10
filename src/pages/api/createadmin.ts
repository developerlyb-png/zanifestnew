import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Admin from '@/models/Admin'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userFirstName, userLastName, email, password, role } = req.body;
  // console.log('Received data:', { userName, email, password, role });
  try {
    await dbConnect();
    console.log('Database connected successfully - for creating admin/superadmin');

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const newAdmin = new Admin({
      userFirstName,
      userLastName: userLastName || "",
      email,
      password, // hash before saving in production
      role
    });

    await newAdmin.save();
    return res.status(201).json({ message: 'Admin created successfully' });

  } 
  
  catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
  
}
