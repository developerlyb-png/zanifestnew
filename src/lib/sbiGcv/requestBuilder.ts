// ============ src/lib/sbiGcv/requestBuilder.ts ============
// Builds SBI GCV (CMVGC01) QuickQuote / FullQuote / Issuance request bodies
// and normalises their responses.
//
// Field rules below were each confirmed against SBI UAT on 2026-11-20 —
// the docs alone were wrong or ambiguous on several of them:
//   - FullQuote validates IsNewVehicle against SBI_T_YesNo ("1"/"0"), NOT
//     SBI_T_PURCHASED_NEW_OR_USED ("1"/"2") as the field sheet suggests.
//   - RegistrationNo is mandatory for used vehicles (B2240); "NEW" for new.
//   - Rollover needs previous-policy start/end dates (B9311) and the full
//     PYP block on FullQuote (B9341/B9308).
//   - Rollover FullQuote checks the reg number against IIB (B2000 "IIB Data
//     Not Found", B9417 fuel mismatch) — a real reg number is required.
//   - New vehicle: RegistrationDate must not be before the risk start date
//     (UW U8114), so both are set to the same day.
//   - NCB is applied ONLY via PolicyRisk.NCBCarryForward (0.2..0.5); NCB and
//     NCBPrePolicy are ignored by the rating engine. Omit it when 0 (B9357).
//   - Only RTOLocationID is needed — SBI fills cluster/district/zone itself.
//   - Issuance requires a valid CKYC ("CKYCVerificationFailed / No Valid CKYC").

import {
  SBI_GCV_PRODUCT_CODE,
  SBI_GCV_AGREEMENT_CODE,
  GCV_COVER,
  GCV_BENEFIT,
  GCV_POLICY_TYPE,
  GCV_SUBCLASS,
  GCV_PERMIT,
  GCV_GOODS,
  GCV_MONTHLY_USE,
  GCV_TRAILER_TYPE,
  GCV_BIZ_CLASS,
  GCV_PREV_KIND,
  GCV_NCB_VALUES,
  GCV_RELATIONSHIP,
  GCV_TPPD_SUM_INSURED,
  GCV_PA_OWNER_SUM_INSURED,
  GCV_COVER_LABELS,
  drivingExperienceCode,
} from "./constants";
import {
  matchVehicle,
  matchRto,
  matchInsurer,
  lookupPincode,
  GcvVehicleMatch,
  GcvRtoLocation,
} from "./masterMatch";

// ---------------------------------------------------------------- types
export interface GcvQuoteInput {
  // Vehicle (free text from RC / CV journey, or explicit SBI variantId)
  make?: string;
  model?: string;
  variant?: string;
  variantId?: string;
  grossWeight?: number | string;
  fuelType?: string;
  seatingCapacity?: number | string;

  registrationNumber?: string; // "MH01AB1234"; omit/"NEW" for a new vehicle
  isNewVehicle?: boolean;
  registrationDate?: string; // YYYY-MM-DD (or DD-MM-YYYY / DD/MM/YYYY)
  manufactureYear?: number | string;
  rtoCode?: string; // "MH-01" — falls back to the reg number's prefix
  rtoPlaceName?: string; // RC "registered at", used if the code doesn't map

  chassisNumber?: string;
  engineNumber?: string;

  policyType?: "package" | "liability";
  subClass?: string; // SBI_T_SUBCLAVEHICALGCV — derived from wheels if omitted
  permitType?: string; // free text ("National Permit") or SBI code
  hazardousGoods?: boolean;
  monthlyUseKm?: number;
  paidDriverCount?: number;
  cleanerCount?: number; // Cleaner/Conductor/Coolie
  idv?: number; // user-chosen IDV; 0/omitted = SBI's suggested IDV

  previousPolicy?: {
    insurerName?: string;
    policyNumber?: string;
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    isComprehensive?: boolean; // default true
    claimMade?: boolean;
    previousNcb?: number; // 0, 0.2, 0.25 ... — entitled NCB is the next slab
  };
}

export interface GcvCustomer {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string; // "M"/"F"/"Male"/"Female"
  dob: string; // YYYY-MM-DD
  mobile: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  pincode: string;
  gstin?: string;
}

