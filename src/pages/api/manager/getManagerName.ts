// pages/api/me.ts
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.managerToken;
  // console.log("Token received:", token);

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: 'Unauthorized' });}

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    // console.log("Decoded token:", decoded.name);
    const {name, email, role} = decoded;
    // console.log("User data:", { name, email, role });
    // Return user data without the password
    res.status(200).json({ user: {name, email, role} });
  } catch (error) {
    res.status(401).json({ message: 'Invalid Token' });
  }
}
