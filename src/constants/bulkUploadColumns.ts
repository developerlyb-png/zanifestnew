// Single source of truth for the Bulk Upload Policies template/columns.
// The header text is what appears in the downloadable template and what
// SheetJS uses as the object key after parsing an uploaded file, so the
// frontend (template generation + file parsing) and backend (row mapping)
// both import this list to stay in sync.
export interface BulkUploadColumn {
  header: string;
  key: string;
  example: string;
}

export const BULK_UPLOAD_COLUMNS: BulkUploadColumn[] = [
  { header: "Insured Name", key: "insuredName", example: "Ankit Singh" },
  { header: "Sub Insured Name", key: "subInsuredName", example: "" },
  { header: "Insured Mobile Number", key: "insuredMobile", example: "9876543210" },
  { header: "Insured Email Address", key: "insuredEmail", example: "ankit@example.com" },
  { header: "Address", key: "address", example: "" },
  { header: "Business Type", key: "transactionType", example: "New" },
  { header: "Line of Business", key: "lineOfBusiness", example: "Motor" },
  { header: "Product", key: "product", example: "4 Wheeler" },
  { header: "Payment Received Date", key: "paymentReceivedDate", example: "2026-07-01" },
  { header: "Policy Type", key: "policyTypeStructure", example: "Comprehensive" },
  { header: "Policy Number", key: "policyNumber", example: "POL-000123" },
  { header: "Previous Policy No", key: "previousPolicyNo", example: "" },
  { header: "Insurance Company", key: "insurer", example: "Tata AIG General Insurance Company Limited" },
  { header: "Policy Remark", key: "policyRemark", example: "" },
  { header: "Risk Start Date", key: "startDate", example: "2026-07-05" },
  { header: "Risk End Date", key: "endDate", example: "2027-07-04" },
  { header: "Branch Name", key: "branchName", example: "Zirakpur" },
  { header: "Reporting Manager", key: "reportingManagerName", example: "" },
  { header: "Agent Type", key: "agentType", example: "Direct" },
  { header: "Agent Name (if Agent Type = POSP)", key: "pospPartner", example: "" },
  { header: "Direct Agent Name (if Agent Type = Direct)", key: "directAgentName", example: "" },
  { header: "Medium of Issuance", key: "mediumOfIssuance", example: "Offline" },
  { header: "Remarks", key: "additionalRemarks", example: "" },
  { header: "Status", key: "status", example: "Active" },
  { header: "Premium Amount", key: "premium", example: "5000" },
  { header: "Tax Rate", key: "taxRate", example: "18" },
  { header: "GST Amount", key: "gstAmount", example: "900" },
  { header: "Gross Premium", key: "grossPremium", example: "5900" },
  { header: "Commission Amount", key: "commissionAmount", example: "" },
  { header: "Payout Amount", key: "payoutAmount", example: "" },
  { header: "Payout Status", key: "payoutStatus", example: "PENDING" },
  { header: "Reward Status", key: "rewardStatus", example: "Pending" },
  { header: "Commission Remark", key: "commissionRemark", example: "" },
  { header: "Vehicle Type", key: "vehicleType", example: "New" },
  { header: "Fuel Type", key: "fuelType", example: "Petrol" },
  { header: "Model Year", key: "modelYear", example: "2024" },
  { header: "Motor Make", key: "motorMake", example: "" },
  { header: "Model Name", key: "itemsCovered", example: "" },
  { header: "Case Type (Motor only)", key: "caseType", example: "" },
  { header: "Registration Number", key: "registrationNumber", example: "" },
  { header: "NCB Applicable", key: "ncbApplicable", example: "0%" },
];

// Reference list of every dropdown/format-restricted column and its accepted
// values, exported into a second sheet on the downloadable template so
// uploaders know exactly what each column will accept before they fill it
// in. Kept in sync by hand with the validation in src/utils/policyBulkMapping.ts.
export const BULK_UPLOAD_ALLOWED_VALUES: { field: string; allowedValues: string }[] = [
  { field: "Business Type", allowedValues: "New, Rollover, Endorsement, Renewal, Used" },
  { field: "Line of Business", allowedValues: "Motor, Non Motor" },
  {
    field: "Product (when Line of Business = Motor)",
    allowedValues: "Pvt Car, 2W, GCV, PCV, 3W, Misc D, Others",
  },
  {
    field: "Product (when Line of Business = Non Motor)",
    allowedValues:
      "Health, Travel, PA, GMC, GPA, Fire, Marine, Liability, Home, Pet Insurance, WC, Others",
  },
  {
    field: "Policy Type (when Line of Business = Motor)",
    allowedValues: "Comprehensive, TP only, SAOD",
  },
  {
    field: "Policy Type (when Line of Business = Non Motor)",
    allowedValues:
      "Family Health, Critical Illness, Top Up, Single Transit, Open Policy, Structure only, Structure+Contents, Professional Indemnity, Single Trip, Multi Trip, Others",
  },
  {
    field: "Insurance Company",
    allowedValues: "A company already available in the policy form's Insurance Company list",
  },
  {
    field: "Policy Remark",
    allowedValues: "Policy Received, Policy Pending, Endorsement Received, Endorsement Pending",
  },
  { field: "Medium of Issuance", allowedValues: "Online, Offline" },
  { field: "Agent Type", allowedValues: "Direct, POSP" },
  { field: "Reward Status", allowedValues: "Pending, Received, Not Applicable" },
  { field: "Vehicle Type (Motor only)", allowedValues: "New, Old" },
  { field: "Fuel Type (Motor only)", allowedValues: "Petrol, Diesel, CNG, Electric" },
  { field: "NCB Applicable (Motor only)", allowedValues: "0%, 20%, 25%, 35%, 45%, 50%" },
  {
    field: "Case Type (Motor only)",
    allowedValues: "1+1 Cover, 1+3 Cover, 3+3 Cover, 1+5 Cover, 5+5 Cover, Standalone, Short Term, Others",
  },
  {
    field: "Motor Make (Motor only)",
    allowedValues: "A make already available in the policy form's Motor Make list",
  },
  {
    field: "Branch Name",
    allowedValues: "A branch already available in the policy form's Branch Name list",
  },
  { field: "Model Year (Motor only)", allowedValues: "A 4-digit year, e.g. 2024" },
  {
    field: "Payment Received Date / Risk Start Date / Risk End Date",
    allowedValues: "YYYY-MM-DD, e.g. 2026-07-01",
  },
  {
    field: "Premium Amount, Tax Rate, GST Amount, Gross Premium, Commission Amount, Payout Amount",
    allowedValues: "Numbers only",
  },
  { field: "Insured Mobile Number", allowedValues: "10-digit number" },
  { field: "Insured Email Address", allowedValues: "A valid email address" },
];
