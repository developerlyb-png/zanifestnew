import { matchBajajVehicle, matchBajajRto } from "@/lib/bajajVehicleMatch";
import { rcDateToIso } from "@/lib/zuno4w";
import { bajajPrevInsurerCode } from "@/lib/bajajPrevInsurers";

export { BAJAJ_PREV_INSURERS, bajajPrevInsurerCode } from "@/lib/bajajPrevInsurers";

// Builds the body for Bajaj Allianz's calculatemotorpremiumsig (private car)
// from the same quote input the Zuno / SBI / Digit flows use, following the
// field rules in Bajaj's WLS_REST_MOTOR kit ("Compute Premium Data" sheet).

// Bajaj 4W product codes (kit: "Product, card info and Extra columns")
export const BAJAJ_4W_PRODUCTS = {
  COMPREHENSIVE: "1801",
  TP_ONLY: "1805",
  NEW_BUSINESS: "1825",
  OD_ONLY: "1870",
} as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Date / yyyy-mm-dd -> dd-Mon-yyyy (Bajaj's only accepted date format)
export function bajajDate(d: Date | string) {
  const dt = typeof d === "string" ? new Date(`${d}T00:00:00Z`) : d;
  if (isNaN(dt.getTime())) return "";
  return `${String(dt.getUTCDate()).padStart(2, "0")}-${MONTHS[dt.getUTCMonth()]}-${dt.getUTCFullYear()}`;
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

export interface BajajQuoteOptions {
  // Bajaj-computed IDV to re-price at (±10% of its own suggestion). Omit on
  // the first quote so Bajaj returns its own IDV.
  idv?: number;
  // transactionid from the previous premium call — Bajaj requires it when
  // recomputing (e.g. IDV change) and again at issuance.
  transactionId?: string;
  // Where Bajaj sends the customer after its payment page (detariff extcol20).
  // Bajaj's samples send it on both the premium and the issue call.
  returnUrl?: string;
}

export function buildBajajPremiumBody(quoteInput: any, opts: BajajQuoteOptions = {}) {
  const userid = process.env.BAJAJ_USERID;
  const password = process.env.BAJAJ_PASSWORD;
  const branchcode = process.env.BAJAJ_BRANCH_CODE;
  if (!userid || !password || !branchcode) {
    return { error: "Bajaj credentials are not configured (BAJAJ_USERID / BAJAJ_PASSWORD / BAJAJ_BRANCH_CODE)" };
  }

  const rc = quoteInput.rcRaw || {};
  const match = matchBajajVehicle(rc);
  if (!match.ok) return { error: match.reason };
  const v = match.vehicle;

  const regNo = String(rc.reg_no || quoteInput.registrationNumber || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const rto = matchBajajRto(rc.rto_code || regNo.slice(0, 4));
  if (!rto.ok) return { error: rto.reason };

  const isNew = quoteInput.isNew === true || quoteInput.isNew === "true";
  const regIso = quoteInput.registrationDate || rcDateToIso(rc.reg_date);
  if (!isNew && !regIso) return { error: "Registration date is required for Bajaj quote" };

  // Rollover cover starts the day after the old policy ends (or today if it
  // has already lapsed); Bajaj rejects an expiry more than 45 days out.
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const prevExpiryIso = String(quoteInput.previousPolicyExpiryDate || "");
  const prevExpiry = prevExpiryIso ? new Date(`${prevExpiryIso}T00:00:00Z`) : null;
  if (!isNew && !prevExpiry) return { error: "Previous policy expiry date is required for Bajaj quote" };
  if (prevExpiry && prevExpiry.getTime() > addDays(today, 45).getTime()) {
    return { error: "Bajaj quotes only within 45 days of the previous policy's expiry" };
  }
  const start = prevExpiry && prevExpiry >= today ? addDays(prevExpiry, 1) : today;
  const end = addDays(new Date(Date.UTC(start.getUTCFullYear() + 1, start.getUTCMonth(), start.getUTCDate())), -1);

  // Kit "NCB and PREV NCB": no claim -> next slab; claim (or a lapse of more
  // than 90 days) -> no NCB. We don't collect the previous NCB yet, so it is
  // sent as 0, which can only under-state the discount, never over-state it.
  const noClaim = quoteInput.claimDeclaration === "No" && quoteInput.breakinInsurance !== "LBK";
  const prvncb = "0";
  const ncb = noClaim ? "20" : "0";

  // The proposal form's previous insurer / policy number (when given) beat
  // the RC's guess, so the issue call prices against what the customer stated.
  const prevInsurerCode =
    (quoteInput.previousInsurerCode && String(quoteInput.previousInsurerCode)) ||
    bajajPrevInsurerCode(rc.vehicle_insurance_company_name);
  const prevPolicyNo = String(
    quoteInput.previousPolicyNumber || rc.vehicle_insurance_policy_number || "0"
  );

  const yearManf =
    String(rc.vehicle_manufacturing_month_year || "").split("/")[1] ||
    (regIso ? regIso.slice(0, 4) : String(today.getUTCFullYear()));

  const product = isNew ? BAJAJ_4W_PRODUCTS.NEW_BUSINESS : BAJAJ_4W_PRODUCTS.COMPREHENSIVE;

  return {
    body: {
      userid,
      password,
      vehiclecode: v.code,
      city: rto.city,
      weomotpolicyin: {
        contractid: "0",
        poltype: isNew ? 1 : 3, // 1 = new, 3 = non-Bajaj renewal
        product4digitcode: Number(product),
        deptcode: "18",
        branchcode: Number(branchcode),
        termstartdate: bajajDate(start),
        termenddate: bajajDate(end),
        tpfintype: "0",
        hypo: "",
        vehicletypecode: "22",
        vehicletype: "Private Car",
        miscvehtype: "0",
        vehiclemakecode: v.makeCode,
        vehiclemake: v.make,
        vehiclemodelcode: v.modelCode,
        vehiclemodel: v.model,
        vehiclesubtypecode: v.subtypeCode,
        vehiclesubtype: v.subtype,
        fuel: v.fuel,
        zone: rto.zone,
        engineno: "",
        chassisno: "",
        registrationno: isNew ? "NEW" : regNo,
        registrationdate: bajajDate(regIso || today),
        registrationlocation: rto.city,
        regilocother: rto.city,
        carryingcapacity: String(v.seats || 5),
        cubiccapacity: String(v.cc || ""),
        yearmanf: yearManf,
        color: "",
        vehicleidv: opts.idv ? String(Math.round(opts.idv)) : "0",
        ncb: isNew ? "0" : ncb,
        addloading: "0",
        addloadingon: "0",
        spdiscrate: "0",
        elecacctotal: "0",
        nonelecacctotal: "0",
        prvpolicyref: isNew ? "" : prevPolicyNo,
        prvexpirydate: isNew ? "" : bajajDate(prevExpiryIso),
        // Unknown insurer falls back to New India (1); the real one must be
        // captured on the proposal form before issuance.
        prvinscompany: isNew ? "" : prevInsurerCode || "1",
        prvncb: isNew ? "0" : prvncb,
        prvclaimstatus: isNew ? "0" : noClaim ? "0" : "1",
        automembership: "",
        partnertype: "P",
      },
      accessorieslist: [
        {
          contractid: "0",
          acccategorycode: "0",
          acctypecode: "0",
          accmake: "0",
          accmodel: "0",
          acciev: "0",
          acccount: "0",
        },
      ],
      paddoncoverlist: [],
      motextracover: {
        geogextn: "",
        noofpersonspa: "0",
        suminsuredpa: "0",
        suminsuredtotalnamedpa: "0",
        cngvalue: "0",
        noofemployeeslle: "0",
        noofpersonsllo: "0",
        fibreglassvalue: "0",
        sidecarvalue: "0",
        nooftrailers: "0",
        totaltrailervalue: "0",
        voluntaryexcess: "0",
        covernoteno: "",
        covernotedate: "",
        subimdcode: "",
        extrafield1: "",
        extrafield2: "",
        extrafield3: "",
      },
      questlist: [{ questionref: "", contractid: "", questionval: "" }],
      detariffobj: {
        ...Object.fromEntries(
          [
            "vehpurchasetype", "vehpurchasedate", "monthofmfg", "registrationauth", "bodytype",
            "goodstranstype", "natureofgoods", "othergoodsfrequency", "permittype", "roadtype",
            "vehdrivenby", "driverexperience", "clmhistcode", "incurredclmexpcode",
            "driverqualificationcode", "tacmakecode",
          ].map((k) => [k, ""])
        ),
        ...Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`extcol${i + 1}`, ""])),
        extcol8: "MCPA", // compulsory PA cover for the owner-driver
        extcol20: opts.returnUrl || "",
        ...(isNew ? { extcol24: "1" } : {}), // as in Bajaj's own 1825 sample
      },
      transactionid: opts.transactionId || "0",
      transactiontype: "MOTOR_WEBSERVICE",
      contactno: String(quoteInput.mobile || ""),
    },
    product,
    matchedCode: v.code,
    matchedModel: `${v.make} ${v.model} ${v.subtype}`,
    ambiguous: match.ambiguous,
    registrationCity: rto.city,
    previousInsurerAssumed: !isNew && !prevInsurerCode,
  };
}

