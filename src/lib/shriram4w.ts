// ============ src/lib/shriram4w.ts ============
// Shriram General Insurance — Private Car (MOT-PRD-001) helpers.
// Matches RC data against Shriram's own UAT masters (extracted from the
// API kit's UAT_MASTERS/*.xlsx into src/lib/shriramMaster/*.json) and builds
// the objPolicyEntryETT body for GetQuote, following the kit's
// WebAggregator_Document_JSON_API.pdf sample and Mandatory_NonMandatory_List.xlsx.
// RTO, pincode and financier masters differ in production — re-extract them
// from the production kit before go-live.

import vehicles from "@/lib/shriramMaster/vehicle4w.json";
import rtoTable from "@/lib/shriramMaster/rto.json";
import pincodeTable from "@/lib/shriramMaster/pincode.json";

export const SHRIRAM_PRODUCT_PRIVATE_CAR = "MOT-PRD-001";

export const SHRIRAM_POLICY_TYPE = {
  PACKAGE: "MOT-PLT-001",
  LIABILITY: "MOT-PLT-002",
  OD_ONLY: "MOT-PLT-009",
  BUNDLED: "MOT-PLT-010",
} as const;

export interface ShriramVehicle {
  code: string;
  make: string;
  model: string;
  variant: string;
  body: string;
  cc: number | null;
  fuel: string;
  seats: number | null;
  status: string;
  obsoleteYear: string;
}

