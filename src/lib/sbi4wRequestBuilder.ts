// ============ src/lib/sbi4wRequestBuilder.ts ============
// Builds SBI's actual QuickQuote RequestBody shape (confirmed from SBI's own
// integration-kit sample — PolicyCustomerList / PolicyLobList / PolicyRiskList /
// PolicyCoverageList / PolicyBenefitList, NOT the flat make/model/variant shape
// used for Zuno). Vehicle/RTO/City/District codes are matched against SBI's
// own official master-data tables (src/lib/sbi4wMasterMatch.ts) — any vehicle
// SBI has on file works, not just a single hardcoded test case. Any field
// that still can't be matched falls back to a literal "PLACEHOLDER_..."
// marker, detected by the caller so a quote priced against a fake code is
// never surfaced to customers.

import {
  matchMake,
  matchModel,
  matchVariant,
  matchRtoLocation,
  matchDistrict,
  matchCity,
} from "./sbi4wMasterMatch";

const pad = (n: number) => String(n).padStart(2, "0");

// Confirmed from SBI's own SBI_T_FuelType master table.
const FUEL_TYPE_CODES: Record<string, string> = {
  PETROL: "1",
  DIESEL: "2",
  CNG: "3",
  LPG: "4",
  HYBRID: "5",
  BATTERY: "7",
  ELECTRIC: "7",
};
function mapFuelTypeCode(fuel: string): string {
  const key = String(fuel || "").toUpperCase();
  for (const k of Object.keys(FUEL_TYPE_CODES)) {
    if (key.includes(k)) return FUEL_TYPE_CODES[k];
  }
  return "1"; // default Petrol — matches the overwhelming majority of 4W RC data
}

// Confirmed from SBI's own SBI_T_BodyStyle master table.
const BODY_STYLE_CODES: Record<string, string> = {
  HATCHBACK: "2",
  SEDAN: "5",
  SUV: "6",
  WAGON: "7",
  VAN: "8",
  PICKUP: "9",
  ROADSTER: "10",
  CAB: "11",
  CONVERTIBLE: "12",
  COUPE: "1",
};
function mapBodyStyleCode(bodyStyle: string): string {
  const key = String(bodyStyle || "").toUpperCase().replace(/[^A-Z]/g, "");
  return BODY_STYLE_CODES[key] || "2"; // default Hatchback — most common 4W body style
}

// dd-mm-yyyy or yyyy-mm-dd -> yyyy-mm-dd
function toIsoDate(d: string): string {
  const m1 = String(d || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  return d;
}

// Best-effort split of an RC owner name into First/Middle/Last
function splitName(fullName: string) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return {
    FirstName: parts[0] || "",
    MiddleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    LastName: parts.length > 1 ? parts[parts.length - 1] : "",
  };
}

// Base cover (Own Damage + IDV) / Third-Party / Personal Accident sections —
// mandatory parts of the bundled product, not optional add-ons a customer
// can deselect. Everything else in PolicyCoverageList is an optional addon.
export const BASE_COVERAGE_CODES = ["C101064", "C101065", "C101066"];

// The optional addon codes our template can request — a fixed catalog since
// we choose which coverage codes to send, not something SBI reports back.
export const ADDON_COVERAGE_CODES = [
  "C101069",
  "C101072",
  "C101073",
  "C101075",
  "C101108",
  "C101111",
];

// Shared vehicle/RTO/address master-data matching used by both QuickQuote
// and FullQuote — same vehicle must resolve to the same codes either way.
function matchVehicleAndLocation(quoteInput: any) {
  const rc = quoteInput?.rcRaw || {};
  const registrationNumber = String(
    quoteInput?.registrationNumber || rc.reg_no || ""
  ).toUpperCase();
  const stateCode2 = registrationNumber.slice(0, 2) || "MH";

  const vehicleCodes = (() => {
    const make = matchMake(quoteInput?.make);
    if (!make) return null;
    const model = matchModel(make.makeId, quoteInput?.model, quoteInput?.fuelType || rc.type);
    if (!model) return null;
    const variant = matchVariant(
      make.row.TAC_Code,
      model.modelId,
      quoteInput?.variant || quoteInput?.model,
      quoteInput?.fuelType || rc.type,
      rc.vehicle_cubic_capacity
    );
    if (!variant) return null;
    return { make: make.makeId, model: model.modelId, variant: variant.variantId };
  })();

  const rtoCodes = matchRtoLocation(rc.rto_code || registrationNumber.slice(0, 4));

  const addressStateAbbrev = rc?.split_present_address?.state?.[0]?.[1] || stateCode2;
  const districtCode = matchDistrict(
    addressStateAbbrev,
    rc?.split_present_address?.district?.[0] || ""
  );
  const cityCode = matchCity(
    addressStateAbbrev,
    rc?.split_present_address?.city?.[0] || ""
  );

  return { rc, registrationNumber, stateCode2, vehicleCodes, rtoCodes, addressStateAbbrev, districtCode, cityCode };
}

