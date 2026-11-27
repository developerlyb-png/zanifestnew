import type { NextApiRequest } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";

// "Agent selling" mode: an agent opens a product from the agent portal's
// "Buy Insurance" tab and runs the normal customer quote/buy flow on a
// customer's behalf. Every policy (and lead) created in that mode must be
// stored under the agent — same fields as an agent-uploaded policy
// (src/pages/api/agent/policies.ts), so it shows in the agent's List of
// Policy, commission, etc.
//
// Attribution needs BOTH:
//   - agentToken  — the agent's real login (httpOnly, verified here), and
//   - agentSellMode=1 — set only when the flow is launched from the portal's
//     Buy Insurance tab (cleared by "Exit agent mode" / agent logout).
// So an agent just browsing the public site in another tab is never
// credited by accident, and nobody can claim an agent by setting the
// flag cookie alone.

export const AGENT_SELL_MODE_COOKIE = "agentSellMode";

export interface AgentSession {
  id: string;
  name: string;
  email?: string;
  code?: string;
  mobile?: string;
}

/** Agent's current name / code / mobile / email from the Agent record. */
export async function agentSessionById(id: string, fallbackName = "Agent"): Promise<AgentSession> {
  try {
    await dbConnect();
    const a: any = await Agent.findById(id).select("firstName lastName email phone agentCode").lean();
    if (a) {
      const name = [a.firstName, a.lastName].filter(Boolean).join(" ").trim();
      return {
        id: String(id),
        name: name || a.email || fallbackName,
        email: a.email || undefined,
        code: a.agentCode || undefined,
        mobile: a.phone || undefined,
      };
    }
  } catch (e) {
    console.log("AGENT LOOKUP FAILED", e);
  }
  return { id: String(id), name: fallbackName };
}

export async function getSellingAgent(req: NextApiRequest): Promise<AgentSession | null> {
  if (req.cookies?.[AGENT_SELL_MODE_COOKIE] !== "1") return null;
  const token = req.cookies?.agentToken;
  if (!token) return null;
  try {
    const data: any = await verifyToken(token);
    if (!data || typeof data !== "object" || data.role !== "agent" || !data.id) return null;
    const fallback = data.fullName || data.email || "Agent";
    const session = await agentSessionById(String(data.id), fallback);
    return { ...session, email: session.email || data.email };
  } catch {
    return null;
  }
}

/** IssuedPolicy fields that file a policy under the agent (mirrors api/agent/policies.ts). */
export function agentPolicyFields(agent: AgentSession) {
  return {
    createdBy: agent.name,
    createdByAgentId: agent.id,
    pospPartner: agent.name,
    assignment: {
      pospAgent: { id: agent.id, name: agent.name },
      pospPartner: agent.name,
    },
    // Issued by the insurer through the live flow — a real policy, not an
    // agent upload awaiting document review — so it's visible right away.
    adminApprovalStatus: "Approved" as const,
    // Snapshot of who sold it, as of the sale — shown to admins on the policy.
    soldByAgent: {
      id: agent.id,
      name: agent.name,
      code: agent.code || "",
      mobile: agent.mobile || "",
      email: agent.email || "",
      channel: "Agent Portal",
      soldAt: new Date(),
    },
  };
}

/** Lead fields that put an enquiry into the agent's own Lead tab (api/agent/leads.ts). */
// Same fields the admin "assign lead to agent" action sets
// (e.g. api/shopinsurance.ts ?assign=true).
export function agentLeadFields(agent: AgentSession) {
  return {
    assignedAgent: agent.id,
    assignedAgentName: agent.name, // only Marine has this field; ignored elsewhere
    assignedTo: agent.email || null,
    assignedAt: new Date(),
  };
}
