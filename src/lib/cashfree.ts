import axios from "axios";

const baseURL = process.env.CF_BASE_URL!;
const clientId = process.env.CF_CLIENT_ID!;
const clientSecret = process.env.CF_CLIENT_SECRET!;

// Debug logs
console.log("⚙ Cashfree Base URL =", baseURL);
console.log("⚙ CF Client ID Loaded =", !!clientId);
console.log("⚙ CF Client Secret Loaded =", !!clientSecret);

if (!clientId || !clientSecret) {
  throw new Error("Cashfree Client ID/Secret missing in environment variables");
}

// Axios instance
export const cf = axios.create({
  baseURL, // https://api.cashfree.com/verification
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "x-client-id": clientId,
    "x-client-secret": clientSecret,
  },
});

// Proper RC Response Type (optional)
export type RCResponse = {
  status: string;
  message: string;
  data?: any;
};

// 🚀 LIVE RC Lookup Method (Production)
export const verifyRC = async (vehicle_number: string) => {
  console.log("🚗 Sending RC lookup request:", vehicle_number);

  try {
    const result = await cf.post("/rc/lookup", {
      rc_number: vehicle_number,
    });

    console.log("✅ Cashfree RC Response:", result.data);
    return result;

  } catch (err: any) {
    console.log("❌ CF RC ERROR:", err?.response?.data);
    console.log("❌ CF RC HTTP STATUS:", err?.response?.status);
    throw err;
  }
};