export interface BajajProposer {
  title: string; // Mr / Mrs / Ms
  firstName: string;
  lastName: string;
  dob: string; // yyyy-mm-dd
  mobile: string;
  email: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  engineNo: string;
  chassisNo: string;
  nomineeName: string;
  nomineeRelation: string;
}

// issuepolicy body (kit "Policy Issaunce Data"): the premium request's own
// weomotpolicyin / lists / detariff — Bajaj says "pass same value as in
// compute premium" — plus the customer, engine/chassis and payment mode.
// `premiumBody` must be the exact body whose premium call returned
// `transactionId`.
export function buildBajajIssueBody(
  premiumBody: any,
  transactionId: string,
  p: BajajProposer
) {
  const line1 = p.address1.slice(0, 100);
  const line2 = (p.address2 || "").slice(0, 100);
  return {
    userid: premiumBody.userid,
    password: premiumBody.password,
    transactionid: transactionId,
    // Seen live on UAT: issuepolicy answers an empty HTTP 200 (server-side
    // crash) if rcptlist has fields or paddoncoverlist is [] — send exactly
    // the kit samples' shapes.
    rcptlist: [{}],
    custdetails: {
      parttempid: "",
      firstname: p.firstName,
      middlename: "",
      surname: p.lastName,
      addline1: line1,
      addline2: line2,
      addline3: p.city.slice(0, 60),
      addline5: p.state.slice(0, 60),
      pincode: p.pincode,
      email: p.email,
      telephone1: "",
      telephone2: "",
      mobile: p.mobile,
      delivaryoption: "",
      poladdline1: line1,
      poladdline2: line2,
      poladdline3: p.city.slice(0, 60),
      poladdline5: p.state.slice(0, 60),
      polpincode: p.pincode,
      password: "",
      cptype: "P",
      profession: "",
      dateofbirth: bajajDate(p.dob),
      availabletime: "",
      institutionname: "",
      existingyn: "N",
      loggedin: "",
      mobilealerts: "",
      emailalerts: "",
      title: p.title,
      partid: "",
      status1: "",
      status2: "",
      status3: "",
    },
    weomotpolicyin: {
      ...premiumBody.weomotpolicyin,
      engineno: p.engineNo.toUpperCase(),
      chassisno: p.chassisNo.toUpperCase(),
    },
    accessorieslist: premiumBody.accessorieslist,
    paddoncoverlist: premiumBody.paddoncoverlist?.length
      ? premiumBody.paddoncoverlist
      : [{ paramdesc: null, paramref: null }],
    // Kit: extrafield1 carries the address pincode at issuance
    motextracover: { ...premiumBody.motextracover, extrafield1: p.pincode },
    premiumdetails: {},
    premiumsummerylist: [],
    questlist: premiumBody.questlist,
    detariffobj: {
      ...premiumBody.detariffobj,
      // Kit: nominee as "~name~relation" (blank sample "~null~null")
      extcol38: `~${p.nomineeName}~${p.nomineeRelation}`,
    },
    potherdetails: {
      imdcode: "", covernoteno: "", leadno: "", ccecode: "", runnercode: "",
      extra1: "", extra2: "", extra3: "", extra4: "", extra5: "",
    },
    premiumpayerid: "0",
    // CC = Bajaj's own payment page; every issuepolicy sample in the kit uses it
    paymentmode: "CC",
  };
}
