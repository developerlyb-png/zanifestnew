// import jwt from 'jsonwebtoken';

// const JWT_SECRET = process.env.JWT_SECRET || 'yoursecret';

// export const verifyToken = (token: string) => {
//   try {
//     return jwt.verify(token, JWT_SECRET);
//   } 
  
//   catch (error) {
//     return null;
//   }
// };
import { jwtVerify } from 'jose';

export async function verifyToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET || 'yoursecret';
    if (!secret) throw new Error("JWT_SECRET not set");

    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);

    const { payload } = await jwtVerify(token, secretKey);

    return payload; // contains 'role' and other data
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}


