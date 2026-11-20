// ============ src/lib/sbiGcv/constants.ts ============
// SBI General — GCV (Goods Carrying Vehicle) product constants.
// Source: SBI's GCV integration kit (GCV_Policy_Model_V_1.69_28.07.2025.xlsx,
// SBIGIC-APIM-UAT-CMVGC01-Payloaddetails.xlsx, Master data/CMVGC01/*.xls) —
// confirmed live against UAT on 2026-11-20 (QuickQuote + FullQuote succeed).

export const SBI_GCV_PRODUCT_CODE = "CMVGC01";
export const SBI_GCV_AGREEMENT_CODE = "6660";

// Endpoints (same host/token/client-id as SBI 4W — see src/lib/sbiToken.ts).
// The payload sheet lists ".../quickquote/CMVGC01", but the plain
// ".../quickquote" (what 4W uses) reaches the same GCV rules — confirmed live.
export const SBI_GCV_PATHS = {
  quickQuote: "/cld/v1/quickquote",
  fullQuote: "/cld/v1/fullquote",
  issuance: "/cld/v1/issurance", // SBI's own spelling
  pdf: "/ept/getPDFArgCd", // AES-GCM encrypted, like 4W
};

// ---------- Coverages (Policy Model "Product" sheet) ----------
export const GCV_COVER = {
  OWN_DAMAGE: "C101064",
  THIRD_PARTY: "C101065",
  PA_COVER: "C101066",
  RETURN_TO_INVOICE: "C101067",
  NCB_PROTECTION: "C101068",
  ROADSIDE_ACCIDENT: "C101069",
  ENHANCED_PA: "C101070",
  HOSPITAL_CASH: "C101071",
  DEPRECIATION_REIMBURSEMENT: "C101072",
  LOSS_OF_INCOME: "C101078",
  EMI_PROTECTOR: "C101109",
} as const;

export const GCV_BENEFIT = {
  OD_BASIC: "B00002",
  NON_ELECTRICAL_ACC: "B00003",
  ELECTRICAL_ACC: "B00004",
  CNG_KIT_OD: "B00005",
  INBUILT_CNG_OD: "B00006",
  TRAILER_OD: "B00007",
  TP_BODILY_INJURY: "B00008",
  TP_PROPERTY_DAMAGE: "B00009",
  CNG_KIT_TP: "B00010",
  TRAILER_TP: "B00011",
  LL_EMPLOYEES: "B00012",
  LL_PAID_DRIVER: "B00013",
  PA_OWNER_DRIVER: "B00015",
  LL_CLEANER_CONDUCTOR: "B00069",
  LL_WORKMEN: "B00070",
  LL_NFPP: "B00071",
} as const;

export const GCV_COVER_LABELS: Record<string, string> = {
  C101064: "Own Damage",
  C101065: "Third Party Liability",
  C101066: "PA Cover - Owner Driver",
  C101067: "Return to Invoice",
  C101068: "NCB Protection",
  C101069: "Roadside Accident Cover",
  C101070: "Enhanced PA Cover",
  C101071: "Hospital Cash",
  C101072: "Depreciation Reimbursement",
  C101078: "Loss of Income",
  C101109: "EMI Protector",
};

// TPPD sum insured — rule AllMotor_TPPD_Ben_Autopopulate allows 6000 or 750000.
export const GCV_TPPD_SUM_INSURED = 750000;
// PA owner-driver sum insured (as in every SBI sample).
export const GCV_PA_OWNER_SUM_INSURED = 1500000;

// ---------- Code tables ----------
// PolicyType: the "PolicyType&Pediod" sheet and every sample (PolicyType "1"
// sent WITH an OD cover) say 1 = Package, 2 = Liability Only. The raw
// SBI_T_POLICYTYPE export lists them the other way round — the samples win,
// because UAT accepted "1" + OD cover as a package policy.
export const GCV_POLICY_TYPE = { PACKAGE: "1", LIABILITY_ONLY: "2" } as const;

// SBI_T_SUBCLAVEHICALGCV. Private carriers are blocked by SBI
// (GCV_3Wheeler_PrivateCarrier_Decline_rule, B9242) — only public carriers
// can be issued.
export const GCV_SUBCLASS = {
  THREE_WHEELER_PUBLIC: "17",
  THREE_WHEELER_PRIVATE: "18",
  ABOVE_3W_PUBLIC: "19",
  ABOVE_3W_PRIVATE: "20",
} as const;

// SBI_T_TYPE_OF_PERMIT
export const GCV_PERMIT = { LOCAL: "1", STATE: "2", INTERSTATE: "3", NATIONAL: "4" } as const;
// SBI_T_TYPEOFGOODSCARRIED
export const GCV_GOODS = { HAZARDOUS: "1", NON_HAZARDOUS: "2" } as const;
// SBI_T_AVERAGE_MONTHLY (km)
export const GCV_MONTHLY_USE = { UPTO_500: "1", "500_2500": "2", "2501_5000": "3", ABOVE_5000: "4" } as const;
// SBI_T_TRAILERTYPE
export const GCV_TRAILER_TYPE = { AGRICULTURAL: "1", NON_AGRICULTURAL: "2" } as const;
// SBI_T_NewBizClassification
export const GCV_BIZ_CLASS = { NEW: "1", ROLLOVER: "2" } as const;
// SBI_T_Kindofpolicy (previous policy)
export const GCV_PREV_KIND = { COMPREHENSIVE: "1", LIABILITY_ONLY: "2" } as const;
// SBI_T_NCBSLAB — NCB value must be one of these fractions (rule B9357).
export const GCV_NCB_VALUES = [0, 0.2, 0.25, 0.35, 0.45, 0.5];

// SBI_T_RELATIONSHIP_PROPOSER (nominee / driver relationship)
export const GCV_RELATIONSHIP: Record<string, string> = {
  SELF: "1",
  HUSBAND: "2",
  WIFE: "3",
  SPOUSE: "3",
  SON: "4",
  DAUGHTER: "5",
  FATHER: "6",
  MOTHER: "7",
  "FATHER IN LAW": "8",
  "MOTHER IN LAW": "9",
  COUSIN: "10",
  FRIEND: "11",
  "EMPLOYED DRIVER": "12",
  EMPLOYEE: "13",
  SISTER: "14",
  "SISTER IN LAW": "15",
  UNCLE: "16",
  AUNTY: "17",
  BROTHER: "20", // no "Brother" row — "Other close relations"
  OTHERS: "19",
};

// SBI_T_DRIVINGEXPERIENCE
export function drivingExperienceCode(years: number): string {
  if (years < 1) return "1";
  if (years < 3) return "2";
  if (years < 5) return "3";
  if (years < 10) return "4";
  if (years < 15) return "5";
  return "6";
}

// SBI_T_FUEL_TYPE
export function fuelTypeCode(fuel: string): string {
  const f = String(fuel || "").toUpperCase();
  if (f.includes("CNG")) return f.includes("EXT") ? "8" : "3";
  if (f.includes("LPG")) return f.includes("EXT") ? "9" : "4";
  if (f.includes("DIESEL")) return "2";
  if (f.includes("PETROL")) return "1";
  if (f.includes("HYBRID")) return "5";
  if (f.includes("BATTERY") || f.includes("ELECTRIC") || f === "EV") return "7";
  return "2";
}
