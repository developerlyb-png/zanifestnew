// Shared by the Invoice dashboard, the Create Invoice wizard and the API so
// the allowed values can never drift between the two.
export const INVOICE_STATUSES = ["Draft", "Issued", "Sent", "Signed", "Cancelled"] as const;
export const DEFAULT_INVOICE_STATUS = "Draft";

export const TAX_MODES = ["INTRA", "INTER"] as const;
export const TAX_MODE_LABELS: Record<string, string> = {
  INTRA: "Intra State (INTRA)",
  INTER: "Inter State (INTER)",
};

export const DISCOUNT_TYPES = ["₹", "%"] as const;

export const INVOICE_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Draft: { bg: "#fef3c7", fg: "#b45309" },
  Issued: { bg: "#dbeafe", fg: "#1d4ed8" },
  Sent: { bg: "#ede9fe", fg: "#6d28d9" },
  Signed: { bg: "#dcfce7", fg: "#15803d" },
  Cancelled: { bg: "#fee2e2", fg: "#b91c1c" },
};

export const invoiceStatusColor = (status: string) =>
  INVOICE_STATUS_COLORS[status] || { bg: "#f3f4f6", fg: "#374151" };

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];
