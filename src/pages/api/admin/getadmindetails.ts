// /pages/api/managers/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Admin from '@/models/Admin';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  try {
    //parse headers for cookies
    const cookies = parse(req.headers.cookie || '');

    //get token from cookies
    const token = cookies.adminToken; // ensure you're setting this on manager login

    if (!token) {
        //token not there
        console.log("No token provided");
      return res.status(401).json({ message: 'No token provided' });
    }

    //check if token is valid and not expired
    // console.log("Verifying token:", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded?.id) {
        //token invalid
        console.log("Invalid token");
      return res.status(401).json({ message: 'Invalid token' });
    }

    const admin = await Admin.findById(decoded.id).lean();
    console.log("Fetched admin:", admin);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Don't send password
    delete (admin as any).password;

    return res.status(200).json(admin);
  } catch (err) {
    console.error('GET /api/admin/getadmindetails Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
