import { NextApiRequest } from "next";
import { verifyToken } from "@/utils/verifyToken";

export type StaffAuth =
  | { role: "admin"; id: string; name: string; email?: string }
  | { role: "agent"; id: string; name: string; email?: string };

/**
 * Accepts either an adminToken (superadmin/admin) or an agentToken (agent) cookie.
 * Used by reference-data routes (branches/motor makes/insurers) and the policy
 * routes that agents now share with the admin Policy Dashboard, so both roles
 * can look up/add the same dropdown options and issued policies.
 */
export async function requireAdminOrAgent(req: NextApiRequest): Promise<StaffAuth | null> {
  const adminToken = req.cookies["adminToken"];
  if (adminToken) {
    const data = await verifyToken(adminToken);
    if (
      data &&
      typeof data === "object" &&
      "role" in data &&
      ["superadmin", "admin"].includes((data as any).role)
    ) {
      const d = data as any;
      return {
        role: "admin",
        id: String(d.id ?? d._id ?? ""),
        name: `${d.userFirstName ?? ""} ${d.userLastName ?? ""}`.trim() || d.email,
        email: d.email,
      };
    }
  }

  const agentToken = req.cookies["agentToken"];
  if (agentToken) {
    const data = await verifyToken(agentToken);
    if (data && typeof data === "object" && (data as any).role === "agent") {
      const d = data as any;
      return {
        role: "agent",
        id: String(d.id ?? ""),
        name: d.fullName || d.email,
        email: d.email,
      };
    }
  }

  return null;
}
