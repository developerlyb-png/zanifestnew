// src/pages/api/zuno/cv/full-quote.ts
import type { NextApiRequest, NextApiResponse } from "next";

// =======================
// ZUNO TOKEN
// =======================
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
  // never log the token response
  if (!data.access_token) {
    throw new Error("Zuno token not generated");
  }
  return data.access_token;
}

const todayYmd = () => new Date().toISOString().slice(0, 10);

// =======================
// ZUNO SWAGGER SAMPLE PAYLOAD (for debugging E1005)
// Call the route with { useSample: true } to send this instead of the
// real quotePayload. If this succeeds while the real payload fails,
// the problem is a field difference; if this ALSO fails, Zuno's dev
// fullQuote is broken -> send them both requestIds.
// REMOVE this block once full quote works end to end.
// =======================
const SAMPLE_PAYLOAD = {
  branch: "MAH001",
  numberOfRelationshipsWithEdelweissGroup: 0,
  renewalStatus: "",
  annualMileageOfTheCar: "",
  make: "ASHOK LEYLAND",
  model: "ALPSV",
  variant: "4/161",
  idvCity: "BHUBANESHWAR",
  rtoStateCode: 18,
  rtoLocationName: "OR-27",
  clusterZone: "Cluster 3",
  carZone: "C",
  rtoZone: "Except E Cart",
  rtoCityOrDistrict: "Boudh",
  idv: 2641000,
  registrationDate: "2022-03-03",
  previousInsurancePolicy: 0,
  typeOfBusiness: "New",
  policyType: "Package Policy",
  policyStartDate: todayYmd(), // today, not the stale sample date
  annualMileage: "00000",
  transmissionType: "Manual",
  subPolicyType: "LIAT",
  typeOfPermit: "NAT",
  ageOfTheDriver: 25,
  typeOfLoan: "NLN",
  ownershipOfTheVehicle: "Ind",
  overrideAllowableDiscount: "N",
  fibreGlassFuelTank: "Yes",
  antiTheftDeviceInstalled: "No",
  automobileAssociationMember: "N",
  typeOfGrid: "Grid 1",
  geographicalExtension: "Y",
  foreignEmbassyVehicle: "Y",
  useOfVehicle: "PRI",
  importedVehicleWithoutCustomDuty: "Y",
  drivingTuitionsUsage: "Y",
  typeOfCart: "Except E Cart",
  numberOfWheels: 4,
  vehicleSubClass: "PUBLIC",
  vehicleType: "PCV",
  busType: "SCBUS",
  coverForMotorLampsTyresEtc: "Y",
  indemnityToHirer: "N",
  overturning: "N",
  gpsTracking: "Y",
  licensedCarryingCapacity: 37,
  jarvisId: "Y",
  requestId: "N",
  contractDetails: [
    {
      contract: "Own Damage Contract",
      coverage: {
        coverage: "Own Damage Coverage",
        deductible: "Own Damage Basis Deductible",
        discount: ["Used Confined to own Premises Discount"],
        subCoverage: [
          {
            subCoverage: "Own Damage Basic",
            limit: "Own Damage Basic Limit",
          },
        ],
      },
    },
  ],
};

// =======================
// FULL QUOTE API
// =======================
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
      ownershipOfTheVehicle,
      quickQuoteRequestId,
      quotePayload,
      useSample,
    } = req.body;

    // TEMPORARY DEBUG PATH: send Zuno's own sample payload
    const basePayload = useSample ? SAMPLE_PAYLOAD : quotePayload;

    if (!basePayload) {
      return res.status(400).json({
        success: false,
        message:
          "quotePayload is required (the payload used for the quick quote)",
      });
    }

    const payload = {
  ...basePayload,

  ownershipOfTheVehicle:
    ownershipOfTheVehicle || "Ind",

  policyStartDate: todayYmd(),

  requestId: quickQuoteRequestId,
};


console.log("Quick Quote RequestId:", quickQuoteRequestId);
console.log("Payload RequestId:", payload.requestId);
console.log("Final Payload:");
console.log(JSON.stringify(payload, null, 2));
    const token = await getZunoToken();

    const url = `${process.env.ZUNO_MOTOR_CVI_URL}/fullQuote`;
    console.log("CV FULL QUOTE URL:", url, useSample ? "(SAMPLE PAYLOAD)" : "");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-API-KEY": process.env.ZUNO_CV_KEY!,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("FULL QUOTE STATUS:", response.status);
    console.log("FULL QUOTE RAW:", text.slice(0, 4000));

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    // Zuno timeout
    if (response.status === 500 && text.includes("ETIMEDOUT")) {
      return res.status(503).json({
        success: false,
        message: "Zuno CV full quote service unavailable, please retry",
        zunoError: data,
      });
    }

    return res.status(response.status).json({
      success: response.ok && data?.status !== "error",
      data,
    });
  } catch (error: any) {
    console.log("FULL QUOTE ERROR:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}