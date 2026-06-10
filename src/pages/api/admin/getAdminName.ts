// pages/api/getAdminInfo.ts
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.adminToken; // Make sure you're setting this cookie during login
  // console.log("Token received for getting admin details:", token);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    // console.log("Decoded token:", decoded);
    //working till here
    const { userFirstName, userLastName, email, role } = decoded;

    console.log("decoded name", userFirstName)

    return res.status(200).json({
      user: { userFirstName, userLastName, email, role }
    });
  } 
  
  catch (error) {
    return res.status(401).json({ message: 'Invalid Token' });
  }
}
