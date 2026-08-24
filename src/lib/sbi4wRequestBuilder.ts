// ============ src/lib/sbi4wRequestBuilder.ts ============
// Builds SBI's actual QuickQuote RequestBody shape (confirmed from SBI's own
// integration-kit sample — PolicyCustomerList / PolicyLobList / PolicyRiskList /
// PolicyCoverageList / PolicyBenefitList, NOT the flat make/model/variant shape
// used for Zuno). This is plumbing only: several fields below use PLACEHOLDER
// codes because the real RC-data → SBI master-code mapping (Vehicle Make/Model/
// Variant, RTOLocationID/RTOCityDistric, City/District) isn't available yet —
// each is flagged inline. Do NOT surface a premium computed from this to
// customers until those placeholders are replaced with real master-data codes.

const pad = (n: number) => String(n).padStart(2, "0");

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

// TEMPORARY — confirmed from SBI's own master-data tables for exactly this
// vehicle (Hyundai Grand i10 Nios Petrol, 1.2 Kappa Sportz MT). Replace with
// a real Make/Model/Variant → SBI-code lookup once the full master-data
// mapping file is available for all vehicles; every other vehicle still
// falls back to the PLACEHOLDER_ markers below (and therefore stays hidden).
const KNOWN_VEHICLE_CODES: Record<
  string,
  { make: string; model: string; variant: string }
> = {
  "HYUNDAI|GRAND I10 NIOS|1.2MT KAPPA SPORTZ VTVT": {
    make: "11",
    model: "526",
    variant: "4537",
  },
};

function lookupVehicleCodes(make: string, model: string, variant: string) {
  const key = `${String(make || "").toUpperCase()}|${String(
    model || ""
  ).toUpperCase()}|${String(variant || "").toUpperCase()}`;
  return KNOWN_VEHICLE_CODES[key] || null;
}

// TEMPORARY — confirmed from SBI's own RTO master table for exactly this
// registration's RTO (UP-14 / Ghaziabad). Replace with a real RTO master
// lookup (District_Code/Location_ID/RTO_Cluster/RTO_Region/RTO_Zone) once
// that full file is available; every other RTO still falls back to the
// PLACEHOLDER_ markers below (and therefore stays hidden).
const KNOWN_RTO_CODES: Record<
  string,
  { locationId: string; cityDistrict: string; cluster: string; region: string; zone: string }
> = {
  "UP-14": {
    locationId: "815",
    cityDistrict: "DS_530",
    cluster: "UP_NCR",
    region: "North",
    zone: "Zone B",
  },
};

function lookupRtoCodes(rtoLocationName: string) {
  const key = String(rtoLocationName || "").toUpperCase();
  return KNOWN_RTO_CODES[key] || null;
}

// TEMPORARY — confirmed from SBI's own District-master and City-master
// tables for exactly this address's location (Ghaziabad, UP, pincode
// 201017). Ghaziabad's City-master row has an empty City_Code but a
// populated CCA_Code — the two columns appear to be mutually-exclusive
// alternate city identifiers (bigger notified cities get a CCA_Code,
// others a City_Code) — so cityCode below holds whichever one was
// populated for this row. Replace with a real pincode → City/District
// lookup once the full pin_code master is available in the codebase; every
// other pincode still falls back to the PLACEHOLDER_ markers.
const KNOWN_DISTRICT_CODES: Record<string, { districtCode: string; cityCode: string }> = {
  "201017": { districtCode: "4000000297", cityCode: "3000000316" }, // Ghaziabad, UP
};

function lookupDistrictCode(pincode: string) {
  return KNOWN_DISTRICT_CODES[String(pincode || "")] || null;
}