const norm = (s: any) => String(s || "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
const compact = (s: string) => s.replace(/\s+/g, "");

const FUEL_ALIASES: Record<string, string> = {
  PETROL: "PETROL",
  DIESEL: "DIESEL",
  CNG: "CNG",
  LPG: "LPG",
  "PETROL CNG": "CNG",
  "PETROL LPG": "LPG",
  ELECTRIC: "ELECTRIC",
  BATTERY: "ELECTRIC",
};
const normFuel = (s: any) => FUEL_ALIASES[norm(s)] || norm(s);

// RC spellings that differ from Shriram's MANUFACTURER column
const MAKE_ALIASES: Record<string, string> = {
  MAHINDRA: "MAHINDRA AND MAHINDRA",
  "MAHINDRA MAHINDRA": "MAHINDRA AND MAHINDRA",
  MARUTI: "MARUTI SUZUKI",
  TATA: "TATA MOTORS",
  VW: "VOLKSWAGEN",
};

export type ShriramVehicleMatch =
  | { ok: true; vehicle: ShriramVehicle; ambiguous: boolean; candidates: number }
  | { ok: false; reason: string };

// rc: { vehicle_manufacturer_name, model, type (fuel), vehicle_cubic_capacity }
// Same approach as digitVehicleMatch.ts: make → model → fuel → cc → trim words.
export function matchShriramVehicle(rc: any): ShriramVehicleMatch {
  const rawMake = norm(rc.vehicle_manufacturer_name);
  const make = MAKE_ALIASES[rawMake] || rawMake;
  const model = norm(rc.model);
  const fuel = normFuel(rc.type);
  const cc = Number(rc.vehicle_cubic_capacity) || null;

  if (!make || !model) return { ok: false, reason: "RC is missing make or model" };

  const all = vehicles as ShriramVehicle[];
  let byMake = all.filter((v) => norm(v.make) === make);
  if (!byMake.length) {
    // RC makers carry legal suffixes ("MARUTI SUZUKI INDIA LTD"); use the
    // longest Shriram make the RC make starts with.
    const best = [...new Set(all.map((v) => norm(v.make)))]
      .filter((m) => m && (make.startsWith(m + " ") || MAKE_ALIASES[make.split(" ")[0]] === m))
      .sort((a, b) => b.length - a.length)[0];
    if (best) byMake = all.filter((v) => norm(v.make) === best);
  }
  if (!byMake.length) return { ok: false, reason: `No Shriram vehicles for make "${make}"` };

  // Model match ignores spaces; the longest Shriram model name contained in
  // the RC model wins ("GRAND I10 NIOS" beats "GRAND I10").
  const rcModel = compact(model);
  let byModel = byMake.filter((v) => compact(norm(v.model)) === rcModel);
  if (!byModel.length) {
    const contained = byMake.filter((v) => {
      const m = compact(norm(v.model));
      return m.length >= 3 && rcModel.includes(m);
    });
    const longest = Math.max(0, ...contained.map((v) => compact(norm(v.model)).length));
    byModel = contained.filter((v) => compact(norm(v.model)).length === longest);
  }
  if (!byModel.length) return { ok: false, reason: `No Shriram model matches "${model}" for ${make}` };

  let pool = byModel;
  if (fuel) {
    const sameFuel = pool.filter((v) => normFuel(v.fuel) === fuel);
    if (sameFuel.length) pool = sameFuel;
  }
  if (cc) {
    const closest = Math.min(...pool.map((v) => Math.abs((v.cc || 0) - cc)));
    pool = pool.filter((v) => Math.abs((v.cc || 0) - cc) === closest);
  }
  const active = pool.filter((v) => !v.obsoleteYear);
  if (active.length) pool = active;

  // Prefer the variant whose trim words appear in the RC model text
  const overlap = (v: ShriramVehicle) =>
    norm(v.variant)
      .split(" ")
      .filter((w) => w.length >= 2 && rcModel.includes(w)).length;
  const bestOverlap = Math.max(0, ...pool.map(overlap));
  if (bestOverlap > 0) pool = pool.filter((v) => overlap(v) === bestOverlap);

  const sorted = [...pool].sort((a, b) => b.code.localeCompare(a.code));
  return { ok: true, vehicle: sorted[0], ambiguous: sorted.length > 1, candidates: sorted.length };
}

// ---------- Registration number ----------
// "DL02DG3480" → { RegNo1: "DL", RegNo2: "02", RegNo3: "DG", RegNo4: "3480" }
// Bharat series "23BH8569L" → { RegNo1: "23", RegNo2: "BH", RegNo3: "8569", RegNo4: "L" }
// (the kit's Data Validation Rules give that order for VehicleType "B").
export function splitRegNo(regNo: string) {
  const r = String(regNo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const bh = r.match(/^(\d{2})BH(\d{4})([A-Z]{1,2})$/);
  if (bh) return { bharat: true, RegNo1: bh[1], RegNo2: "BH", RegNo3: bh[2], RegNo4: bh[3] };
  const m = r.match(/^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/);
  if (!m) return null;
  return { bharat: false, RegNo1: m[1], RegNo2: m[2].padStart(2, "0"), RegNo3: m[3], RegNo4: m[4] };
}

// ---------- RTO ----------
// Shriram RTO codes are "DL-02"; returns null when the code is not on file.
export function matchShriramRto(rtoCode: string) {
  const c = String(rtoCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = c.match(/^([A-Z]{2})(\d{1,2})/);
  if (!m) return null;
  const code = `${m[1]}-${m[2].padStart(2, "0")}`;
  return (rtoTable as any[]).find((r) => r.code === code) || null;
}

// ---------- Pincode → City / StateCode ----------
export function lookupShriramPincode(pincode: string) {
  const row = (pincodeTable as Record<string, string[]>)[String(pincode || "").trim()];
  return row ? { city: row[0], stateCode: row[1] } : null;
}

// ---------- Dates ----------
const pad = (n: number) => String(n).padStart(2, "0");
// Date → dd-mm-yyyy (the format of the kit's GetQuote sample)
export const toShriramDate = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

// dd-mm-yyyy or yyyy-mm-dd → Date (local midnight)
function parseDate(s: string): Date | null {
  const v = String(s || "");
  let m = v.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return null;
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const addYears = (d: Date, n: number) => {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + n);
  return x;
};

// ---------- GetQuote body ----------
// quoteInput is the same object /api/car/4w/quote receives (built by
// buildCarQuoteInput + previousPolicyExpiryDate / pincode / claimDeclaration).
export function buildShriramQuoteBody(quoteInput: any) {
  const rc = quoteInput.rcRaw || {};

  const match = matchShriramVehicle(rc);
  if (!match.ok) return { error: match.reason };

  const reg = splitRegNo(rc.reg_no || quoteInput.registrationNumber);
  if (!reg) return { error: `Unrecognised registration number "${rc.reg_no || ""}"` };

  const rto = matchShriramRto(
    reg.bharat ? quoteInput.rtoLocationName || rc.rto_code : rc.rto_code || `${reg.RegNo1}${reg.RegNo2}`
  );
  if (!rto) return { error: "RTO not found in Shriram master" };

  const pincode = String(quoteInput.pincode || "").trim();
  const place = lookupShriramPincode(pincode);
  if (!place) return { error: `Pincode ${pincode || "(blank)"} not found in Shriram master` };

  const regDate = parseDate(rc.reg_date) || parseDate(quoteInput.registrationDate);
  if (!regDate) return { error: "Registration date missing in RC" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Policy start: the day after the previous policy ends. A lapsed policy is a
  // break-in; quote it from tomorrow (T+1) — issuance then needs Shriram's
  // pre-inspection, which this kit has no API for.
  const prevExpiry = parseDate(quoteInput.previousPolicyExpiryDate);
  const breakIn = !prevExpiry || prevExpiry < today;
  const policyFrom = breakIn ? addDays(today, 1) : addDays(prevExpiry!, 1);
  const policyTo = addDays(addYears(policyFrom, 1), -1);

  // Data Validation Rules: a car under 3 years old cannot take a 1-year
  // Package policy — its long-term TP is still running, so it is OD Only.
  const ageYears = (policyFrom.getTime() - regDate.getTime()) / (365.25 * 86400000);
  const policyType = ageYears < 3 ? SHRIRAM_POLICY_TYPE.OD_ONLY : SHRIRAM_POLICY_TYPE.PACKAGE;

  // No previous-policy details are collected before the quote, so price it as
  // a market renewal of a 1-year package with no NCB (same as the other insurers).
  const prevTo = prevExpiry || addDays(today, -1);
  const prevFrom = addDays(addYears(prevTo, -1), 1);
  const claimed = quoteInput.claimDeclaration === "Yes";

  const isCng = normFuel(rc.type) === "CNG" || normFuel(match.vehicle.fuel) === "CNG";

  const body = {
    objPolicyEntryETT: {
      ReferenceNo: "",
      ProdCode: SHRIRAM_PRODUCT_PRIVATE_CAR,
      PolicyFromDt: toShriramDate(policyFrom),
      PolicyToDt: toShriramDate(policyTo),
      PolicyIssueDt: toShriramDate(today),
      InsuredPrefix: "1",
      InsuredName: String(rc.owner_name || "Customer").slice(0, 60),
      PolicyType: policyType,
      ProposalType: "RENEWAL OF OTHERS",
      VehicleCode: match.vehicle.code,
      EngineNo: String(rc.engine || ""),
      FirstRegDt: toShriramDate(regDate),
      VehicleType: reg.bharat ? "B" : "U",
      ChassisNo: String(rc.chassis || ""),
      RegNo1: reg.RegNo1,
      RegNo2: reg.RegNo2,
      RegNo3: reg.RegNo3,
      RegNo4: reg.RegNo4,
      RTOCode: rto.code,
      // GetQuote rejects a market renewal without these ("Previous Policy No
      // is mandatory for Market Renewal"); the real values are only collected
      // at proposal, so the quote uses placeholders — they don't affect price.
      PreviousPolicyNo: String(quoteInput.previousPolicyNumber || "PREV00000000"),
      PreviousInsurer: String(quoteInput.previousInsurer || "Acko General Insurance Ltd"),
      PreviousPolicyFromDt: toShriramDate(prevFrom),
      PreviousPolicyToDt: toShriramDate(prevTo),
      PreviousPolicyUWYear: "",
      PreviousPolicySI: "",
      PreviousPolicyClaimYN: claimed ? "1" : "0",
      PreviousPolicyNCBPerc: "0",
      PreviousPolicyType: policyType === SHRIRAM_POLICY_TYPE.OD_ONLY ? SHRIRAM_POLICY_TYPE.BUNDLED : SHRIRAM_POLICY_TYPE.PACKAGE,
      PreviousNilDepreciation: "0",
      PAforUnnamedPassengerYN: "N",
      PAforUnnamedPassengerSI: "0",
      ElectricalaccessYN: "N",
      ElectricalaccessSI: "0",
      ElectricalaccessRemarks: "",
      NonElectricalaccessYN: "N",
      NonElectricalaccessSI: "0",
      NonElectricalaccessRemarks: "",
      PAPaidDriverConductorCleanerYN: "N",
      PAPaidDriverConductorCleanerSI: "0",
      PAPaidDriverCount: "0",
      PAPaidConductorCount: "0",
      PAPaidCleanerCount: "0",
      // PA Owner Driver is compulsory unless an exclusion reason is sent; the
      // nominee is only collected at proposal, so the quote uses a placeholder.
      PAOwnerDriverExclusion: "0",
      PAOwnerDriverExReason: "",
      NomineeNameforPAOwnerDriver: "Nominee",
      NomineeAgeforPAOwnerDriver: "30",
      NomineeRelationforPAOwnerDriver: "SPOUSE",
      AppointeeNameforPAOwnerDriver: "",
      AppointeeRelationforPAOwnerDriver: "",
      LLtoPaidDriverYN: "0",
      NoEmpCoverLL: "0",
      Bangladesh: "0",
      Bhutan: "0",
      SriLanka: "0",
      Pakistan: "0",
      Nepal: "0",
      Maldives: "0",
      CNGKitYN: "N",
      CNGKitSI: "0",
      // Data Validation Rules: a CNG-fuel vehicle must carry the in-built CNG cover
      InBuiltCNGKitYN: isCng ? "1" : "0",
      NilDepreciationCoverYN: "N",
      RSACover: "N",
      DailyExpRemYN: "N",
      KeyReplacementYN: "N",
      LossOfPersonBelongYN: "N",
      EmergencyTranHotelExpRemYN: "N",
      MultiCarBenefitYN: "N",
      Eng_Protector: "N",
      Consumables: "N",
      SHRIMOTORPROTECTION_YN: "N",
      LimitedTPPDYN: "0",
      Gender: "",
      Address1: "",
      Address2: "",
      Address3: "",
      State: place.stateCode,
      City: place.city,
      PinCode: pincode,
      PanNo: "",
      GSTNo: "",
      TelephoneNo: "",
      FaxNo: "",
      EMailID: "",
      tpPolFmdt: "",
      tpPolTodt: "",
      tpPolNo: "",
      tpPolComp: "",
      tpPolAddr: "",
      MobileNo: "",
      DateOfBirth: "",
      POSAgentName: "",
      POSAgentPanNo: "",
      CoverNoteNo: "",
      CoverNoteDt: "",
      // 0 = ask Shriram for its ideal IDV (Data Validation Rules, "discovery hit")
      IDV_of_Vehicle: "0",
      Colour: "",
      VehiclePurposeYN: "",
      DriverAgeYN: "",
      LimitOwnPremiseYN: "0",
      VoluntaryExcess: "",
      DeTariff: "0",
      PreInspectionReportYN: "",
      PreInspection: "",
      BreakIn: breakIn ? "YES" : "NO",
      AddonPackage: "",
      AntiTheftYN: "0",
      HypothecationType: "",
      HypothecationBankName: "",
      HypothecationAddress1: "",
      HypothecationAddress2: "",
      HypothecationAddress3: "",
      HypothecationAgreementNo: "",
      HypothecationCountry: "",
      HypothecationState: "",
      HypothecationCity: "",
      HypothecationPinCode: "",
      SpecifiedPersonField: "",
      AadharNo: "",
      AadharEnrollNo: "",
      PHYSICALPOLICY: "0",
    },
  };

  return {
    body,
    matchedCode: match.vehicle.code,
    matchedModel: `${match.vehicle.make} ${match.vehicle.model} ${match.vehicle.variant}`,
    ambiguous: match.ambiguous,
    policyType,
    breakIn,
  };
}

// ---------- GetQuote response ----------
// CoverDtlList rows are { CoverDesc, Premium, Type: "Add" | "Less" | "" };
// totals are the rows with a blank Type.
export function parseShriramQuote(result: any) {
  const covers: { CoverDesc: string; Premium: string; Type: string }[] = result?.CoverDtlList || [];
  const amount = (desc: RegExp) => {
    const row = covers.find((c) => desc.test(String(c.CoverDesc || "").trim()));
    return row ? Math.abs(Number(row.Premium) || 0) : 0;
  };
  const gst =
    amount(/^IGST/i) + amount(/^SGST/i) + amount(/^CGST/i);
  return {
    quoteId: String(result?.POL_SYS_ID || ""),
    idv: Number(result?.VehicleIDV) || 0,
    odPremium: amount(/^OD Total$/i),
    tpPremium: amount(/^TP Total$/i),
    netPremium: amount(/^Total Premium$/i),
    gst,
    totalPremium: amount(/^Total Amount$/i),
    covers: covers
      .filter((c) => c.Type)
      .map((c) => ({ name: String(c.CoverDesc).trim(), premium: Number(c.Premium) || 0, type: c.Type })),
  };
}

// ---------- GenerateProposal body ----------
// Rules below were confirmed against UAT GenerateProposal responses:
// - AadharNo (12 digits) is required for every individual proposal, whatever POA is sent.
// - The PAN card (or Form 60) must be sent as a Base64 document with a name and extension.
// - Form 60 also needs a separate proof-of-identity document — only the PAN path is supported here.
// - OD Only needs the running TP policy (number, insurer, address, from/to); the OD
//   end date may not run past the TP end date.
// - A break-in proposal is rejected without a pre-inspection survey ID, which this
//   kit has no API to obtain.
export interface ShriramProposalDetails {
  idv?: number;
  customer: {
    fullName: string;
    gender: "M" | "F";
    dob: string; // yyyy-mm-dd
    mobile: string;
    email: string;
    address1: string;
    address2?: string;
    pincode: string;
    fatherName: string;
  };
  nominee: { name: string; relation: string; dob: string }; // dob yyyy-mm-dd
  previousPolicy: { insurer: string; policyNumber: string };
  tpPolicy?: { policyNumber: string; insurer: string; address: string; from: string; to: string }; // yyyy-mm-dd
  kyc: { pan: string; aadhaar: string };
  panDocument: { base64: string; ext: string };
  physicalPolicy: boolean;
}

const yearsSince = (iso: string) => {
  const d = parseDate(iso);
  if (!d) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
};

export function buildShriramProposalBody(quoteInput: any, details: ShriramProposalDetails) {
  const built = buildShriramQuoteBody(quoteInput);
  if ("error" in built) return built;
  if (built.breakIn) {
    return {
      error:
        "Your previous policy has lapsed. Shriram needs a vehicle pre-inspection before it can issue this policy, which can't be done online yet.",
    };
  }

  const { customer: c, nominee: n, kyc } = details;
  const place = lookupShriramPincode(c.pincode);
  if (!place) return { error: `Pincode ${c.pincode} not found in Shriram master` };

  const odOnly = built.policyType === SHRIRAM_POLICY_TYPE.OD_ONLY;
  const tp = details.tpPolicy;
  if (odOnly && !(tp?.policyNumber && tp.insurer && tp.from && tp.to)) {
    return { error: "Third-party policy details are required for an Own Damage only policy" };
  }

  // Shriram won't let OD cover outlive the TP cover; it then asks for a
  // short-term / pro-rata policy, which the kit has no documented field for
  // (PolicyToDt = TP end, PolicyTenure, ShortTerm, ProRata all still rejected
  // in UAT). Stop here with a clear reason instead of Shriram's raw error.
  if (odOnly) {
    const tpEnd = parseDate(tp!.to);
    const odEnd = parseDate(built.body.objPolicyEntryETT.PolicyToDt);
    if (tpEnd && odEnd && tpEnd < odEnd) {
      return {
        error:
          `Your third-party cover ends on ${toShriramDate(tpEnd)}, before this 1-year policy would end (${toShriramDate(odEnd)}). ` +
          "Shriram needs a short-term policy for this, which isn't available online yet.",
      };
    }
  }

  const nomineeAge = yearsSince(n.dob);
  const ext = details.panDocument.ext.startsWith(".") ? details.panDocument.ext : `.${details.panDocument.ext}`;
  const iso = (s?: string) => {
    const d = parseDate(s || "");
    return d ? toShriramDate(d) : "";
  };

  // OD Only: Shriram reads "previous policy no = TP policy no" as the original
  // bundled new-car policy, which must start on the TP start date ("Previous
  // Policy Start Should not Prior than TP Policy Start Date" otherwise). A
  // different number means the last policy was a standalone OD renewal.
  const sameAsTp =
    odOnly &&
    tp!.policyNumber.replace(/\s+/g, "").toUpperCase() ===
      details.previousPolicy.policyNumber.replace(/\s+/g, "").toUpperCase();
  const previousPolicyDates = !odOnly
    ? {}
    : sameAsTp
    ? { PreviousPolicyType: SHRIRAM_POLICY_TYPE.BUNDLED, PreviousPolicyFromDt: iso(tp!.from) }
    : { PreviousPolicyType: SHRIRAM_POLICY_TYPE.OD_ONLY };

  const body = built.body;
  Object.assign(body.objPolicyEntryETT, {
    ...previousPolicyDates,
    InsuredPrefix: c.gender === "F" ? "2" : "1",
    InsuredName: c.fullName.toUpperCase(),
    Gender: c.gender,
    Address1: c.address1,
    Address2: c.address2 || place.city,
    Address3: "",
    State: place.stateCode,
    City: place.city,
    PinCode: c.pincode,
    MobileNo: c.mobile,
    EMailID: c.email,
    // The kit's proposal samples spell it both ways
    EmailID: c.email,
    IDV_of_Vehicle: String(Math.round(details.idv || 0)),
    PreviousPolicyNo: details.previousPolicy.policyNumber,
    PreviousInsurer: details.previousPolicy.insurer,
    NomineeNameforPAOwnerDriver: n.name.toUpperCase(),
    NomineeAgeforPAOwnerDriver: String(nomineeAge),
    NomineeRelationforPAOwnerDriver: n.relation.toUpperCase(),
    tpPolNo: odOnly ? tp!.policyNumber : "",
    tpPolComp: odOnly ? tp!.insurer : "",
    tpPolAddr: odOnly ? tp!.address || "INDIA" : "",
    tpPolFmdt: odOnly ? iso(tp!.from) : "",
    tpPolTodt: odOnly ? iso(tp!.to) : "",
    // CKYC: no CKYC number — identity by PAN, address by Aadhaar
    CKYC_NO: "",
    DOB: iso(c.dob),
    POI_Type: "PAN",
    POI_ID: kyc.pan,
    POA_Type: "PROOF OF POSSESSION OF AADHAR",
    POA_ID: kyc.aadhaar,
    AadharNo: kyc.aadhaar,
    FatherName: c.fatherName.toUpperCase(),
    MotherName: "",
    MaritalStatus: "",
    SpouseName: "",
    ResidentialStatus: "",
    POI_DocumentFile: "",
    POA_DocumentFile: "",
    Insured_photo: "",
    POI_DocumentExt: "",
    POA_DocumentExt: "",
    Insured_photoExt: "",
    // AML (Shriram's email of the UAT credentials)
    PANorForm60: "PAN",
    PanNo: kyc.pan,
    Pan_Form60_Document: details.panDocument.base64,
    Pan_Form60_Document_Ext: ext.toLowerCase(),
    Pan_Form60_Document_Name: "PAN",
    PHYSICALPOLICY: details.physicalPolicy ? "1" : "0",
  });

  // Minor nominee needs an appointee (Data Validation Rules) — not collected yet
  if (nomineeAge < 18) return { error: "Nominee must be 18 or older" };

  return { ...built, body };
}
