// Field definitions for Pay In / Pay Out rules, shared by the create-rule
// pop-up, the rules table, the API and the matcher so they never drift apart.
export const ANY = "All";

// "All" means no line-of-business restriction and is stored as blank.
export const LINES_OF_BUSINESS_RULE = ["All", "Motor", "Non Motor"] as const;

export const BUSINESS_SEGMENTS = ["Retail", "Corporate", "SME", "Group"];

// Single-value criteria shared by every line of business.
export const COMMON_FIELDS = [
  "insurer",
  "businessSegment",
  "product",
  "policyType",
  "transactionType",
  "mediumOfInsurance",
] as const;

// Single-value criteria that only apply to Motor rules.
export const MOTOR_TEXT_FIELDS = [
  "fuel",
  "ncb",
  "volume",
  "typeOfPolicy",
  "capacity",
  "discount",
  "bodyType",
  "gvw",
  "vehicleAge",
] as const;

export const MOTOR_FIELD_LABELS: Record<(typeof MOTOR_TEXT_FIELDS)[number], string> = {
  fuel: "Fuel",
  ncb: "NCB",
  volume: "Volume",
  typeOfPolicy: "Type of Policy",
  capacity: "Capacity",
  discount: "Discount",
  bodyType: "Body Type",
  gvw: "GVW",
  vehicleAge: "Vehicle Age",
};