// The six CKYC tags SBI wants verbatim on the proposer (FullQuote) and the
// same values again on Issuance — produced by /api/sbi/ckyc/* (shared with 4W).
export interface GcvCkycTags {
  CKYCVerified?: string;
  KYCCKYCNo?: string;
  DOCTypeId?: string;
  DOCTypeName?: string;
  CKYCUniqueId?: string;
  CKYCSourceType?: string;
}

export interface GcvCkycRecord {
  fullName?: string;
  dob?: string;
  gender?: string;
  email?: string;
  mobile?: string;
  correspondenceAddress?: { line1?: string; line2?: string; pincode?: string; state?: string };
}

export interface GcvNominee {
  name: string;
  dob: string; // YYYY-MM-DD
  relationship: string; // "Father", "Wife", ...
  appointeeName?: string;
  appointeeRelationship?: string;
}

export interface GcvDriver {
  name: string;
  dob: string;
  licenseNumber: string;
  experienceYears?: number;
  gender?: string;
  relationship?: string; // to proposer, default "Self"
}

export class GcvInputError extends Error {}

// ---------------------------------------------------------------- dates
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export function toIsoDate(input?: string): string {
  const s = String(input || "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[-/.](\d{1,2}|[A-Za-z]{3})[-/.](\d{4})/);
  if (m) {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const mon = /\d/.test(m[2]) ? Number(m[2]) : months.indexOf(m[2].toUpperCase()) + 1;
    return `${m[3]}-${pad(mon)}-${pad(Number(m[1]))}`;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : ymd(d);
}

const parseYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function sbiTransactionTimestamp(now = new Date()) {
  const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  return `${pad(ist.getUTCDate())}-${M[ist.getUTCMonth()]}-${ist.getUTCFullYear()}-${pad(
    ist.getUTCHours()
  )}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())}`;
}

// SBI rejects non-numeric requestIDs ("requestID, is not valid").
export function sbiRequestHeader(action: string) {
  return {
    requestID: String(Date.now()).slice(-9),
    action,
    channel: "SBIG",
    transactionTimestamp: sbiTransactionTimestamp(),
  };
}

// Policy period: rollover starts the day after the old policy ends (or
// tomorrow if it already lapsed); a new vehicle starts on its registration
// day (tomorrow at the earliest).
function policyPeriod(input: GcvQuoteInput) {
  const tomorrow = addDays(new Date(), 1);
  tomorrow.setHours(0, 0, 0, 0);
  let start = tomorrow;
  if (!input.isNewVehicle && input.previousPolicy?.endDate) {
    const prevEnd = parseYmd(toIsoDate(input.previousPolicy.endDate));
    const next = addDays(prevEnd, 1);
    if (next > start) start = next;
  }
  if (input.isNewVehicle && input.registrationDate) {
    const reg = parseYmd(toIsoDate(input.registrationDate));
    if (reg > start) start = reg;
  }
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  const expiry = addDays(end, -1);
  return {
    start,
    effective: `${ymd(start)}T00:00:00`,
    expiry: `${ymd(expiry)}T23:59:59`,
  };
}

// ---------------------------------------------------------------- mapping
function permitCode(p?: string): string {
  const s = String(p || "").toUpperCase();
  if (/^[1-4]$/.test(s)) return s;
  if (s.includes("NATIONAL") || s.includes("ALL INDIA")) return GCV_PERMIT.NATIONAL;
  if (s.includes("INTER")) return GCV_PERMIT.INTERSTATE;
  if (s.includes("STATE")) return GCV_PERMIT.STATE;
  return GCV_PERMIT.LOCAL;
}

function monthlyUseCode(km?: number): string {
  if (!km || km <= 500) return GCV_MONTHLY_USE.UPTO_500;
  if (km <= 2500) return GCV_MONTHLY_USE["500_2500"];
  if (km <= 5000) return GCV_MONTHLY_USE["2501_5000"];
  return GCV_MONTHLY_USE.ABOVE_5000;
}

// NCB slab entitled this year = one step up from last year's, if no claim.
export function entitledNcb(prev?: { claimMade?: boolean; previousNcb?: number; isComprehensive?: boolean }) {
  if (!prev || prev.claimMade || prev.isComprehensive === false) return 0;
  // Unknown previous NCB => claim nothing rather than guess a slab.
  if (prev.previousNcb == null || (prev.previousNcb as any) === "") return 0;
  const ladder = GCV_NCB_VALUES; // [0, .2, .25, .35, .45, .5]
  const p = Number(prev.previousNcb);
  const idx = ladder.findIndex((v) => Math.abs(v - p) < 1e-6);
  if (idx < 0) return 0;
  return ladder[Math.min(idx + 1, ladder.length - 1)];
}

function relationshipCode(r?: string): string {
  const k = String(r || "").trim().toUpperCase();
  return GCV_RELATIONSHIP[k] || GCV_RELATIONSHIP.OTHERS;
}

function ageOn(dob: string, on = new Date()): number {
  const d = parseYmd(toIsoDate(dob));
  let age = on.getFullYear() - d.getFullYear();
  if (on.getMonth() < d.getMonth() || (on.getMonth() === d.getMonth() && on.getDate() < d.getDate())) age--;
  return age;
}

// ---------------------------------------------------------------- resolve
export interface GcvResolved {
  vehicle: GcvVehicleMatch;
  rto: GcvRtoLocation;
  isNew: boolean;
  regNo: string;
  registrationDate: string; // YYYY-MM-DD
  manufactureYear: string;
  subClass: string;
  policyType: string;
  period: ReturnType<typeof policyPeriod>;
}

export function resolveGcvInput(input: GcvQuoteInput): GcvResolved {
  const regRaw = String(input.registrationNumber || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const isNew = !!input.isNewVehicle || !regRaw || regRaw === "NEW";

  const vehicle = matchVehicle({
    make: input.make,
    model: input.model,
    variant: input.variant,
    variantId: input.variantId,
    gvw: input.grossWeight,
    fuel: input.fuelType,
    seating: input.seatingCapacity,
  });
  if (!vehicle) {
    throw new GcvInputError(
      `SBI has no matching goods vehicle for "${[input.make, input.model, input.variant].filter(Boolean).join(" ")}"`
    );
  }

  const rto = matchRto(input.rtoCode || regRaw, input.rtoPlaceName);
  if (!rto) {
    throw new GcvInputError(
      `Could not map RTO "${input.rtoCode || regRaw.slice(0, 4)}" to SBI's RTO master`
    );
  }

  const period = policyPeriod({ ...input, isNewVehicle: isNew });
  const registrationDate = isNew
    ? ymd(period.start) // must not precede risk start (UW U8114)
    : toIsoDate(input.registrationDate);
  if (!registrationDate) throw new GcvInputError("registrationDate is required for a used vehicle");

  const manufactureYear = String(
    input.manufactureYear || (isNew ? period.start.getFullYear() : registrationDate.slice(0, 4))
  );

  const subClass =
    input.subClass ||
    (vehicle.variant.wheels === 3 ? GCV_SUBCLASS.THREE_WHEELER_PUBLIC : GCV_SUBCLASS.ABOVE_3W_PUBLIC);

  return {
    vehicle,
    rto,
    isNew,
    regNo: isNew ? "NEW" : regRaw,
    registrationDate,
    manufactureYear,
    subClass,
    policyType: input.policyType === "liability" ? GCV_POLICY_TYPE.LIABILITY_ONLY : GCV_POLICY_TYPE.PACKAGE,
    period,
  };
}

// ---------------------------------------------------------------- bodies
function buildCoverages(r: GcvResolved, nominee?: GcvNominee) {
  const { effective, expiry } = r.period;
  const covers: any[] = [];

  // OD only for package policies ("0 yr means the OD covers should be
  // deleted from json" — PolicyType&Pediod sheet).
  if (r.policyType === GCV_POLICY_TYPE.PACKAGE) {
    covers.push({
      ProductElementCode: GCV_COVER.OWN_DAMAGE,
      EffectiveDate: effective,
      ExpiryDate: expiry,
      PolicyBenefitList: [{ ProductElementCode: GCV_BENEFIT.OD_BASIC }],
    });
  }

  covers.push({
    ProductElementCode: GCV_COVER.THIRD_PARTY,
    EffectiveDate: effective,
    ExpiryDate: expiry,
    PolicyBenefitList: [
      { ProductElementCode: GCV_BENEFIT.TP_BODILY_INJURY },
      { ProductElementCode: GCV_BENEFIT.TP_PROPERTY_DAMAGE, SumInsured: GCV_TPPD_SUM_INSURED },
    ],
  });

  // PA owner-driver: nominee is mandatory once the cover is present (B2241).
  // QuickQuote has no nominee yet, so a neutral placeholder prices it; the
  // real nominee replaces it on FullQuote.
  const nomineeDob = nominee ? toIsoDate(nominee.dob) : "1990-01-01";
  const nomineeAge = ageOn(nomineeDob);
  covers.push({
    ProductElementCode: GCV_COVER.PA_COVER,
    EffectiveDate: effective,
    ExpiryDate: expiry,
    PolicyBenefitList: [
      {
        ProductElementCode: GCV_BENEFIT.PA_OWNER_DRIVER,
        SumInsured: GCV_PA_OWNER_SUM_INSURED,
        NomineeName: nominee?.name || "NOMINEE",
        NomineeRelToProposer: relationshipCode(nominee?.relationship || "Others"),
        NomineeDOB: nomineeDob,
        NomineeAge: String(nomineeAge),
        AppointeeName: nomineeAge < 18 ? nominee?.appointeeName || "" : "",
        AppointeeRelToNominee:
          nomineeAge < 18 ? relationshipCode(nominee?.appointeeRelationship || "Others") : "",
        IfAnyONRPleaseSpecify: "",
      },
    ],
  });
  return covers;
}

function buildRisk(input: GcvQuoteInput, r: GcvResolved, nominee?: GcvNominee) {
  const { vehicle, rto } = r;
  const ncb = r.isNew ? 0 : entitledNcb(input.previousPolicy);
  const risk: Record<string, any> = {
    ProductElementCode: "R10005",
    GCVVehicleSubClass: r.subClass,
    VehicleMake: vehicle.make.id,
    VehicleModel: vehicle.model.id,
    Variant: vehicle.variant.id,
    ManufactureYear: r.manufactureYear,
    RegistrationDate: `${r.registrationDate}T00:00:00`,
    RegistrationNo: r.regNo,
    ChassisNo: String(input.chassisNumber || "").toUpperCase(),
    EngineNo: String(input.engineNumber || "").toUpperCase(),
    IsNewVehicle: r.isNew ? "1" : "0", // SBI_T_YesNo (see header note)
    RTOLocationID: rto.locId,
    MonthlyUseDistance: monthlyUseCode(input.monthlyUseKm),
    TypeOfGoodsCarried: input.hazardousGoods ? GCV_GOODS.HAZARDOUS : GCV_GOODS.NON_HAZARDOUS,
    TypeOfPermit: permitCode(input.permitType),
    IDV_User: Math.round(Number(input.idv) || 0),
    IsNCB: "0", // "Transfer of NCB" from another vehicle — not offered
    NCB: 0,
    Last3YrDriverClaimPresent: input.previousPolicy?.claimMade ? "1" : "0",
    PaidDriverCount: Number(input.paidDriverCount || 0),
    CountCCC: String(Number(input.cleanerCount || 0)),
    EmployeeCount: 0,
    WorkmenCount: 0,
    NFPPCount: 0,
    TrailerCount: 0,
    TrailerType: GCV_TRAILER_TYPE.NON_AGRICULTURAL,
    AntiTheftAlarmSystem: "0",
    IMT34: "0",
    IMT23: "0",
    IsConfinedOwnPremises: "0",
    IsDrivingTuitionsUse: "0",
    IsGeographicalExtension: "0",
    GeoExtnBangladesh: "0",
    GeoExtnBhutan: "0",
    GeoExtnMaldives: "0",
    GeoExtnNepal: "0",
    GeoExtnPakistan: "0",
    GeoExtnSriLanka: "0",
    AdditionalTowingCharges: 0,
    VoluntaryDeductible: 0,
    VehicleBodyPrice: 0,
    IsFGFT: "0",
    BodyType: "",
    FNType: "",
    FNName: "",
    FNBranchName: "",
    SiteAddress: "",
    PolicyCoverageList: buildCoverages(r, nominee),
  };
  if (ncb > 0) risk.NCBCarryForward = ncb; // the only NCB field SBI rates on
  return risk;
}

function previousPolicyFields(input: GcvQuoteInput, r: GcvResolved) {
  const p = input.previousPolicy;
  if (r.isNew || !p?.endDate) {
    return {
      HasPrePolicy: "0",
      KindofPolicy: "",
      LossNature: "",
      PreInsuranceComName: "",
      PreInsuranceComAddr: "",
      PrePolicyNo: "",
      PrePolicyStartDate: "",
      PrePolicyEndDate: "",
    };
  }
  const end = toIsoDate(p.endDate);
  const start =
    toIsoDate(p.startDate) || ymd(addDays(new Date(parseYmd(end).setFullYear(parseYmd(end).getFullYear() - 1)), 1));
  return {
    HasPrePolicy: "1",
    KindofPolicy: p.isComprehensive === false ? GCV_PREV_KIND.LIABILITY_ONLY : GCV_PREV_KIND.COMPREHENSIVE,
    LossNature: "",
    PreInsuranceComName: (p.insurerName && matchInsurer(p.insurerName)?.id) || "",
    PreInsuranceComAddr: p.insurerName ? "INDIA" : "",
    PrePolicyNo: p.policyNumber || "",
    PrePolicyStartDate: `${start}T00:00:00`,
    PrePolicyEndDate: `${end}T23:59:59`,
  };
}

export function buildGcvQuickQuoteBody(input: GcvQuoteInput) {
  const r = resolveGcvInput(input);
  const body = {
    EffectiveDate: r.period.effective,
    ExpiryDate: r.period.expiry,
    ProposalDate: ymd(new Date()),
    NewBizClassification: r.isNew ? GCV_BIZ_CLASS.NEW : GCV_BIZ_CLASS.ROLLOVER,
    ...previousPolicyFields(input, r),
    PolicyCustomerList: [{ GSTRegistrationNum: "", State: r.rto.state }],
    PolicyLobList: [
      {
        PolicyRiskList: [buildRisk(input, r)],
        ProductCode: SBI_GCV_PRODUCT_CODE,
        PolicyType: r.policyType,
      },
    ],
    ProductCode: SBI_GCV_PRODUCT_CODE,
    ProductVersion: "1.0",
    SBIGBranchStateCode: r.rto.state,
  };
  return { body, resolved: r };
}

export function buildGcvFullQuoteBody(params: {
  input: GcvQuoteInput;
  customer: Partial<GcvCustomer>;
  ckycTags?: GcvCkycTags;
  ckycRecord?: GcvCkycRecord | null;
  nominee: GcvNominee;
  driver?: GcvDriver;
}) {
  const { input, customer, ckycTags, ckycRecord, nominee, driver } = params;
  const r = resolveGcvInput(input);

  // A verified CKYC record is the source of truth for identity (CKYC doc:
  // "demographic details ... need to pass in the full quote API").
  const nameFromCkyc = ckycRecord?.fullName?.trim().split(/\s+/) || [];
  const firstName = nameFromCkyc.length ? nameFromCkyc[0] : customer.firstName || "";
  const lastName = nameFromCkyc.length > 1 ? nameFromCkyc[nameFromCkyc.length - 1] : customer.lastName || "";
  const middleName =
    nameFromCkyc.length > 2 ? nameFromCkyc.slice(1, -1).join(" ") : customer.middleName || "";
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ").toUpperCase();
  const dob = toIsoDate(ckycRecord?.dob || customer.dob);
  const gender = String(ckycRecord?.gender || customer.gender || "M").toUpperCase().startsWith("F") ? "F" : "M";
  const addr = ckycRecord?.correspondenceAddress;
  const line1 = addr?.line1 || customer.addressLine1 || "";
  const line2 = addr?.line2 || customer.addressLine2 || "";
  const pincode = addr?.pincode || customer.pincode || "";

  const pin = lookupPincode(pincode);
  if (!pin) throw new GcvInputError(`Pincode ${pincode || "(empty)"} is not in SBI's pincode master`);

  const drv: GcvDriver = driver || {
    name: fullName,
    dob,
    licenseNumber: "",
    relationship: "Self",
    gender,
  };

  const body = {
    AgreementCode: SBI_GCV_AGREEMENT_CODE,
    AgentType: "",
    POSPAgentTypeId: "",
    EffectiveDate: r.period.effective,
    ExpiryDate: r.period.expiry,
    ProposalDate: ymd(new Date()),
    QuoteValidTo: "",
    NewBizClassification: r.isNew ? GCV_BIZ_CLASS.NEW : GCV_BIZ_CLASS.ROLLOVER,
    ...previousPolicyFields(input, r),
    // No physical inspection happens in this journey — "Inspection Waived
    // Off" (SBI_T_InspectionBy 2), same as the working 4W integration.
    InspectionDoneBy: "2",
    InspectionLeadNo: "",
    InspectionComment: "",
    PolicyCustomerList: [
      {
        // Only Title code SBI has confirmed (all samples + 4W use it).
        Title: "9000000001",
        FirstName: firstName.toUpperCase(),
        MiddleName: middleName.toUpperCase(),
        LastName: lastName.toUpperCase(),
        CustomerName: fullName,
        RegistrationName: fullName,
        DateOfBirth: dob,
        DateOfIncorporation: "",
        GenderCode: gender,
        Mobile: ckycRecord?.mobile || customer.mobile || "",
        ContactEmail: ckycRecord?.email || customer.email || "",
        ContactPersonTel: "",
        PreferredContactMode: "",
        BuildingHouseName: line1,
        StreetName: line2 || line1, // StreetName is mandatory
        PlotNo: "",
        Locality: "1",
        PostCode: pincode,
        City: pin.cityCode,
        District: pin.districtCode,
        State: pin.stateCode,
        CountryCode: "1000000108",
        NationalityCode: "IND",
        OccupationCode: "",
        GSTRegistrationNum: customer.gstin || "",
        IsInsured: "N",
        IsOrgParty: "N",
        IsPolicyHolder: "Y",
        CKYCVerified: ckycTags?.CKYCVerified ?? "N",
        KYCCKYCNo: ckycTags?.KYCCKYCNo ?? "",
        DOCTypeId: ckycTags?.DOCTypeId ?? "",
        DOCTypeName: ckycTags?.DOCTypeName ?? "",
        CKYCUniqueId: ckycTags?.CKYCUniqueId ?? "",
        CKYCSourceType: ckycTags?.CKYCSourceType ?? "ZANIFEST",
      },
    ],
    PolicyLobList: [
      {
        PolicyRiskList: [buildRisk(input, r, nominee)],
        // Driver details are mandatory (SBI_M_DRIVER_DTLS_MANDATE, B9257);
        // age must be 18-75 (B0607/B0608).
        PersonList: [
          {
            DriverName: drv.name.toUpperCase(),
            DateOfBirth: toIsoDate(drv.dob),
            RelationshipwithProposer: relationshipCode(drv.relationship || "Self"),
            DriverExperience: drivingExperienceCode(Number(drv.experienceYears ?? 5)),
            DriverGender: String(drv.gender || gender).toUpperCase().startsWith("F") ? "2" : "1",
            DrivingLicenseNo: String(drv.licenseNumber || "").toUpperCase(),
          },
        ],
        ProductCode: SBI_GCV_PRODUCT_CODE,
        PolicyType: r.policyType,
      },
    ],
    PremiumCurrencyCode: "INR",
    PremiumLocalExchangeRate: 1,
    SiCurrencyCode: "INR",
    ProductCode: SBI_GCV_PRODUCT_CODE,
    ProductVersion: "1.0",
    SBIGBranchStateCode: pin.stateCode,
    SBIGBranchCode: "",
    TransactionInitiatedBy: "ZANIFEST",
  };
  return { body, resolved: r };
}

export function buildGcvIssuanceBody(p: {
  quotationNo: string;
  amount: number;
  payerName: string;
  paymentReferenceNo: string;
  ckycTags?: GcvCkycTags;
}) {
  const d = ymd(new Date());
  return {
    QuotationNo: p.quotationNo,
    Amount: p.amount,
    CurrencyId: 1,
    PayMode: 212, // online / gateway — same as SBI 4W
    FeeType: 11,
    Payer: p.payerName,
    TransactionDate: d,
    PaymentReferNo: p.paymentReferenceNo,
    InstrumentNumber: p.paymentReferenceNo,
    InstrumentDate: d,
    BankCode: "",
    BankName: "",
    BankBranchName: "",
    BankBranchCode: "",
    LocationType: "2",
    RemitBankAccount: "30",
    ReceiptCreatedBy: "",
    PickupDate: d,
    IFSCCode: "",
    MICRNumber: "",
    PANNumber: "",
    ReceiptBranch: "",
    ReceiptTransactionDate: d,
    ReceiptDate: d,
    EscalationDepartment: "",
    Comment: "",
    AccountNumber: "",
    AccountName: "",
    CKYCUniqueId: p.ckycTags?.CKYCUniqueId ?? "",
    CKYCVerified: p.ckycTags?.CKYCVerified ?? "N",
    KYCCKYCNo: p.ckycTags?.KYCCKYCNo ?? "",
    SourceType: "9",
  };
}

// ---------------------------------------------------------------- responses
// SBI answers validation failures with HTTP 200 + {code, message, messages[]}.
export function sbiErrorMessages(raw: any): string[] | null {
  if (!raw || typeof raw !== "object") return ["Empty response from SBI"];
  if (typeof raw.code === "string") {
    const list = (raw.messages || []).map((m: any) => m.message || m.code).filter(Boolean);
    return list.length ? list : [raw.message || raw.code];
  }
  if (raw.ValidateResult?.code) return [raw.ValidateResult.message || raw.ValidateResult.code];
  return null;
}

export function summariseGcvQuote(raw: any) {
  // QuickQuote is flat; FullQuote wraps the policy in PolicyObject.
  const p = raw?.PolicyObject ?? raw;
  const risk = p?.PolicyLobList?.[0]?.PolicyRiskList?.[0] || {};
  const covers = (risk.PolicyCoverageList || []).map((c: any) => ({
    code: c.ProductElementCode,
    label: GCV_COVER_LABELS[c.ProductElementCode] || c.ProductElementCode,
    premium: Number(c.BeforeVatPremium ?? c.AnnualPremium ?? 0),
  }));
  const gst = Number(p?.TGST ?? (p?.CGST || 0) + (p?.SGST || 0) + (p?.IGST || 0));
  return {
    quotationNo: p?.QuotationNo,
    policyId: p?.PolicyId,
    premium: Number(p?.DuePremium),
    netPremium: Number(p?.BeforeVatPremium),
    gst,
    odPremium: Number(risk.OD_TotalPremium ?? 0),
    tpPremium: Number(p?.TP_TotalPremium ?? risk.TP_BasePremium ?? 0),
    ncb: Number(risk.NCBCarryForward ?? risk.NCB ?? 0),
    idv: {
      selected: Number(risk.IDV_User ?? 0),
      suggested: Number(risk.IDV_Suggested ?? 0),
      min: Number(risk.MinIDV_Suggested ?? 0),
      max: Number(risk.MaxIDV_Suggested ?? 0),
    },
    vehicle: {
      gvw: risk.GrossVehicleWeight,
      seating: risk.SeatingCapacity,
      carrying: risk.CarryingCapacity,
      zone: risk.Zone,
      rto: risk.RTOLocation,
    },
    covers,
    effectiveDate: p?.EffectiveDate,
    expiryDate: p?.ExpiryDate,
    isPremiumCalcSuccess: p?.IsPremiumCalcSuccess === "Y",
  };
}
