// Field definitions for Pay In / Pay Out rules, shared by the create-rule
// pop-up, the rules table and the API so they can never drift apart.
export const ANY = "All";

export const BUSINESS_SEGMENTS = ["Retail", "Corporate", "SME", "Group"];

// Criteria present on every rule, regardless of Line of Business.
export const COMMON_FIELDS = [
  "insurer",
  "businessSegment",
  "lineOfBusiness",
  "product",
  "policyType",
  "transactionType",
  "mediumOfInsurance",
] as const;

// Extra criteria shown only when Line of Business = Motor.
export const MOTOR_FIELDS = [
  "fuel",
  "rto",
  "manufacture",
  "ncb",
  "volume",
  "typeOfPolicy",
  "capacity",
  "discount",
  "bodyType",
  "gvw",
  "vehicleAge",
] as const;

export const MOTOR_FIELD_LABELS: Record<(typeof MOTOR_FIELDS)[number], string> = {
  fuel: "Fuel",
  rto: "RTO",
  manufacture: "Manufacture",
  ncb: "NCB",
  volume: "Volume",
  typeOfPolicy: "Type of Policy",
  capacity: "Capacity",
  discount: "Discount",
  bodyType: "Body Type",
  gvw: "GVW",
  vehicleAge: "Vehicle Age",
};