export function buildSbiQuickQuoteBody(quoteInput: any) {
  const rc = quoteInput?.rcRaw || {};
  const today = new Date();
  const effectiveDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // tomorrow
  const expiryDate = new Date(effectiveDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const isoDateTime = (d: Date, endOfDay = false) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${
      endOfDay ? "23:59:59" : "00:00:00"
    }`;

  const registrationNumber = String(
    quoteInput?.registrationNumber || rc.reg_no || ""
  ).toUpperCase();
  // e.g. "UP14FY9367" -> "UP" — real, derived from the actual registration number
  const stateCode2 = registrationNumber.slice(0, 2) || "MH";

  const pincode = rc?.split_present_address?.pincode || "";
  const addressLine = rc?.split_present_address?.address_line || "";
  const { FirstName, MiddleName, LastName } = splitName(rc.owner_name || "");

  const vehicleCodes = lookupVehicleCodes(
    quoteInput?.make,
    quoteInput?.model,
    quoteInput?.variant
  );
  const rtoCodes = lookupRtoCodes(quoteInput?.rtoLocationName);
  const districtCode = lookupDistrictCode(pincode);

  const manufactureYear =
    (rc.vehicle_manufacturing_month_year || "").split("/")[1] ||
    toIsoDate(quoteInput?.registrationDate || "").slice(0, 4) ||
    String(today.getFullYear());

  const seatingCapacity = Number(rc.vehicle_seat_capacity || 5);
  const engineCapacity = Math.round(Number(rc.vehicle_cubic_capacity || 0)) || 1197;
  const idv = Math.round(Number(quoteInput?.idv || 0));

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
        City: districtCode?.cityCode || "PLACEHOLDER_CITY_CODE", // needs SBI numeric City_CD code (pin_code master)
        ContactEmail: "",
        ContactPersonTel: "",
        CountryCode: "1000000108", // confirmed fixed code for India
        CustomerName: rc.owner_name || "",
        DateOfBirth: "1990-01-01", // PLACEHOLDER — not present in RC data
        District: districtCode?.districtCode || "PLACEHOLDER_DISTRICT_CODE", // needs SBI numeric District code (pin_code master)
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
          {
            AAMemberExpiryDate: "",
            AAMemberNo: "",
            AntiTheftAlarmSystem: "0",
            BodyStyle: (quoteInput?.bodystyleDescription || "HATCHBACK").toUpperCase(),
            BodyType: (quoteInput?.bodystyleDescription || "HATCHBACK").toUpperCase(),
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
            FuelType: "1", // PLACEHOLDER — Petrol/Diesel/CNG SBI fuel-type code enum unconfirmed
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
            ProductElementCode: "R10005", // confirmed fixed code for a car risk
            RTOCityDistric: rtoCodes?.cityDistrict || "PLACEHOLDER_RTO_CITY_DISTRICT", // needs SBI's RTO master (DS_xxx format)
            RTOCluster: rtoCodes?.cluster || stateCode2,
            RTOLocation: quoteInput?.rtoLocationName || "",
            RTOLocationID: rtoCodes?.locationId || "PLACEHOLDER_RTO_LOCATION_ID", // needs SBI's RTO master
            RTONameCode: stateCode2,
            RTORegion: rtoCodes?.region || "PLACEHOLDER_RTO_REGION",
            RegistrationDate: toIsoDate(quoteInput?.registrationDate || ""),
            RegistrationNo: registrationNumber,
            RoadType: "1",
            SeatingCapacity: seatingCapacity,
            TrailerCount: 0,
            Variant: vehicleCodes?.variant || "PLACEHOLDER_VARIANT_CODE", // needs SBI vehicle-mapping master
            VehicleColor: "1",
            VehicleMake: vehicleCodes?.make || "PLACEHOLDER_MAKE_CODE", // needs SBI vehicle-mapping master
            VehicleModel: vehicleCodes?.model || "PLACEHOLDER_MODEL_CODE", // needs SBI vehicle-mapping master
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
                    NomineeName: "",
                    NomineeRelToProposer: "1",
                    NomineeDOB: "1988-04-19",
                    NomineeAge: "30",
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
            ],
          },
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
