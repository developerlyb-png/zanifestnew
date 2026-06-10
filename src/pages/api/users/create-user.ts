import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User'; 
import crypto from "crypto";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userName, email } = req.body;

  try {
    await dbConnect();

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

  const token = crypto.randomBytes(32).toString("hex");

const newUser = new User({
  userName,
  email,
  password: null,
  resetPasswordToken: token,
  resetPasswordExpires: Date.now() + 24 * 60 * 60 * 1000 
});


    await newUser.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const link = `http://localhost:3000/set-password?token=${token}`;
//         const link = `    https://zanifestinit.vercel.app/
// set-password?token=${token}`;


    await transporter.sendMail({
      from: `"Zanifest Insurance" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Setup your password",
      html: `<p>Hello ${userName},</p>
            <p>Your account has been created. Please set your password by clicking the link below:</p>
            <p>Click <a href="${link}">here</a> to set your password. This link expires in 1 hour.</p>`
    });

    return res.status(201).json({ message: 'User created successfully. Email sent!' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
