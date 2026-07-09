// src/pages/api/zuno/cv/quick-quote.ts
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

// Normalize RC registration dates to YYYY-MM-DD.
// Handles: "2022-03-03", "03-03-2022", "03/03/2022", "3-Mar-2022", "03-MAR-2022"
const MONTHS: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
  JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
};
function toYmd(d: string): string | null {
  const s = String(d || "").trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); // already ISO
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/); // DD-MM-YYYY
  if (m)
    return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;

  m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})$/); // DD-MMM-YYYY
  if (m) {
    const mm = MONTHS[m[2].toUpperCase()];
    if (mm) return `${m[3]}-${mm}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

// =======================
// VEHICLE TYPE DERIVATION
// Derive Zuno vehicle-type fields from RC classification.
// !! The GCV enum values below are PLACEHOLDERS — confirm the exact
// accepted values with Zuno (question 3 in the support email), then
// update the strings. The detection logic itself is ready.
// =======================
function deriveVehicleFields(body: any) {
  const cls = String(body.vehicleClass || "").toUpperCase();
  const cat = String(body.vehicleCategory || "").toUpperCase();
  const variantStr = String(body.variant || body.varient || "").toUpperCase();

  const isGoods =
    /GOODS|TRUCK|TANKER|TIPPER|TRAILER/.test(cls) ||
    /HGV|MGV|LGV/.test(cat) ||
    /GVW|TANKER|TIPPER/.test(variantStr);

  if (isGoods) {
    return {
      vehicleType: "GCV", // TODO: confirm enum with Zuno
      vehicleSubClass: "PUBLIC", // TODO: confirm (public/private carrier)
      busType: "", // TODO: confirm what GCV expects here
      licensedCarryingCapacity:
        Number(String(body.grossWeight || "").replace(/\D/g, "")) || 0, // TODO: confirm GVW vs payload capacity
    };
  }

  // Passenger vehicle (bus) — current working defaults
  return {
    vehicleType: "PCV",
    vehicleSubClass: "PUBLIC",
    busType: "SCBUS",
    licensedCarryingCapacity: Number(body.seatingCapacity) || 37,
  };
}

// =======================
// QUICK QUOTE API
// =======================
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Only POST allowed" });
    }

    console.log("CV QUICK URL:", `${process.env.ZUNO_MOTOR_CVI_URL}/quote`);

    const { make, model, yearOfPurchase, rtoDetails } = req.body;
    const variant = req.body.variant || req.body.varient;

    // RTO comes from the frontend in camelCase (mapRto shape); accept
    // lowercase as fallback for any older stored data.
    if (!rtoDetails) {
      return res.status(400).json({
        success: false,
        message: "rtoDetails is required. Select an RTO before quoting.",
      });
    }
    const rto = {
      idvCity: rtoDetails.idvCity || rtoDetails.idvcity || "",
      rtoStateCode: Number(
        rtoDetails.rtoStateCode ?? rtoDetails.statecode ?? 0
      ),
      rtoLocationName:
        rtoDetails.rtoLocationName || rtoDetails.rtolocation || "",
      clusterZone: rtoDetails.clusterZone || rtoDetails.clusterzone || "",
      carZone: rtoDetails.carZone || rtoDetails.carzone || "",
      rtoCityOrDistrict:
        rtoDetails.rtoCityOrDistrict || rtoDetails.rtocityordistrict || "",
    };
    if (!rto.idvCity || !rto.rtoStateCode) {
      return res.status(400).json({
        success: false,
        message: "rtoDetails is incomplete (idvCity / rtoStateCode missing)",
      });
    }

    // Real RC registration date, normalized; fallback to year-03-03
    const regDate =
      toYmd(req.body.registrationDate) || `${yearOfPurchase}-03-03`;

    const token = await getZunoToken();

    // =======================
    // FINAL ZUNO CV PAYLOAD
    // =======================
    const payload: any = {
      branch: "",
      numberOfRelationshipsWithEdelweissGroup: 0,
      renewalStatus: "",
      annualMileageOfTheCar: "",

      // VEHICLE MASTER
      make: make,
      model: model,
      variant: variant,

      // RTO DETAILS
      idvCity: rto.idvCity,
      rtoStateCode: rto.rtoStateCode,
      rtoLocationName: rto.rtoLocationName,
      clusterZone: rto.clusterZone,
      carZone: rto.carZone,
      rtoZone: "Except E Cart",
      rtoCityOrDistrict: rto.rtoCityOrDistrict,

      // IDV — accept from client (cvIdvDetails) when available
      // TODO: wire the /cv/idv response through instead of this fallback
      idv: Number(req.body.idv) || 2641000,

      // POLICY
      registrationDate: regDate,
      previousInsurancePolicy: 0,
      typeOfBusiness: "New",
      policyType: "Package Policy",
      policyStartDate: todayYmd(),
      annualMileage: "00000",
      transmissionType: "Manual",
      subPolicyType: "LIAT",
      typeOfPermit: "NAT",

      // OWNER
      ageOfTheDriver: 25,
      typeOfLoan: "NLN",
      ownershipOfTheVehicle: req.body.ownershipOfTheVehicle || "Ind",

      // FLAGS
      overrideAllowableDiscount: "N",
      fibreGlassFuelTank: "Y",
      antiTheftDeviceInstalled: "N",
      automobileAssociationMember: "N",
      typeOfGrid: "Grid1",
      geographicalExtension: "Y",
      foreignEmbassyVehicle: "Y",
      useOfVehicle: "PRI",
      importedVehicleWithoutCustomDuty: "Y",
      drivingTuitionsUsage: "Y",

      // VEHICLE TYPE — derived from RC classification (GCV vs PCV)
      typeOfCart: "Except E Cart",
      numberOfWheels: Number(req.body.numberOfWheels) || 4,
      ...deriveVehicleFields(req.body),

      // EXTRA COVERS
      coverForMotorLampsTyresEtc: "Y",
      indemnityToHirer: "N",
      overturning: "N",
      gpsTracking: "Y",
      jarvisId: "Y",
      requestId: "N",

      // CONTRACT
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

    console.log("FINAL CV QUICK PAYLOAD:", JSON.stringify(payload));

    const response = await fetch(`${process.env.ZUNO_MOTOR_CVI_URL}/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-API-KEY": process.env.ZUNO_CV_KEY!,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("CV STATUS:", response.status);

    const text = await response.text();
    console.log("====== ZUNO RAW START ======");
    console.log(text.slice(0, 4000));
    console.log("====== ZUNO RAW END ======");

    let data: any;
    try {
      data = text
        ? JSON.parse(text)
        : { message: "EMPTY_RESPONSE_FROM_ZUNO", status: response.status };
    } catch {
      data = { message: "JSON_PARSE_FAILED", raw: text };
    }

    if (response.status === 500 && text.includes("ETIMEDOUT")) {
      return res.status(500).json({
        success: false,
        message: "Zuno internal rating timeout",
        retry: true,
        zunoError: data,
      });
    }

    return res.status(response.status).json({
      success: response.ok && data?.status !== "error",
      data: data,
      payloadUsed: payload, // CV5 stores this; full-quote reuses it
    });
  } catch (error: any) {
    console.log("CV ERROR", error);
    return res.status(500).json({ message: error.message, success: false });
  }
}