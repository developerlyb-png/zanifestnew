// src/pages/api/zuno/cv/full-quote.ts
//
// Built on the UAT collection fullQuote contract. The quote payload (qp)
// now already carries correct business type (Rollover/New), dates, vehicle
// class, fuel, CC, IDV and contracts — fullQuote inherits those and adds
// the proposal-level fields (proposer, nominee, driver, chassis/engine).

import type { NextApiRequest, NextApiResponse } from "next";

async function getZunoToken() {
  const auth = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${process.env.ZUNO_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-API-KEY": process.env.ZUNO_CV_KEY!,
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();
  if (!data.access_token) throw new Error("Zuno token not generated");
  return data.access_token;
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const todayYmd = () => ymd(new Date());
const addDaysYmd = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00.000Z`);
  if (isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + days);
  return ymd(d);
};
const oneYearMinusOneDay = (startDate = todayYmd()) => {
  const d = new Date(`${startDate}T00:00:00.000Z`);
  if (isNaN(d.getTime())) return "";
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(d.getUTCDate() - 1);
  return ymd(d);
};
const vehicleAgeAt = (registrationDate: string, policyStartDate: string) => {
  const reg = new Date(`${registrationDate}T00:00:00.000Z`);
  const start = new Date(`${policyStartDate}T00:00:00.000Z`);
  if (isNaN(reg.getTime()) || isNaN(start.getTime())) return 0;
  let age = start.getUTCFullYear() - reg.getUTCFullYear();
  const monthDiff = start.getUTCMonth() - reg.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && start.getUTCDate() < reg.getUTCDate())
  ) {
    age--;
  }
  return Math.max(0, age);
};
const ageFromDob = (dob: string) => {
  const b = new Date(dob);
  if (isNaN(b.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
};
const parseJson = (text: string) => {
  try {
    return text ? JSON.parse(text) : { message: "EMPTY_RESPONSE" };
  } catch {
    return { message: "JSON_PARSE_FAILED", raw: text };
  }
};
const cleanRegNo = (regNo: string) =>
  String(regNo || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
const parseRegistration = (regNo: string) => {
  const clean = cleanRegNo(regNo);
  const match = clean.match(/^([A-Z]{2,3})(\d{1,3})([A-Z]{0,3})(\d{4,5})$/);
  if (!match) {
    return {
      clean,
      state: "",
      district: "",
      series: "",
      number: "",
    };
  }
  return {
    clean,
    state: match[1],
    district: match[2],
    series: match[3],
    number: match[4],
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Only POST allowed" });
    }

    const {
      quotePayload: qp,
      rcDetails: rc = {},
      vehicleNumber = "",
      proposer,
      nominee,
      ownershipOfTheVehicle,
      quotePolicyNumber, // policyNumber from the /quote response, if present
      quoteRequestId,
    } = req.body;

    if (!qp) {
      return res.status(400).json({
        success: false,
        message: "quotePayload is required (from the quick quote step)",
      });
    }
    if (!proposer?.firstName || !proposer?.dateOfBirth || !proposer?.pincode) {
      return res.status(400).json({
        success: false,
        message:
          "proposer details are required (firstName, dateOfBirth, pincode ...)",
      });
    }
    if (!nominee?.name || !nominee?.dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "nominee details are required (name, dateOfBirth ...)",
      });
    }

    const rtoCode = String(qp.rtoLocationName || "").replace(/[-\s]/g, "");
    const reg = parseRegistration(vehicleNumber);
    const districtCode =
      reg.district || String(qp.rtoLocationName || "").split("-")[1] || "01";
    const fullName = `${proposer.firstName} ${proposer.lastName || ""}`.trim();
    const isRollover = qp.typeOfBusiness === "Rollover";
    const registrationNumber = isRollover ? reg.number || reg.clean : "";
    const vehicleRegistrationNumber = isRollover
      ? reg.clean || rtoCode
      : rtoCode;
    const previousPolicyEndDate =
      qp.previousPolicyEndDate || qp.previousPolicyExpiryDate || "";
    const previousPolicyStartDate = qp.previousPolicyStartDate || "";
    const previousInsurancePolicy =
      qp.previousInsurancePolicy || (previousPolicyEndDate ? "1" : "0");
    const previousPolicyNo =
      String(
        rc.previousPolicyNumber ||
          rc.policyNumber ||
          qp.previousPolicyNo ||
          ""
      ).trim() || (previousInsurancePolicy === "1" ? "UNKNOWNPOLICY" : "");
    const fullQuotePolicyStartDate =
      isRollover && previousPolicyEndDate && previousPolicyEndDate >= todayYmd()
        ? addDaysYmd(previousPolicyEndDate, 1)
        : todayYmd();
    const fullQuotePolicyEndDate = oneYearMinusOneDay(
      fullQuotePolicyStartDate
    );
    const vehicleAge = vehicleAgeAt(
      qp.registrationDate,
      fullQuotePolicyStartDate
    );

    // ============================================================
    // FULL QUOTE PAYLOAD (UAT collection contract). Everything the
    // quote payload already knows is inherited from qp.
    // ============================================================
    const payload: any = {
      source: process.env.ZUNO_FQ_SOURCE || "MOE",
      channelCode: qp.channelCode,
      agentEmail: qp.agentEmail,
      saleManagerCode: "",
      saleManagerName: qp.saleManagerName,
      mainApplicantField: 1,
      typeOfBusiness: qp.typeOfBusiness,
      policyType: qp.policyType,
     subPolicyType: qp.subPolicyType || "LIAT",
      policyStartDate: fullQuotePolicyStartDate,
      policyStartTime: "120000",
      policyEndDay: fullQuotePolicyEndDate,
      policyEndTime: "235900",
      previousInsurancePolicy,
      kindOfPolicy: "Package WithOut AddOn",
      previousInsuranceCompanyName: isRollover
        ? rc.previousInsurer || "NA"
        : "",
      previousInsuranceCompanyAddress: "NA",
      previousPolicyStartDate,
      previousPolicyEndDate,
      previousPolicyExpiryDate: previousPolicyEndDate,
      previousClaimsMade: qp.PreviousClaimMade || qp.previousClaimsMade || "N",
      natureOfLoss: "NA",
      policyTenure: qp.policyTenure || "1",
      contractTenure: qp.contractTenure || "1",
      CATenure: qp.CATenure || qp.caTenure || "1",

      make: qp.make,
      model: qp.model,
      variant: qp.variant,
      idvCity: qp.idvCity,
      cubicCapacity: qp.cubicCapacity,
      licencedCarryingCapacity: qp.licencedCarryingCapacity,
      licencedSeatingCapacity: qp.licencedSeatingCapacity,
      validLicenceNo: "Y",
      fuelType: qp.fuelType,
      newOrUsed: qp.newOrUsed || "New",
      yearOfManufacture: qp.yearOfManufacture,
      registrationDate: qp.registrationDate,
      vehicleAge: String(vehicleAge),
      fibreGlassFuelTank: qp.fibreGlassFuelTank || "N",
      bodyType: "",
      colourofVehicle: "",
      bodystyleDescription: qp.bodystyleDescription || "",
      transmissionType: qp.transmissionType || "",
      validDrivingLicense: "Y",
      handicapped: "N",
      certifiedVintageCar: "N",
      importedVehiclewithoutCustomduty: "N",
      drivingTuitionsUsage: qp.drivingTuitionsUsage || "N",
      extensionCountrynames: "",
      locationforparkingduringtheday: "LOCK",
      locationforparkingduringthenight: "LOCK",
      antiTheftDeviceInstalled: "N",
      typeOfDeviceInstalled: "",
      stateCode: qp.stateCode,
      rtoStateCode: qp.rtoStateCode || qp.stateCode,
      foreignEmbassyVehicle: "N",
      useOfVehicle: qp.useOfVehicle || "PRI",
      districtCode,
      vehicleSeriesNumber: isRollover ? reg.series : "",
      registrationNumber,
      vehicleRegistrationNumber,
      rtoLocationName: qp.rtoLocationName,
      rtoState: qp.rtoState,
      rtoCityOrDistrict: qp.rtoCityOrDistrict,
      clusterZone: qp.clusterZone,
      carZone: "A",
      rtoZone: "A",

      protectionofNCBValue: "",
      transferOfNCB: "N",
      transferOfNCBPercentage: "",
      ncbreservingletterdate: "",
      proofProvidedForNCB: "",
      exshowroomPrice: qp.exshowroomPrice,
      originalIDVValue: qp.idv,
      idv: qp.idv,
      requiredDiscountOrLoadingPercentage:
        qp.requiredDiscountOrLoadingPercentage || "0",
      financeType: "",
      financierName: "",
      branchNameAndAddress: "",

      salutation: proposer.gender === "Female" ? "Ms." : "Mr.",
      firstName: proposer.firstName,
      middleName: "",
      lastName: proposer.lastName || "",
      gender: proposer.gender || "Male",
      policyHolderGender: proposer.gender || "Male",
      maritalStatus: "",
      dateOfBirth: proposer.dateOfBirth,
      currentAddressLine1: proposer.address1,
      currentAddressLine2: proposer.address2 || proposer.address1,
      currentAddressLine3: proposer.address3 || proposer.address1,
      currentCountry: "IN",
      nationality: "IN",
      address: proposer.address1,
      pincode: String(proposer.pincode),
      currentCity: proposer.city || "",
      currentState: String(proposer.stateCode || qp.stateCode),
      street: "",
      area: "",
      location: "",
      pan: proposer.pan || "",
      gstNo: "",
      aadharNo: "",
      mobileNumber: String(proposer.mobile || ""),
      emailId: proposer.email || "",
      occupation: "salaried", // per UAT PCV fullQuote sample; confirm enum list

      nomineeName: nominee.name,
      relationshipWithApplicant: nominee.relationship || "Father",
      isNomineeMinor: ageFromDob(nominee.dateOfBirth) < 18 ? "Y" : "N",
      nomineeAge: ageFromDob(nominee.dateOfBirth),
      nomineeDOB: nominee.dateOfBirth,
      guardianName: "",
      other: "",

      commissionContractID: qp.commissionContractID,
      overrideIDV: "Y",
      overrideAllowableDiscount: qp.overrideAllowableDiscount || "N",
      inspectionNumber: "",
      renewalstatus: qp.renewalStatus || "New Policy",
      renewalStatus: qp.renewalStatus || "New Policy",
      annualMileageoftheCar: qp.annualMileage || "00000",
      annualMileage: qp.annualMileage || "00000",
      breakininsurance: qp.breakininsurance || "No Break",
      typeOfGrid: qp.typeOfGrid || "Grid 1",
      staffCode: process.env.ZUNO_STAFF_CODE || "MI1005967",
      fleet: 1,
      typeofPermit: "NAT",
      typeOfLoan: "NLN",
      ownershipOfTheVehicle:
        ownershipOfTheVehicle || qp.ownershipOfTheVehicle || "Ind",
      numberofrelationshipswithEdelweissGroup: "",
      requiredDiscount: "",
      ageofPolicyholder: "",
      typeOfCart: "Except E Cart",
      revisedGVW: qp.revisedGVW,
      vehicleSubClass: qp.vehicleSubClass,
      vehicleSubType: "",
      vehicleType: qp.vehicleType,
      busType: qp.busType || "",
      coverformotorlampstyresetcIMT23:
        qp.CoverformotorlampstyresetcImt23 || "N",
      indemnitytoHirerIMT36: qp.indemnityToHirer || "N",
      overturningIMT47: qp.overturning || "N",
      gpsTracking: qp.gpsTracking || "N",

      driverDetails: {
        nameOfDriver: fullName,
        dateOfBirth: proposer.dateOfBirth,
        genderoftheDriver: proposer.gender || "Male",
        relationshipWithProposer: "Self",
        drivingExperienceinyears: 1,
        lastName: proposer.lastName || proposer.firstName,
      },

      // Inherit the SAME contracts the quote was rated with
      contractDetails: qp.contractDetails,

      caTenure: "1",
      chassisNumber: rc.chassisNumber || "",
      chassisNo: rc.chassisNumber || "",
      engineeNumber: rc.engineNumber || "",
      engineNumber: rc.engineNumber || "",
      foreignEmbassyRegistrationNo: "",
      trailerChasisNumber: "",
      multipleTrailerChassis2: "",
      multipleTrailerChassis3: "",
      multipleTrailerChassis4: "",
      multipleTrailerChassis5: "",
      trailerRegistrationNumber: "",
      multipleTrailerRegNumbers2: "",
      multipleTrailerRegNumbers3: "",
      multipleTrailerRegNumbers4: "",
      multipleTrailerRegNumbers5: "",
      averageDailyuseofthevehicle: 1,
      previousPolicyNo,
      subIntermediaryCategory: "",
      subIntermediaryCode: "",
      subIntermediaryName: "",
      subIntermediaryPhoneorEmail: "",
      POSPPANorAadharNo: "",
      BusinessSourceUniqueId: "",
      accountNo: "",
      subIntermediaryState: "",
      subIntermediaryCity: "",
      uwBypassFlag: "N",
    };

    // UAT fullQuote samples include policyNumber from the quote response
    if (quotePolicyNumber) {
      payload.policyNumber = quotePolicyNumber;
    }
    if (quoteRequestId) {
      payload.requestId = quoteRequestId;
    }

    console.log("FULL QUOTE PAYLOAD:", JSON.stringify(payload).slice(0, 2000));

    const token = await getZunoToken();

    const url = `${process.env.ZUNO_MOTOR_CVI_URL}/fullQuote`;
    console.log("CV FULL QUOTE URL:", url);

    const callFullQuote = async (p: any) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-API-KEY": process.env.ZUNO_CV_KEY!,
          Accept: "application/json",
        },
        body: JSON.stringify(p),
      });

      return { status: response.status, text: await response.text() };
    };
console.log({
  subPolicyType: payload.subPolicyType,
  occupation: payload.occupation,
  bodyType: payload.bodyType,
  antiTheftDeviceInstalled: payload.antiTheftDeviceInstalled,
  fibreGlassFuelTank: "N",
  chassisNumber: payload.chassisNumber,
  engineeNumber: payload.engineeNumber,
  driverDetails: payload.driverDetails,
});
    const attempts: string[] = ["base"];
    let { status, text } = await callFullQuote(payload);

    if (
      status === 500 &&
      text.includes("E1205") &&
      isRollover &&
      payload.newOrUsed === "Used"
    ) {
      payload.newOrUsed = "New";
      attempts.push("newOrUsed:New");
      ({ status, text } = await callFullQuote(payload));
    }

    if (
      status === 500 &&
      text.includes("E1205") &&
      payload.vehicleType === "GCV" &&
      payload.vehicleSubClass !== "PUBLIC"
    ) {
      payload.vehicleSubClass = "PUBLIC";
      attempts.push("vehicleSubClass:PUBLIC");
      ({ status, text } = await callFullQuote(payload));
    }

    console.log("FULL QUOTE ATTEMPTS:", attempts.join(" -> "));
    console.log("FULL QUOTE STATUS:", status);
    console.log("FULL QUOTE RAW:", text.slice(0, 6000));

    const data = parseJson(text);

    if (status === 500 && text.includes("ETIMEDOUT")) {
      return res.status(503).json({
        success: false,
        message: "Zuno CV full quote service unavailable, please retry",
        zunoError: data,
      });
    }

    return res.status(status).json({
      success: status >= 200 && status < 300 && data?.status !== "error",
      data,
      attempts,
      payloadUsed: payload,
    });
  } catch (error: any) {
    console.log("FULL QUOTE ERROR:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
