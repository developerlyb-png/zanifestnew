export const TRANSACTION_TYPES = ["Fresh", "Rollover", "Endorsement"];

// Line of Business options, cascaded from the selected Transaction Type.
export const LINES_OF_BUSINESS = ["Motor", "Health"];

// Product options, cascaded from the selected Line of Business.
export const PRODUCTS_BY_LOB: Record<string, string[]> = {
  Motor: ["2 Wheeler", "4 Wheeler", "Commercial"],
  Health: ["Health Insurance"],
};

export const VEHICLE_TYPES = ["New", "Old"];

export const FUEL_TYPES = ["Petrol", "Diesel", "CNG", "Electric"];

export const NCB_OPTIONS = ["0%", "20%", "25%", "35%", "45%", "50%"];

export const POLICY_TYPES = [
  "Comprehensive",
  "Third Party",
  "Individual",
  "Standalone",
  "Single Trip",
  "Structure Content",
  "Pure/ROP",
  "Maturity",
  "Periodic Benefits",
  "Linked Investment",
  "Immediate/Deferred",
  "Child/Maturity",
  "Group/Corporate",
  "Group",
  "Single",
  "Floater",
];

export const INSURANCE_COMPANIES = [
  "Tata AIG General Insurance Company Limited",
  "HDFC ERGO General Insurance Company Limited",
  "ICICI Lombard General Insurance Company Limited",
  "Bajaj Allianz General Insurance Company Limited",
  "SBI General Insurance Company Limited",
  "Reliance General Insurance Company Limited",
  "Oriental Insurance Company Limited",
  "National Insurance Company Limited",
  "New India Assurance Company Limited",
  "United India Insurance Company Limited",
  "Go Digit General Insurance Limited",
  "Future Generali India Insurance Company Limited",
  "Cholamandalam MS General Insurance Company Limited",
  "Royal Sundaram General Insurance Company Limited",
  "Universal Sompo General Insurance Company Limited",
  "Star Health and Allied Insurance Company Limited",
  "Care Health Insurance Limited",
  "Niva Bupa Health Insurance Company Limited",
  "Zuno General Insurance Limited",
  "Other",
];

export const POLICY_REMARKS = [
  "Policy Received",
  "Policy Pending",
  "Endorsement Received",
  "Endorsement Pending",
];

export const MEDIUM_OF_ISSUANCE = ["Online", "Offline"];

export const MODE_OF_PAYMENT = ["Cash", "Cheque", "NEFT/RTGS", "UPI", "Card", "Online"];

export const REWARD_STATUS = ["Pending", "Received", "Not Applicable"];

export const BRANCH_NAMES = ["Zirakpur", "Other"];

export const PREMIUM_ROW_LABELS = ["Basic Premium", "OD", "TP", "Terrorism", "Add On"];

export const KYC_DOCUMENT_TYPES = ["PAN Card", "Aadhaar Card", "Passport", "Voter ID", "Driving Licence", "Other"];
