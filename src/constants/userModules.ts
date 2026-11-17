// User Management's permission system — a standalone staff-account type
// (StaffUser) with its own Role list and per-module access, independent of
// the existing Admin/Manager/Agent accounts and their own login flows.
//
// These module names are deliberately the real sidebar sections that exist
// in superadmin.tsx / admindashboard.tsx today (see SIDEBAR_MODULE_MAP in
// admindashboard.tsx, which hides/shows each one for a staff account based
// on exactly these names) — not invented placeholders. If a sidebar section
// gets renamed, update it here too or the gating silently stops matching.

export const ACCESS_MODULES = [
  "Dashboard",
  "Customer", // Policy — the "Customer" sidebar item (policyDashboard)
  "Leads", // the whole Leads group: Marine/Travel/Shop/Health/Home/Doctor Insurance, Office Package Policy, Director Officer Liability
  "Policy Renewals",
  "Claims",
  "Invoice",
  "Commission",
  "Pay In Pay Out",
] as const;

export const ADMIN_ACCESS_MODULES = [
  "Client Management",
  "User Management",
  "Configuration",
  "Config Seller",
  "POSP Management",
  "IRDAI Reports",
  "Reconciliation",
] as const;

export type AccessModule = (typeof ACCESS_MODULES)[number];
export type AdminAccessModule = (typeof ADMIN_ACCESS_MODULES)[number];

// One flat list for the Add/Edit User form's single "Modules" checklist —
// no auto-preselection by role, no Access/Admin split in the UI. Which
// array (accessModules vs adminAccessModules) a ticked module lands in
// server-side doesn't matter for enforcement: canSeeSection() in
// admindashboard.tsx checks both.
export const ALL_MODULES = [...ACCESS_MODULES, ...ADMIN_ACCESS_MODULES];
export type AnyModule = AccessModule | AdminAccessModule;

// Roles are no longer a fixed list here: they live in the StaffRole
// collection (src/models/StaffRole.ts), managed from User Management's
// "Manage Roles" screen. Only "Admin" and "Branch Manager" are built in.

export const POSP_TYPES = ["Broker-Appointed", "Direct"] as const;