// The PolicyRiskList[0] object — identical shape needed by QuickQuote and
// FullQuote, so both build it through here rather than drifting apart.
function buildPolicyRisk(
  quoteInput: any,
  matched: ReturnType<typeof matchVehicleAndLocation>,
  effectiveDate: Date,
  expiryDate: Date,
  isoDateTime: (d: Date, endOfDay?: boolean) => string,
  idv: number,
  excludeAddonCodes: string[],
  nominee?: { name: string; dob: string; age: string }
) {
  const { rc, registrationNumber, stateCode2, vehicleCodes, rtoCodes, cityCode } = matched;
  const pincode = rc?.split_present_address?.pincode || "";
  const manufactureYear =
    (rc.vehicle_manufacturing_month_year || "").split("/")[1] ||
    toIsoDate(quoteInput?.registrationDate || "").slice(0, 4) ||
    String(new Date().getFullYear());
  const seatingCapacity = Number(rc.vehicle_seat_capacity || 5);
  const engineCapacity = Math.round(Number(rc.vehicle_cubic_capacity || 0)) || 1197;

  return {
    AAMemberExpiryDate: "",
    AAMemberNo: "",
    AntiTheftAlarmSystem: "0",
    BodyStyle: mapBodyStyleCode(quoteInput?.bodystyleDescription),
    BodyType: "1",
    CarryingCapacity: seatingCapacity,
    ChassisNo: quoteInput?.chassisNumber || rc.chassis || "",
    DailyUseDistance: "1",
    DayParkLoc: "1",
    DayParkLocPinCode: pincode,
    EmployeeCount: 1,
    EngineCapacity: engineCapacity,
    EngineNo: quoteInput?.engineNumber || rc.engine || "",
    FEVehicleRegNo: "",
    FNBranchName: "",
    FNName: "",
    FNType: "1",
    FuelType: mapFuelTypeCode(quoteInput?.fuelType || rc.type),
    GeoExtnBangladesh: "0",
    GeoExtnBhutan: "0",
    GeoExtnMaldives: "0",
    GeoExtnNepal: "0",
    GeoExtnPakistan: "0",
    GeoExtnSriLanka: "0",
    IsAAMember: "0",
    IsCertifiedVintageCar: "0",
    IsConfinedOwnPremises: "0",
    IsDrivingTuitionsUse: "0",
    IsFEVehicle: "0",
    IsFGFT: "0",
    IsGeographicalExtension: "0",
    IsHandicappedMod: "0",
    IsImportedWithoutDuty: "0",
    IsNCB: "0",
    IsNewVehicle: "0",
    LLSSACount: 0,
    LoanAccountNumber: "",
    ManufactureYear: manufactureYear,
    ModificationType: "1",
    NCB: 0,
    NCBLetterDate: "",
    NCBProof: "",
    NightParkLoc: "1",
    NightParkLocPinCode: pincode,
    PaidDriverCount: 1,
    IDV_User: idv,
    ProductElementCode: "R10005",
    RTOCityDistric: rtoCodes?.cityDistrict || "PLACEHOLDER_RTO_CITY_DISTRICT",
    RTOCluster: rtoCodes?.cluster || stateCode2,
    RTOLocation: quoteInput?.rtoLocationName || "",
    RTOLocationID: rtoCodes?.locationId || "PLACEHOLDER_RTO_LOCATION_ID",
    RTONameCode: stateCode2,
    RTORegion: rtoCodes?.region || "PLACEHOLDER_RTO_REGION",
    RegistrationDate: toIsoDate(quoteInput?.registrationDate || ""),
    RegistrationNo: registrationNumber,
    RoadType: "1",
    SeatingCapacity: seatingCapacity,
    TrailerCount: 0,
    Variant: vehicleCodes?.variant || "PLACEHOLDER_VARIANT_CODE",
    VehicleColor: "1",
    VehicleMake: vehicleCodes?.make || "PLACEHOLDER_MAKE_CODE",
    VehicleModel: vehicleCodes?.model || "PLACEHOLDER_MODEL_CODE",
    VehicleSegment: (quoteInput?.bodystyleDescription || "HATCHBACK").toUpperCase(),
    VehicleUsage: "1",
    VoluntaryDeductible: 0,
    WheelNum: 4,
    Zone: rtoCodes?.zone || `Zone ${quoteInput?.carZone || "B"}`,
    // Coverage/benefit template reused verbatim from SBI's own confirmed
    // working QuickQuote sample (fixed catalog codes) — only the IDV
    // benefit's SumInsured/Value is parameterized with our real IDV.
    PolicyCoverageList: [
      {
        ProductElementCode: "C101064",
        EffectiveDate: isoDateTime(effectiveDate),
        PolicyBenefitList: [
          { SumInsured: 20000, Description: "Description", ProductElementCode: "B00003" },
          { ProductElementCode: "B00002", SumInsured: idv, Value: idv },
          { SumInsured: 30000, Description: "Description", ProductElementCode: "B00004" },
        ],
        ExpiryDate: isoDateTime(expiryDate, true),
      },
      {
        EffectiveDate: isoDateTime(effectiveDate),
        PolicyBenefitList: [
          { ProductElementCode: "B00012" },
          { ProductElementCode: "B00013" },
          { SumInsured: 6000, ProductElementCode: "B00009" },
          { ProductElementCode: "B00008" },
        ],
        ExpiryDate: isoDateTime(expiryDate, true),
        ProductElementCode: "C101065",
      },
      {
        EffectiveDate: isoDateTime(effectiveDate),
        PolicyBenefitList: [
          { SumInsuredPerUnit: 200000, TotalSumInsured: 200000, ProductElementCode: "B00027" },
          { SumInsuredPerUnit: 200000, TotalSumInsured: 200000, ProductElementCode: "B00016" },
          {
            SumInsured: 1500000,
            ProductElementCode: "B00015",
            NomineeName: nominee?.name || "",
            // Relation-to-code mapping isn't confirmed beyond this default —
            // every real captured sample uses "1" regardless of actual relation.
            NomineeRelToProposer: "1",
            NomineeDOB: nominee?.dob || "1988-04-19",
            NomineeAge: nominee?.age || "30",
            AppointeeName: "",
            AppointeeRelToNominee: "2",
          },
        ],
        OwnerHavingValidDrivingLicence: "1",
        OwnerHavingValidPACover: "1",
        ExpiryDate: isoDateTime(expiryDate, true),
        ProductElementCode: "C101066",
      },
      {
        ProductElementCode: "C101111",
        EffectiveDate: isoDateTime(effectiveDate),
        ExpiryDate: isoDateTime(expiryDate, true),
      },
      {
        ProductElementCode: "C101073",
        EffectiveDate: isoDateTime(effectiveDate),
        ExpiryDate: isoDateTime(expiryDate, true),
      },
      {
        ProductElementCode: "C101072",
        EffectiveDate: isoDateTime(effectiveDate),
        ExpiryDate: isoDateTime(expiryDate, true),
        SumInsured: 1000,
      },
      {
        SumInsured: 10000,
        ProductElementCode: "C101075",
        EffectiveDate: isoDateTime(effectiveDate),
        ExpiryDate: isoDateTime(expiryDate, true),
      },
      {
        ProductElementCode: "C101108",
        EffectiveDate: isoDateTime(effectiveDate),
        ExpiryDate: isoDateTime(expiryDate, true),
      },
      {
        EffectiveDate: isoDateTime(effectiveDate),
        ExpiryDate: isoDateTime(expiryDate, true),
        ProductElementCode: "C101069",
        PolicyBenefitList: [{ ProductElementCode: "B00025", ProviderName: "" }],
      },
    ].filter(
      (c) =>
        BASE_COVERAGE_CODES.includes(c.ProductElementCode) ||
        !excludeAddonCodes.includes(c.ProductElementCode)
    ),
  };
}

