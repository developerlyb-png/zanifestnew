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
  { header: "Transaction Type", key: "transactionType", example: "Fresh" },
  { header: "Line of Business", key: "lineOfBusiness", example: "Motor" },
  { header: "Product", key: "product", example: "4 Wheeler" },
  { header: "Payment Received Date", key: "paymentReceivedDate", example: "2026-07-01" },
  { header: "Policy Type", key: "policyTypeStructure", example: "Comprehensive" },
  { header: "Policy Number", key: "policyNumber", example: "POL-000123" },
  { header: "Previous Policy No", key: "previousPolicyNo", example: "" },
  { header: "Insurance Company", key: "insurer", example: "Tata AIG General Insurance Company Limited" },
  { header: "Policy Remark", key: "policyRemark", example: "Policy Received" },
  { header: "Risk Start Date", key: "startDate", example: "2026-07-05" },
  { header: "Risk End Date", key: "endDate", example: "2027-07-04" },
  { header: "Branch Name", key: "branchName", example: "Zirakpur" },
  { header: "Reporting Manager", key: "reportingManagerName", example: "" },
  { header: "POSP Partner", key: "pospPartner", example: "Direct Policy (No POSP Partner)" },
  { header: "Medium of Issuance", key: "mediumOfIssuance", example: "Offline" },
  { header: "Remarks", key: "additionalRemarks", example: "" },
  { header: "Status", key: "status", example: "Active" },
  { header: "Premium Amount", key: "premium", example: "5000" },
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
  { header: "Model Items Covered", key: "itemsCovered", example: "" },
  { header: "Registration Number", key: "registrationNumber", example: "" },
  { header: "NCB Applicable", key: "ncbApplicable", example: "" },
];
