// Shared by the Claims dashboard/wizard (client) and the claims API (server)
// so the allowed values can never drift between the two.
export const CLAIM_TYPES = ["Non Employee Benefit", "Employee Benefit"] as const;

export const REPORTED_CHANNELS = ["Phone", "Email", "WhatsApp", "In Person"] as const;

export const CLAIM_STATUSES = [
  "Claim Intimation",
  "Documents Pending",
  "Under Survey",
  "Under Review",
  "Approved",
  "Settled",
  "Rejected",
  "Closed",
] as const;

export const DEFAULT_CLAIM_STATUS = "Claim Intimation";

// Dashboard cards: Rejected and Closed (Settled counts as closed — the
// claim's lifecycle is over) are terminal; everything else is still open.
export const REJECTED_STATUSES: string[] = ["Rejected"];
export const CLOSED_STATUSES: string[] = ["Closed", "Settled"];

// Auto-generated claim numbers when the admin leaves Claim No blank:
// TEMP_CL-No_1, TEMP_CL-No_2, ... (sequential, see nextTempClaimNumber in
// api/admin/claims.ts). Admins can type any claim number they like instead.
export const TEMP_CLAIM_PREFIX = "TEMP_CL-No_";

// One color per status — used for the dashboard status pills and the
// timeline dots on the claim detail page.
export const CLAIM_STATUS_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  "Claim Intimation": { bg: "#e0edff", fg: "#1d4ed8", dot: "#2563eb" },
  "Documents Pending": { bg: "#fef3c7", fg: "#b45309", dot: "#f59e0b" },
  "Under Survey": { bg: "#ede9fe", fg: "#6d28d9", dot: "#8b5cf6" },
  "Under Review": { bg: "#ffedd5", fg: "#c2410c", dot: "#f97316" },
  Approved: { bg: "#dcfce7", fg: "#15803d", dot: "#22c55e" },
  Settled: { bg: "#ccfbf1", fg: "#0f766e", dot: "#14b8a6" },
  Rejected: { bg: "#fee2e2", fg: "#b91c1c", dot: "#ef4444" },
  Closed: { bg: "#e5e7eb", fg: "#374151", dot: "#6b7280" },
};

export const statusColor = (status: string) =>
  CLAIM_STATUS_COLORS[status] || { bg: "#f3f4f6", fg: "#374151", dot: "#9ca3af" };
