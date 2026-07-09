import type { NextApiRequest, NextApiResponse } from "next";

async function getZunoToken() {
  const auth = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
  ).toString("base64");
  const r = await fetch(process.env.ZUNO_TOKEN_URL!, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const d = await r.json();
  return d.access_token;
}

const iso = (d: Date) => d.toISOString().split("T")[0];

// "UP14FY9367" -> parts + spaced form
function parseReg(regRaw: string) {
  const reg = String(regRaw || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  const m = reg.match(/^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{1,4})$/);
  if (!m) return { district: "", series: "", number: "", spaced: regRaw };
  return {
    district: m[2],
    series: m[3],
    number: m[4],
    spaced: `${m[1]} ${m[2]} ${m[3]} ${m[4]}`,
  };
}

// rechargkit "21-02-2027" -> "2027-02-21"
const rcDate = (d: string) => {
  const m = String(d || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST" });
  }

  try {
    const b = req.body;
    const q = b.quoteInput || {};
    const c = b.customer || {};
    const rc = b.rc?.cardData?.result ?? b.rc ?? {};

    console.log("4W FULLQUOTE INPUT", JSON.stringify(b).slice(0, 1500));

    // ===== Registration — hard requirement, fail fast with clear message =====
    const regNoRaw =
      rc.reg_no || q.registrationNumber || q.rcRaw?.reg_no || "";

    if (!regNoRaw) {
      return res.status(400).json({
        success: false,
        message:
          "Vehicle registration number missing — ensure carRcDetails is saved and quoteInput includes registrationNumber.",
      });
    }

    const reg = parseReg(regNoRaw);

    const today = new Date();
    const startDate = iso(today);
    const end = new Date(today);
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);
    const endDate = iso(end);

    // previous policy year (rollover)
    const prevEnd = new Date(today);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    prevStart.setDate(prevStart.getDate() + 1);

    const isNew = q.isNew === true || q.isNew === "true";
    const regDate = q.registrationDate || rcDate(rc.reg_date);
    const vehicleAge = String(
      Math.max(0, new Date().getFullYear() - new Date(regDate).getFullYear())
    );

    const rtoLocationName =
      q.rtoLocationName ||
      (rc.rto_code ? rc.rto_code.replace(/^([A-Z]+)(\d+)$/, "$1-$2") : "");

    const payload = {
      commissionContractId: "1000012208", // confirm your account's ID with Zuno
      branch: "MUMBAI",
      agentEmail:
        process.env.ZUNO_AGENT_EMAIL || "shivakumar.bale@qualitykiosk.com",
      saleManagerCode: process.env.ZUNO_SALE_MANAGER_CODE || "26058",
      saleManagerName: process.env.ZUNO_SALE_MANAGER_NAME || "Rahul B",
      mainApplicantField: "1",

      typeOfBusiness: isNew ? "New" : "Rollover",
      policyType: "Package Policy",
      policyStartDate: startDate,
      policyStartTime: "000100",
      policyEndDay: endDate,
      policyEndTime: "235900",

      // Previous policy — REAL data from RC when available
      previousInsurancePolicy: isNew ? "0" : "1",
      previousInsuranceCompanyName: isNew
        ? ""
        : rc.vehicle_insurance_company_name || "National Insurance Co. Ltd.",
      previousInsuranceCompanyAddress: isNew ? "" : "Mumbai",
      previousPolicyStartDate: isNew ? "" : iso(prevStart),
      previousPolicyEndDate: isNew ? "" : iso(prevEnd),
      previousPolicyNo: isNew
        ? ""
        : rc.vehicle_insurance_policy_number || "123456",
      natureOfLoss: "NA",

      policyTenure: "1",

      make: q.make,
      model: q.model,
      variant: q.variant,
      idvCity: q.idvcity, // fullQuote spec uses idvCity (capital C)
      cubicCapacity: String(rc.vehicle_cubic_capacity || "").replace(".0", ""),
      licencedSeatingCapacity: String(rc.vehicle_seat_capacity || "5") + ".0",
      licencedCarryingCapacity: String(rc.vehicle_seat_capacity || "5") + ".0",
      validLicenceNo: "Y",
      fuelType: q.fuelType || "Petrol",
      newOrUsed: isNew ? "N" : "U",
      yearOfManufacture: regDate.slice(0, 4),
      registrationDate: regDate,
      vehicleAge,
      engineeNumber: rc.engine || q.engineNumber || "", // "engineeNumber" — spec spelling
      chassisNumber: rc.chassis || q.chassisNumber || "",
      fibreGlassFuelTank: "Y",
      bodystyleDescription: q.bodystyleDescription || "HATCHBACK",
      bodyType: rc.body_type || "Saloon",
    transmissionType:
        (b.transmissionType || "").toLowerCase() === "automatic"
          ? "Automatic"
          : "Gear",
      validDrivingLicense: "Y",
      handicapped: "N",
      certifiedVintageCar: "N",

      automobileAssociationMember: "Y",
      antiTheftDeviceInstalled: "Y",
      typeOfDeviceInstalled: "Burglary Alarm",
      automobileAssociationMembershipNumber: "646468",
      automobileAssociationMembershipExpiryDate: endDate,

      // RTO — from master data
      stateCode: q.rtoStateCode,
      districtCode: reg.district,
      vehicleSeriesNumber: reg.series,
      registrationNumber: reg.number,
      vehicleRegistrationNumber: reg.spaced, // "UP 14 FY 9367" — spec format
      rtoState: q.rtoStateCode, // spec sample uses the CODE
      rtoLocationName,
      rtoCityOrDistrict: q.rtoCityOrDistrict,
      clusterZone: q.clusterZone,
      carZone: q.carZone,
      rtoZone: q.rtoZone || q.rtoStateCode,

      // NCB — defaulted; wire real NCB capture later
      protectionofNcbValue: "0",
      transferOfNcb: "N",
      transferOfNcbPercentage: "0",
      proofDocumentDate: startDate,
      proofProvidedForNcb: "NCB Reserving Letter",
      applicableNcbv: "0",

      exshowroomPrice: String(q.exShowroomPrice || ""),
      originalIdvValue: String(q.idv || ""),
      requiredDiscountOrLoadingPercentage: "0.0",
      financeType: "",
      financierName: "",
      branchNameAndAddress: "",

      salutation: c.gender === "Female" ? "Mrs." : "Mr.",
      firstName: c.firstName || c.fullName || "",
      lastName: c.lastName || "Kumar",
      gender: c.gender || "Male",
      policyHolderGender: c.gender || "Male",
      maritalStatus: c.maritalStatus || "SINGLE",
      dateOfBirth: c.dateOfBirth || "1990-01-01",
      currentAddressLine1: c.addressLine1 || "",
      currentAddressLine2: c.addressLine2 || "",
      currentCountry: "IN",
      pincode: c.pincode || "",
      currentCity: c.city || "",
      mobileNumber: String(c.mobile || "").slice(-10),
      emailId: c.email || "",
      occupation: c.occupation || "Salaried",

      nomineeName: c.nomineeName || "",
      relationshipWithApplicant: c.nomineeRelation || "Brother",
      isNomineeMinor: "N",
      nomineeAge: c.nomineeAge || "30",
      nomineeDob: c.nomineeDob || "1994-01-01",

      commissionContractID: "1000012208",
      overrideAllowableDiscount: "N",

      // ===== spec-exact names (lowercase, per fullQuote sample) =====
      renewalstatus: "New Policy",
      annualmileageofthecar: "10000",
      breakininsurance: "No Break",
      typeofGrid: "Grid 1",
      staffCode: "",
driverDetails: {
        nameofDriver: c.firstName || c.fullName || "",
        dateofBirth: c.dateOfBirth || "1990-01-01",
        genderoftheDriver: c.gender || "Male",
        ageofDriver: Number(c.age) ? `${Number(c.age)}.0` : "30.0",
        relationshipwithProposer: "SELF",
        drivingExperienceinyears: "5",
        middleName: "",
        lastName: c.lastName || "Kumar",
      },

      contractDetails: [
        {
          contract: "Own Damage Contract",
          coverage: {
            coverage: "Own Damage Coverage",
            deductible: "Own Damage Basis Deductible",
            discount: ["Auto Mobile Association Discount"],
            subCoverage: [
              {
                subCoverage: "Own Damage Basic",
                limit: "Own Damage Basic Limit",
                idvValue: String(q.idv || ""),
                valueOfAccessory: "",
                accessoryDescription: "",
                valueOfKit: "",
              },
            ],
          },
        },
      ],
    };
    console.log("4W FULLQUOTE KEY FIELDS", {
      vehicleRegistrationNumber: payload.vehicleRegistrationNumber,
      stateCode: payload.stateCode,
      districtCode: payload.districtCode,
      rtoLocationName: payload.rtoLocationName,
      rtoCityOrDistrict: payload.rtoCityOrDistrict,
      idvCity: payload.idvCity,
      make: payload.make,
      model: payload.model,
      variant: payload.variant,
      idv: payload.originalIdvValue,
    });
    console.log("4W FULLQUOTE PAYLOAD", JSON.stringify(payload));

    const token = await getZunoToken();
    console.log("4W FQ TOKEN:", token ? "YES" : "NO");

    const url = `${process.env.ZUNO_MOTOR_URL}/fullQuote`;
    console.log("CALLING", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-api-key": process.env.ZUNO_MOTOR_API_KEY!,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("4W FULLQUOTE STATUS", response.status);
    console.log("4W FULLQUOTE RAW", text.slice(0, 4000));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(response.status).json({ success: response.ok, data });
  } catch (e: any) {
    console.log("4W FULLQUOTE ERROR", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}