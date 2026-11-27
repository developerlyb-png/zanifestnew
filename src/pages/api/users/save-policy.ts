import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";
import { friendlyMessage, errorStatus } from "@/utils/friendlyError";
import { getSellingAgent, agentPolicyFields } from "@/lib/agentAttribution";

// Records a policy issued through the online motor flows (Digit, Shriram,
// SBI GCV, car checkouts). Two ways in:
//   - a logged-in customer (userToken)  -> filed under that customer, or
//   - an agent selling from the agent portal (agentToken + agentSellMode)
//     -> filed under the agent, like their uploaded policies. Previously an
//     agent sale had no userToken and was rejected with 401, so the issued
//     policy was never saved at all.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST" });
  }

  try {
    const agent = await getSellingAgent(req);

    let user: { id?: string; email?: string } | null = null;
    const token = req.cookies.userToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        user = { id: decoded.id, email: decoded.email };
      } catch {
        user = null;
      }
    }

    if (!user && !agent) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const { policyNumber, premium, grossPremium, transactionType, vehicle, customer, insurer, policyType } =
      req.body;

    await dbConnect();

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const policy = await IssuedPolicy.create({
      policyNumber,
      premium,
      grossPremium,
      transactionType: transactionType || "Rollover",
      vehicle,
      customer,
      ...(user ? { userId: user.id, userEmail: user.email } : {}),
      policyType: policyType || "Car Insurance",
      insurer: insurer || "Zuno General Insurance",
      status: "Active",
      startDate,
      endDate,
      ...(agent ? agentPolicyFields(agent) : {}),
    });

    return res.status(200).json({ success: true, policy });
  } catch (err: any) {
    console.log("SAVE POLICY ERROR", err);
    return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
  }
}
