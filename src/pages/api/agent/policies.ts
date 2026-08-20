import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

async function requireAgent(req: NextApiRequest) {
  const token = req.cookies["agentToken"];
  const data = token ? await verifyToken(token) : null;

  if (!data || typeof data !== "object" || (data as any).role !== "agent") {
    return null;
  }
  return data as any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Deliberately checks agentToken only — never falls back to adminToken —
  // so an agent's list always reflects just their own policies, even if the
  // same browser also holds a valid admin session.
  const agent = await requireAgent(req);
  if (!agent) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const { from, to, dateField } = req.query;
      const field = dateField === "createdAt" ? "createdAt" : "startDate";

      const query: any = { createdByAgentId: agent.id };
      if (from || to) {
        query[field] = {};
        if (from) query[field].$gte = new Date(String(from));
        if (to) query[field].$lte = new Date(String(to));
      }

      const policies = await IssuedPolicy.find(query).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, policies });
    } catch (err: any) {
      console.log("AGENT POLICIES ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};

      const requiredFields = ["policyNumber", "insurer", "lineOfBusiness", "premium"];
      const missing = requiredFields.filter((f) => !body[f] && body[f] !== 0);
      if (missing.length) {
        return res.status(400).json({
          success: false,
          message: `Missing required field(s): ${missing.join(", ")}`,
        });
      }

      const existing = await IssuedPolicy.findOne({ policyNumber: body.policyNumber });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Policy Number "${body.policyNumber}" already exists`,
        });
      }

      const agentName = agent.fullName || agent.email;

      // An agent can only ever attribute a policy to themselves — never to a
      // different POSP agent — regardless of what the form submitted.
      const policy = await IssuedPolicy.create({
        ...body,
        source: "manual",
        createdBy: agentName,
        createdByAgentId: agent.id,
        assignment: {
          ...(body.assignment || {}),
          pospAgent: { id: agent.id, name: agentName },
          pospPartner: agentName,
        },
        pospPartner: agentName,
      });

      return res.status(201).json({ success: true, policy });
    } catch (err: any) {
      console.log("AGENT POLICIES CREATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