export function buildSbiQuickQuoteBody(
  quoteInput: any,
  options?: { idvOverride?: number; excludeAddonCodes?: string[] }
) {
  const today = new Date();
  const effectiveDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // tomorrow
  const expiryDate = new Date(effectiveDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const isoDateTime = (d: Date, endOfDay = false) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${
      endOfDay ? "23:59:59" : "00:00:00"
    }`;

  const matched = matchVehicleAndLocation(quoteInput);
  const { rc, registrationNumber, stateCode2, districtCode, cityCode } = matched;

  const pincode = rc?.split_present_address?.pincode || "";
  const addressLine = rc?.split_present_address?.address_line || "";
  const { FirstName, MiddleName, LastName } = splitName(rc.owner_name || "");

  const idv = Math.round(Number(options?.idvOverride ?? quoteInput?.idv ?? 0));
  const excludeAddonCodes = options?.excludeAddonCodes || [];

  return {
    AdditonalCompDeductible: "",
    AgreementCode: "6660", // confirmed fixed value from SBI's samples
    AlternatePolicyNo: "",
    BusinessSubType: "1",
    BusinessType: "1", // PLACEHOLDER — samples only show "1" for new vehicles; rollover/used-vehicle code unconfirmed
    ChannelType: "3",
    CustomerGSTINNo: "",
    CustomerSegment: "",
    EffectiveDate: isoDateTime(effectiveDate),
    ExpiryDate: isoDateTime(expiryDate, true),
    HasPrePolicy: quoteInput?.previousPolicyExpiryDate ? "1" : "0",
    IntermediaryCode: "",
    IssuingBranchCode: "",
    IssuingBranchGSTN: "",
    KindofPolicy: "1",
    NewBizClassification: "1",
    PolicyCustomerList: [
      {
        AadharNumUHID: "",
        BuildingHouseName: "",
        City: cityCode?.cityCode || "PLACEHOLDER_CITY_CODE",
        ContactEmail: "",
        ContactPersonTel: "",
        CountryCode: "1000000108", // confirmed fixed code for India
        CustomerName: rc.owner_name || "",
        DateOfBirth: "1990-01-01", // PLACEHOLDER — not present in RC data
        District: districtCode?.districtCode || "PLACEHOLDER_DISTRICT_CODE",
        EIANumber: "",
        FirstName,
        MiddleName,
        LastName,
        GSTRegistrationNum: "",
        GenderCode: "M", // PLACEHOLDER — not present in RC data
        ISDNum: "",
        IdNo: "",
        IdType: "",
        IsInsured: "N",
        IsOrgParty: "N",
        IsPolicyHolder: "Y",
        Locality: "",
        Mobile: "",
        NationalityCode: "IND",
        OccupationCode: "1",
        PartyStatus: "1",
        PlotNo: "",
        PostCode: pincode,
        PreferredContactMode: "",
        RegistrationName: "",
        SBIGCustomerId: "",
        STDCode: "",
        State: stateCode2,
        StreetName: addressLine,
        Title: "9000000001", // PLACEHOLDER — fixed "Mr" title code from samples
      },
    ],
    PolicyLobList: [
      {
        BranchInfo: "",
        ProductCode: "PMCAR001",
        PolicyType: "1",
        PolicyRiskList: [
          buildPolicyRisk(quoteInput, matched, effectiveDate, expiryDate, isoDateTime, idv, excludeAddonCodes),
        ],
      },
    ],
    PreInsuranceComAddr: "",
    PreInsuranceComName: "",
    PrePolicyEndDate: "",
    PrePolicyNo: "",
    PrePolicyStartDate: "",
    PremiumCurrencyCode: "INR",
    PremiumLocalExchangeRate: 1,
    ProductCode: "PMCAR001",
    ProductVersion: "1.0",
    ProposalDate: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    QuoteValidTo: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    SBIGBranchStateCode: stateCode2,
    SiCurrencyCode: "INR",
    SourceType: "9",
    TransactionInitiatedBy: "ZANIFEST",
  };
}

// Proposer's own personal details — collected on the checkout/cart form for
// the manual-OVD path, or superseded by the CKYC record's own fields below
// when one exists (per the integration doc: CKYC-fetched name/DOB/address
// must be what's sent, not whatever the customer separately typed).
export interface Sbi4wCustomerInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: string;
  dob: string;
  mobile: string;
  email: string;
  addressLine1: string;
  city: string;
  pincode: string;
}

// Verified CKYC record shape returned by /api/sbi/ckyc/fetch-record (OTP
// path) or synthesized by the manual-OVD form — either way, once CKYC is
// done this is the single source of truth and the checkout form no longer
// needs to ask for identity details again.
export interface Sbi4wCkycRecord {
  fullName?: string;
  dob?: string;
  gender?: string;
  email?: string;
  mobile?: string;
  correspondenceAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
}

// The 6 CKYC tags that must ride on the proposer entry in both FullQuote and
// Issuance, carried verbatim between the two per the integration doc's own
// instruction ("whatever value is passed in full quote API, the same value
// should be passed in issuance API").
export interface Sbi4wCkycTags {
  CKYCVerified?: string;
  KYCCKYCNo?: string;
  DOCTypeId?: string;
  DOCTypeName?: string;
  CKYCUniqueId?: string;
  CKYCSourceType?: string;
}

function normalizeGender(g: string | undefined): string {
  const key = String(g || "").trim().toUpperCase();
  if (key.startsWith("F")) return "F";
  if (key.startsWith("M")) return "M";
  return key || "M";
}

// FullQuote — same vehicle/coverage shape as QuickQuote, plus the real
// proposer (PolicyCustomerList[0]) and the CKYC tags that must ride on it.
// Confirmed against a live captured UAT request (M4W Postman collection,
// "Package(Comp)") — same account/client credentials already in use.
export function buildSbi4wFullQuoteBody(
  quoteInput: any,
  customer: Partial<Sbi4wCustomerInfo>,
  ckycTags?: Sbi4wCkycTags,
  ckycRecord?: Sbi4wCkycRecord | null,
  options?: {
    idvOverride?: number;
    excludeAddonCodes?: string[];
    nominee?: { name: string; dob: string; age: string };
  }
) {
  const today = new Date();
  const effectiveDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const expiryDate = new Date(effectiveDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const isoDateTime = (d: Date, endOfDay = false) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${
      endOfDay ? "23:59:59" : "00:00:00"
    }`;

  const matched = matchVehicleAndLocation(quoteInput);
  const { stateCode2 } = matched;

  const idv = Math.round(Number(options?.idvOverride ?? quoteInput?.idv ?? 0));
  const excludeAddonCodes = options?.excludeAddonCodes || [];

  // CKYC's own verified name/DOB/address take priority over the free-typed
  // checkout form when a CKYC record actually came back (OTP path) — the
  // manual-OVD path has no such record, so the form fields are all we have.
  const corAddr = ckycRecord?.correspondenceAddress;
  const fullName =
    ckycRecord?.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
  const { FirstName, MiddleName, LastName } = ckycRecord?.fullName
    ? splitName(ckycRecord.fullName)
    : { FirstName: customer.firstName || "", MiddleName: customer.middleName || "", LastName: customer.lastName || "" };
  const dob = toIsoDate(ckycRecord?.dob || customer.dob || "");
  const genderCode = normalizeGender(ckycRecord?.gender || customer.gender);
  const email = ckycRecord?.email || customer.email || "";
  const addressLine1 = corAddr?.line1 || customer.addressLine1 || "";
  const addressLine2 = corAddr?.line2 || "";
  const pincode = corAddr?.pincode || customer.pincode || "";

  // Prefer a fresh match against the proposer's own city/state (from CKYC)
  // over the vehicle-registration-address match already computed above —
  // falls back to the vehicle-address codes when CKYC gave us nothing.
  const proposerStateAbbrev = corAddr?.state || matched.addressStateAbbrev;
  const proposerDistrict = corAddr?.district
    ? matchDistrict(proposerStateAbbrev, corAddr.district)
    : matched.districtCode;
  const proposerCity = corAddr?.city
    ? matchCity(proposerStateAbbrev, corAddr.city)
    : matched.cityCode;

  return {
    AgreementCode: "6660",
    EffectiveDate: isoDateTime(effectiveDate),
    ExpiryDate: isoDateTime(expiryDate, true),
    HasPrePolicy: quoteInput?.previousPolicyExpiryDate ? "1" : "0",
    // SBI treats a gap since the last policy as "break-in" and rejects the
    // request unless InspectionDoneBy is present — confirmed live. No actual
    // physical inspection happens in this flow, so "Inspection Waived Off"
    // (SBI_T_InspectionBy = "2") is the honest default rather than claiming
    // TPA/self inspection took place.
    InspectionComment: "",
    InspectionDoneBy: "2",
    InspectionLeadNo: "",
    KindofPolicy: "1",
    NewBizClassification: "1",
    AddonPlanType: "7",
    AddonPlanTypePrem: "",
    PolicyCustomerList: [
      {
        BuildingHouseName: addressLine1,
        // CKYC tags — required verbatim on the proposer entry per the
        // integration doc, whichever path (OTP or manual OVD) produced them.
        CKYCVerified: ckycTags?.CKYCVerified ?? "N",
        KYCCKYCNo: ckycTags?.KYCCKYCNo ?? "",
        DOCTypeId: ckycTags?.DOCTypeId ?? "",
        DOCTypeName: ckycTags?.DOCTypeName ?? "",
        CKYCUniqueId: ckycTags?.CKYCUniqueId ?? "",
        CKYCSourceType: ckycTags?.CKYCSourceType ?? "SBIG",
        City: proposerCity?.cityCode || "PLACEHOLDER_CITY_CODE",
        ContactEmail: email,
        ContactPersonTel: "",
        CountryCode: "1000000108",
        CustomerName: fullName.toUpperCase(),
        DateOfBirth: dob,
        DateOfIncorporation: "",
        District: proposerDistrict?.districtCode || "PLACEHOLDER_DISTRICT_CODE",
        FirstName,
        GenderCode: genderCode,
        IsInsured: "N",
        IsOrgParty: "N",
        IsPolicyHolder: "Y",
        LastName,
        Locality: "1",
        MiddleName,
        Mobile: ckycRecord?.mobile || customer.mobile || "",
        NationalityCode: "IND",
        OccupationCode: "",
        PlotNo: "",
        PostCode: pincode,
        PreferredContactMode: "",
        RegistrationName: fullName,
        State: proposerStateAbbrev || stateCode2,
        StreetName: addressLine2 || addressLine1,
        Title: "9000000001",
      },
    ],
    PolicyLobList: [
      {
        BranchInfo: "",
        PolicyRiskList: [
          buildPolicyRisk(
            quoteInput,
            matched,
            effectiveDate,
            expiryDate,
            isoDateTime,
            idv,
            excludeAddonCodes,
            options?.nominee
          ),
        ],
        PolicyType: "1",
        ProductCode: "PMCAR001",
      },
    ],
    PreInsuranceComAddr: "",
    PreInsuranceComName: "",
    PrePolicyEndDate: "",
    PrePolicyNo: "",
    PrePolicyStartDate: "",
    PremiumCurrencyCode: "INR",
    PremiumLocalExchangeRate: 1,
    ProductCode: "PMCAR001",
    ProductVersion: "1.0",
    SBIGBranchStateCode: proposerStateAbbrev || stateCode2,
    SourceType: "9",
    TransactionInitiatedBy: "ZANIFEST",
  };
}

// Issuance ("getIssurance") — confirmed field-for-field from a live captured
// UAT request/response pair (M4W Postman collection, "Issuance Copy").
// Deliberately flat: SBI looks up everything else via QuotationNo, which
// FullQuote returned.
export function buildSbi4wIssuanceBody(params: {
  quotationNo: string;
  amount: number;
  payerName: string;
  paymentReferenceNo: string;
  ckycTags?: Sbi4wCkycTags;
}) {
  const now = new Date();
  const isoDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  return {
    QuotationNo: params.quotationNo,
    Amount: params.amount,
    CurrencyId: 1,
    PayMode: 212, // confirmed default (online/gateway) — see SBI_T_BCP_PayMode for other modes
    FeeType: 11,
    Payer: params.payerName,
    TransactionDate: isoDate,
    PaymentReferNo: params.paymentReferenceNo,
    InstrumentNumber: params.paymentReferenceNo,
    InstrumentDate: isoDate,
    BankCode: "",
    BankName: "",
    BankBranchName: "",
    BankBranchCode: "",
    LocationType: "2",
    RemitBankAccount: "30",
    ReceiptCreatedBy: "",
    PickupDate: isoDate,
    IFSCCode: "",
    MICRNumber: "",
    PANNumber: "",
    ReceiptBranch: "",
    ReceiptTransactionDate: isoDate,
    ReceiptDate: isoDate,
    EscalationDepartment: "",
    Comment: "",
    AccountNumber: "",
    AccountName: "",
    CKYCUniqueId: params.ckycTags?.CKYCUniqueId ?? "",
    CKYCVerified: params.ckycTags?.CKYCVerified ?? "N",
    KYCCKYCNo: params.ckycTags?.KYCCKYCNo ?? "",
    SourceType: "9",
  };
}
