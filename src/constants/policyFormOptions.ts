export const TRANSACTION_TYPES = ["New", "Rollover", "Endorsement", "Renewal", "Used"];

// Line of Business options, cascaded from the selected Business Type.
export const LINES_OF_BUSINESS = ["Motor", "Non Motor"];

// Product options, cascaded from the selected Line of Business.
export const PRODUCTS_BY_LOB: Record<string, string[]> = {
  Motor: ["Pvt Car", "2W", "GCV", "PCV", "3W", "Misc D", "Others"],
  "Non Motor": [
    "Health",
    "Travel",
    "PA",
    "GMC",
    "GPA",
    "Fire",
    "Marine",
    "Liability",
    "Home",
    "Pet Insurance",
    "WC",
    "Others",
  ],
};

export const VEHICLE_TYPES = ["New", "Old"];

export const FUEL_TYPES = ["Petrol", "Diesel", "CNG", "Electric"];

export const NCB_OPTIONS = ["0%", "20%", "25%", "35%", "45%", "50%"];

// Base Motor Make list — admins can add more from the form (persisted via /api/admin/motormakes).
export const MOTOR_MAKES = [
  "Maruti Suzuki",
  "Hyundai",
  "Tata Motors",
  "Mahindra",
  "Honda",
  "Toyota",
  "Kia",
  "Volkswagen",
  "Renault",
  "Ford",
  "Skoda",
  "Nissan",
  "MG Motor",
  "Hero MotoCorp",
  "Bajaj Auto",
  "TVS Motor",
  "Royal Enfield",
  "Yamaha",
  "Ashok Leyland",
  "Eicher",
  "Other",
];

// Case Type — Motor only.
export const CASE_TYPES = [
  "1+1 Cover",
  "1+3 Cover",
  "3+3 Cover",
  "1+5 Cover",
  "5+5 Cover",
  "Standalone",
  "Short Term",
  "Others",
];

// Policy Type options, cascaded from the selected Line of Business.
export const POLICY_TYPES_BY_LOB: Record<string, string[]> = {
  Motor: ["Comprehensive", "TP only", "SAOD"],
  "Non Motor": [
    "Family Health",
    "Critical Illness",
    "Top Up",
    "Single Transit",
    "Open Policy",
    "Structure only",
    "Structure+Contents",
    "Professional Indemnity",
    "Single Trip",
    "Multi Trip",
    "Others",
  ],
};

export const INSURANCE_COMPANIES = [
  "Tata AIG General Insurance Company Limited",
  "HDFC ERGO General Insurance Company Limited",
  "ICICI Lombard General Insurance Company Limited",
  "Bajaj Allianz General Insurance Company Limited",
  "SBI General Insurance Company Limited",
  "IndusInd General Insurance Limited",
  "Oriental Insurance Company Limited",
  "National Insurance Company Limited",
  "New India Assurance Company Limited",
  "United India Insurance Company Limited",
  "Go Digit General Insurance Limited",
  "Generali Central Insurance Limited",
  "Cholamandalam MS General Insurance Company Limited",
  "Royal Sundaram General Insurance Company Limited",
  "Universal Sompo General Insurance Company Limited",
  "Star Health and Allied Insurance Company Limited",
  "Care Health Insurance Limited",
  "Niva Bupa Health Insurance Company Limited",
  "Zuno General Insurance Limited",
  "Liberty General Insurance Limited",
  "Zurich Kotak General Insurance Limited",
  "Kiwi General Insurance Limited",
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

export const PREMIUM_ROW_LABELS = ["Net Premium", "OD", "TP", "Others", "Add On", "OD+Add on Premium"];

export const KYC_DOCUMENT_TYPES = ["PAN Card", "Aadhaar Card", "Passport", "Voter ID", "Driving Licence", "Other"];
