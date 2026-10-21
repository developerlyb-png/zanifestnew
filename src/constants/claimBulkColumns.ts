// Single source of truth for the Claims bulk-upload template. The header text
// is what appears in the downloaded template and what SheetJS uses as the key
// after parsing, so the modal (template + parsing) and API stay in sync.
import { CLAIM_TYPES, CLAIM_STATUSES, REPORTED_CHANNELS } from "./claims";

export interface ClaimBulkColumn {
  header: string;
  key: string;
  example: string;
  required?: boolean;
}

export const CLAIM_BULK_COLUMNS: ClaimBulkColumn[] = [
  { header: "Policy Number", key: "policyNumber", example: "POL-000123", required: true },
  { header: "Claim Type", key: "claimType", example: "Non Employee Benefit", required: true },
  { header: "Claim No", key: "claimNumber", example: "" },
  { header: "Reported Channel", key: "reportedChannel", example: "Phone", required: true },
  { header: "Date of Loss", key: "dateOfLoss", example: "2026-09-20" },
  { header: "Reported On", key: "reportedOn", example: "2026-09-25" },
  { header: "Claim Status", key: "status", example: "Claim Intimation" },
  { header: "Special Remark", key: "specialRemark", example: "Customer reported by phone", required: true },
  { header: "Claim Details", key: "claimDetails", example: "" },
  { header: "Estimated Amount", key: "estimatedAmount", example: "50000" },
  { header: "Claimed Amount", key: "claimedAmount", example: "45000" },
  { header: "Approved Amount", key: "approvedAmount", example: "0" },
  { header: "Loss Cause", key: "lossCause", example: "Fire" },
  { header: "Loss Details", key: "lossDetails", example: "Short circuit in warehouse" },
  { header: "Site Address", key: "siteAddress", example: "Plot 12, Industrial Area" },
  { header: "Site PIN Code", key: "sitePinCode", example: "160104" },
  { header: "State", key: "state", example: "Punjab" },
  { header: "City", key: "city", example: "Zirakpur" },
  { header: "Patient Name", key: "patientName", example: "" },
  { header: "Hospital Name", key: "hospitalName", example: "" },
  { header: "Diagnosis", key: "diagnosis", example: "" },
  { header: "Admission Date", key: "admissionDate", example: "" },
  { header: "Discharge Date", key: "dischargeDate", example: "" },
];

export const CLAIM_BULK_ALLOWED_VALUES: { field: string; allowedValues: string }[] = [
  { field: "Claim Type", allowedValues: CLAIM_TYPES.join(", ") },
  { field: "Reported Channel", allowedValues: REPORTED_CHANNELS.join(", ") },
  { field: "Claim Status", allowedValues: `${CLAIM_STATUSES.join(", ")} (blank = Claim Intimation)` },
  { field: "Policy Number", allowedValues: "Must match an existing policy — insured, contact, insurer and product are filled from it" },
  { field: "Claim No", allowedValues: "Any unique text. Leave blank to auto-generate TEMP_CL-No_1, 2, ..." },
  { field: "Dates", allowedValues: "YYYY-MM-DD or DD/MM/YYYY" },
  { field: "Non Employee Benefit rows need", allowedValues: "Loss Cause, Loss Details, Site Address, Site PIN Code, State, City" },
  { field: "Employee Benefit rows need", allowedValues: "Patient Name, Hospital Name, Diagnosis" },
];
