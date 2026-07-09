import type { NextApiRequest, NextApiResponse } from "next";

// ================= TOKEN =================
async function getZunoToken() {
  const auth = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${process.env.ZUNO_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

// ================= DATE HELPERS =================
function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function addYears(dateStr: string, years: number, minusOneDay = false) {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  if (minusOneDay) d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// ================= REGISTRATION PARSE =================
function parseReg(vehicle: any) {
  const reg = (vehicle.registrationNumber || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  const m = reg.match(/^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{1,4})$/);
  if (!m) {
    return {
      stateLetters: "",
      districtCode: "",
      seriesNumber: "",
      regNumber: "",
      spaced: vehicle.registrationNumber || "",
    };
  }
  return {
    stateLetters: m[1],
    districtCode: m[2],
    seriesNumber: m[3],
    regNumber: m[4],
    spaced: `${m[1]} ${m[2]} ${m[3]} ${m[4]}`,
  };
}

// ================= BUILD FULL-QUOTE PAYLOAD =================
function buildPayload(ratingData: any, body: any) {
  const vehicle = body.vehicle || {};
  const customer = body.customer || {};
  const rto = vehicle.rto || {};

  const policy = ratingData.policyData || {};
  const ratingContract = ratingData.contractDetails?.[0] || {};
  const io = ratingContract.insuredObject || {};

  const isNew = vehicle.isNewBike === true || vehicle.isNewBike === "true";

  // Dates
  const startDate = policy.policyStartDate || todayStr();
  const endDate =
    ratingData.contractDetails?.[0]?.contractEndDate ||
    addYears(startDate, 1, true);

  const reg = parseReg(vehicle);

  // Vehicle age (consistent with year of manufacture)
  const vehAge = isNew
    ? "0"
    : String(
        new Date().getFullYear() -
          Number(vehicle.year || new Date().getFullYear())
      );

  // Consistent registration / first-purchase date
  const regDate =
    io.dateoffirstpurchaseorregistration ||
    (isNew ? `${vehicle.year}-06-05` : `${vehicle.year}-06-01`);

  // Previous policy (rollover only)
  const prevEnd = addYears(startDate, 0, true); // day before start
  const prevStart = addYears(prevEnd, -1);
  prevStart; // (kept for clarity)

  // ---- Zuno's exact ContractDetails template ----
  const ContractDetails = [
    {
      contract: "Own Damage Contract",
      coverage: {
        coverage: "Own Damage Coverage",
        deductible: [
          "Own Damage Basis Deductible",
          "Voluntary Deductible",
        ],
        voluntaryDeductible: "0",
        discount: [
          "Auto Mobile Association Discount",
          "AntiTheft Discount",
          "No Claim Bonus Discount",
        ],
        subCoverage: [
          {
            subCoverage: "Own Damage Basic",
            limit: "Own Damage Basic Limit",
          },
        ],
      },
    },
    {
      contract: "PA Compulsary Contract",
      coverage: {
        coverage: "PA Owner Driver Coverage",
        subCoverage: {
          subCoverage: "PA Owner Driver",
          limit: "PA Owner Driver Limit",
          sumInsured: "1500000",
        },
      },
    },
    {
      contract: "Third Party Multiyear Contract",
      coverage: {
        coverage: "Legal Liability to Third Party Coverage",
        deductible: "TP Deductible",
        discount: "Third Party Property Damage Discount",
        subCoverage: [
          {
            subCoverage: "Third Party Basic Sub Coverage",
            limit: "Third Party Property Damage Limit",
            thirdPartyPropertyDamageLimit: "6000",
          },
        ],
      },
    },
  ];

  return {
    source: "",
    branch: rto.rtocityordistrict || io.idvCity || "AHMEDABAD",
    subIntermediaryCategory: "",
    subIntermediaryCode: "",
    subIntermediaryName: "",
    subIntermediaryPhoneorEmail: "",
    pospPanAadharNo: "",
    businessSourceUniqueId: "",
    accountNo: "",
    agentName: "",
    agentEmail:
      process.env.ZUNO_AGENT_EMAIL || "shivakumar.bale@qualitykiosk.com",
    float: "",
    saleManagerCode: process.env.ZUNO_SALE_MANAGER_CODE || "26058",
    saleManagerName: process.env.ZUNO_SALE_MANAGER_NAME || "Rahul B",
    mainApplicantField: "1",

    typeOfBusiness: isNew ? "New" : "Rollover",
    policyType: "Package Policy",
    subPolicyType: "",

    policyStartDate: startDate,
    policyStartTime: "000000",
    policyEndDay: endDate,
    policyEndTime: "235900",

    previousInsurancePolicy: isNew ? "0" : "1",
    policyHolderGender: "Male",
    policyHolderOccupation: "Low to Medium",
    kindOfPolicy: "Package With AddOn",

    previousInsuranceCompanyName: isNew ? "" : "National Insurance Co. Ltd.",
    previousInsuranceCompanyAddress: isNew ? "" : "Mumbai",
    previousPolicyStartDate: isNew ? "" : prevStart,
    previousPolicyEndDate: isNew ? "" : prevEnd,
    previousPolicyNo: isNew ? "" : "PREV000001",
    natureOfLoss: isNew ? "" : "Liability/Third Party",
    previousClaimMade: isNew ? "" : "N",

    policyTenure: "1",

    make: vehicle.make,
    model: vehicle.model,
    variant: vehicle.variant,
    idvCity: io.idvCity || rto.idvcity || "AHMEDABAD",
    cubicCapacity:
      io.cubiccapacity || String(vehicle.capacity || "").replace(".0", "").replace(".00", ""),
    licencedCarryingCapacity: String(vehicle.seatingCapacity || "2"),
    validLicenceNo: "Y",
    fuelType: vehicle.fuelType || "Petrol",
    newOrUsed: isNew ? "New" : "Used",
    yearOfManufacture: String(vehicle.year),
    registrationDate: regDate,
    vehicalAge: vehAge, // NOTE: Zuno's spelling (vehicalAge)

    engineNumber: vehicle.engineNumber,
    chassisNumber: vehicle.chassisNumber,
    fibreGlassFuelTank: "Y",
    bodystyleDescription: io.bodystyleDescription || "",
    bodyType: "",
    transmissionType: "",
    validDrivingLicense: "",
    handicapped: "N",
    certifiedVintageCar: "N",

    automobileAssociationMember: "Y",
    antiTheftDeviceInstalled: "Y",
    typeOfDeviceInstalled: "Burglary Alarm",
    automobileAssociationMembershipNumber: "454545",
    automobileAssociationMembershipExpiryDate: addYears(todayStr(), 1),

    // RTO — from master data, state-aware (NOT hardcoded Gujarat)
    stateCode: io.rtoStateNameandCode || rto.statecode || "06",
    districtCode: reg.districtCode || rto.districtcode || "01",
    vehicleSeriesNumber: reg.seriesNumber,
    registrationNumber: reg.regNumber,
    vehicleRegistrationNumber: reg.spaced,
    rtoLocationName: io.rtoLocationName || rto.rtolocation || `${reg.stateLetters}-${reg.districtCode}`,
    rtoState: rto.rtostate || reg.stateLetters,
    rtoCityOrDistrict: io.rtoCityorDistrict || rto.rtocityordistrict || "Ahmedabad",
    clusterZone: rto.clusterzone || "Cluster 3",
    carZone: rto.carzone || "A",
    rtoZone: io.rtoZone || rto.rtozone || rto.statecode || "06",

    transferOfNCB: isNew ? "N" : "N",
    applicableNCB: "0",

    originalIDVValue: io.systemIdv || vehicle.idv,
    financeType: "",
    financierName: "",
    branchNameAndAddress: "",

    salutation: "Mr.",
    firstName: customer.fullName,
    middleName: "",
    lastName: "Kumar",
    gender: "Male",
    maritalStatus: "Single",
    dateOfBirth: "1995-06-19",
    nationality: "IN",

    currentAddressLine1: "187/A",
    currentAddressLine2: "Tent Road",
    currentAddressLine3: "RM Nagara",
    currentCountry: "IN",
    pincode: "560016",
    currentCity: "Bengaluru",
    currentState: "13",
    street: "Tent Road",
    area: "RM Nagara",
    location: "ShivajiNagar",
    pan: "",
    gstNo: "",
    aadharNo: "",

    mobileNumber: String(customer.mobile || "").slice(-10),
    emailId: customer.email,
    commissionContractID:
      ratingData.commisionDetails?.commissionContractId || "1000014234",
    occupation: "Salaried",

    nomineeName: "Kumar",
    relationshipWithApplicant: "Father",
    other: "",
    isNomineeMinor: "N",
    nomineeDOB: "1994-05-25",
    nomineeAge: "30",
    guardianName: "",

    overrideAllowableDiscount: "N",
    inspectionNumber: "",
    policyNumber: "",
    renewalstatus: isNew ? "New Policy" : "Rollover",
    annualmileageofthecar: "10000",
    breakininsurance: isNew ? "No Break" : "No Break",
    typeofGrid: policy.typeofGrid || "GRID 1", // NOTE: space
    staffCode: "",

    driverDetails: {
      nameofDriver: customer.fullName,
      dateofBirth: "1995-06-19",
      genderofTheDriver: "Male",
      ageOfDriver: "30",
      relationshipwithProposer: "SELF",
      driverExperienceinyears: "5",
      middleName: "",
      lastName: "Kumar",
    },

    ContractDetails, // CAPITAL C — this was the killer bug
  };
}

// ================= HANDLER =================
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false });
    }

    const ratingData = req.body.quote;
    if (!ratingData) {
      return res
        .status(400)
        .json({ success: false, message: "quote (rating data) missing" });
    }

    const token = await getZunoToken();
    const payload = buildPayload(ratingData, req.body);

    console.log("FULL QUOTE PAYLOAD >>>", JSON.stringify(payload));

    const response = await fetch(
      `${process.env.ZUNO_BASE_URL}/motor-two-wheeler/full-quote`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": process.env.ZUNO_X_API_KEY!,
        },
        body: JSON.stringify(payload),
      }
    );

    const text = await response.text();
    console.log("FULL QUOTE STATUS", response.status);
    console.log("FULL QUOTE RAW", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(response.status).json({ success: response.ok, data });
  } catch (error: any) {
    console.log("FULL QUOTE ERROR", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}