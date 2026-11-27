// Agent selling from the portal (Buy Insurance tab): the agent enters the
// customer's details instead of the customer logging in with OTPs. These
// helpers hold that customer for the rest of the flow (quotes → proposal →
// KYC → checkout) so later steps can prefill from it.
//
// Kept in sessionStorage under its own key — never in localStorage "user" —
// so the agent's browser is never left "logged in" as the customer.

export type AgentCustomer = { name: string; mobile: string; email: string };

const KEY = "agentCustomer";

export function isAgentSelling(): boolean {
  return typeof document !== "undefined" && document.cookie.split("; ").includes("agentSellMode=1");
}

export function saveAgentCustomer(c: AgentCustomer) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* storage blocked — later steps just won't prefill */
  }
}

export function getAgentCustomer(): AgentCustomer | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AgentCustomer) : null;
  } catch {
    return null;
  }
}

/**
 * Who to prefill proposal / KYC / checkout forms with: the agent's customer
 * while an agent is selling, otherwise the customer logged in on this
 * browser (localStorage "user"). Null when neither.
 */
export function getPrefillUser(): { name?: string; fullName?: string; mobile?: string; email?: string } | null {
  if (isAgentSelling()) return getAgentCustomer();
  try {
    const raw = localStorage.getItem("user");
    return raw && raw !== "undefined" ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
