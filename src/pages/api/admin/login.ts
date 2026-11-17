// pages/api/admin/login.ts
import { NextApiRequest, NextApiResponse } from "next";
import Admin from "@/models/Admin";
import StaffUser from "@/models/StaffUser";
import dbConnect from "@/lib/dbConnect";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body;
  console.log("Admin login API called with email:", email);
  // console.log('Received password:', password);

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    await dbConnect();
    const admin = await Admin.findOne({ email: normalizedEmail }).select("userFirstName userLastName email role password accountStatus");
    console.log("Admin found:", admin);

    if (!admin) {
      // Not an Admin-collection account — check the standalone User
      // Management (StaffUser) accounts before failing. Issued a JWT with
      // role:"admin" so every existing requireAdmin() check across the app
      // keeps accepting it unchanged; what a staff user can actually see is
      // driven by accessModules/adminAccessModules on the sidebar instead.
      const staffUser = await StaffUser.findOne({ email: normalizedEmail });
      if (staffUser) {
        const isMatch = await bcrypt.compare(password, staffUser.password);
        if (!isMatch) {
          console.warn("Login failed: Password mismatch (staff user)");
          return res.status(401).json({ message: "Invalid email or password" });
        }
        if (!staffUser.isActive) {
          return res.status(403).json({ message: "Account is not active. Please contact support." });
        }

        const token = jwt.sign(
          {
            id: staffUser._id,
            userFirstName: staffUser.fullName,
            userLastName: "",
            email: staffUser.email,
            role: "admin",
            accountStatus: "active",
            isStaffUser: true,
            staffRole: staffUser.role,
            accessModules: staffUser.accessModules || [],
            adminAccessModules: staffUser.adminAccessModules || [],
          },
          process.env.JWT_SECRET as string,
          { expiresIn: "1d" }
        );

        res.setHeader(
          "Set-Cookie",
          serialize("adminToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
          })
        );

        return res.status(200).json({ token, role: "admin" });
      }

      console.warn("Login failed: Admin not found");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
  
    console.log("db password", admin.password);

    if (!isMatch) {
      console.warn("Login failed: Password mismatch");
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const status = admin.accountStatus ?? "active";

    
    if(admin.role==='admin' && status === 'inactive') {
      console.log(`Login attempt blocked for inactive account: ${email}`);
      return res.status(403).json({ message: "Account is not active. Please contact support." });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: admin._id,
        userFirstName: admin.userFirstName,
        userLastName: admin.userLastName || "",
        email: admin.email,
        role: admin.role,
        accountStatus: status,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    console.log("Token generated for admin:", admin.userFirstName);
    console.log("Role of admin:", admin.role);

    // Set cookie with token
    res.setHeader(
      "Set-Cookie",
      serialize("adminToken", token, {
        httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      })
    );
console.log("DB email:", admin.email);
console.log("Login email:", email);
console.log("Entered password:", password);
console.log("DB password:", admin.password);


    console.log("Token set in cookie for admin:", admin.userFirstName);

    // Respond with minimal info
    return res.status(200).json({ token, role: admin.role });

  } 
  
  catch (err) {
    console.error("Login server error:", err);

    
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
