// src/pages/api/zuno/cv/quick-quote.ts
//
// REBUILT on the real /motor-cv/quote contract from Zuno's UAT collection
// (PCV/GCV samples): package payload with commissionContractID,
// IDV/exshowroom upfront, and Rollover support for used vehicles.
// Returns the REAL premium (OD + TP + PA), not the OD-only toy
// number the old stripped payload produced.

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
  if (!data.access_token) throw new Error("Zuno token not generated");
  return data.access_token;
}

const todayYmd = () => new Date().toISOString().slice(0, 10);
const addYearsYmd = (ymd: string, years: number, extraDays = 0) => {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  if (isNaN(d.getTime())) return "";
  d.setUTCFullYear(d.getUTCFullYear() + years);
  d.setUTCDate(d.getUTCDate() + extraDays);
  return d.toISOString().slice(0, 10);
};

const MONTHS: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
  JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
};
function toYmd(d: string): string | null {
  const s = String(d || "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})$/);
  if (m) {
    const mm = MONTHS[m[2].toUpperCase()];
    if (mm) return `${m[3]}-${mm}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

const normalizeFuel = (f: string) => {
  const s = String(f || "").toUpperCase();
  if (s.includes("DIESEL")) return "DIESEL";
  if (s.includes("CNG")) return "CNG";
  if (s.includes("LPG")) return "LPG";
  if (s.includes("ELECTRIC") || s.includes("BATTERY")) return "ELECTRIC";
  if (s.includes("PETROL")) return "PETROL";
  return "DIESEL";
};

const parseJson = (text: string) => {
  try {
    return text ? JSON.parse(text) : { message: "EMPTY_RESPONSE" };
  } catch {
    return { message: "JSON_PARSE_FAILED", raw: text };
  }
};

// GCV vs PCV from RC classification (GCVPU confirmed from UAT collection)
function deriveVehicleFields(body: any) {
  const cls = String(body.vehicleClass || "").toUpperCase();
  const cat = String(body.vehicleCategory || "").toUpperCase();
  const variantStr = String(body.variant || body.varient || "").toUpperCase();

  const isGoods =
    /GOODS|TRUCK|TANKER|TIPPER|TRAILER/.test(cls) ||
    /HGV|MGV|LGV/.test(cat) ||
    /GVW|TANKER|TIPPER/.test(variantStr);

  if (isGoods) {
    return { vehicleType: "GCV", vehicleSubClass: "GCVPU", busType: "" };
  }
  return { vehicleType: "PCV", vehicleSubClass: "PUBLIC", busType: "" };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Only POST allowed" });
    }

    const { make, model, yearOfPurchase, rtoDetails } = req.body;
    const variant = req.body.variant || req.body.varient;

    if (!rtoDetails) {
      return res.status(400).json({
        success: false,
        message: "rtoDetails is required. Select an RTO before quoting.",
      });
    }
    const rto = {
      idvCity: rtoDetails.idvCity || rtoDetails.idvcity || "",
      rtoStateCode: String(
        rtoDetails.rtoStateCode ?? rtoDetails.statecode ?? ""
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

    // ---- vehicle facts (from RC via CV5) ----
    const regDate =
      toYmd(req.body.registrationDate) ||
      `${yearOfPurchase || new Date().getFullYear()}-01-01`;
    const regYear = Number(String(regDate).slice(0, 4));
    const currentYear = new Date().getFullYear();

    // Rollover for anything not registered this year (UAT collection enum)
    const isRollover = regYear < currentYear;

    // Break-in: if RC insurance is still valid -> "No Break", else "LBK"
    const insUpto = toYmd(req.body.insuranceUpto || "");
    const breakin = !isRollover
      ? "No Break"
      : insUpto && insUpto >= todayYmd()
      ? "No Break"
      : "LBK";

    // /cv/idv is the authoritative master source for this vehicle
    // (idv, exshowroom, fuel, cc). Shape is defensive until confirmed —
    // check the CV IDV DETAILS log and tighten the key picks.
    const idvD = req.body.idvDetails || {};
    const idvRow = Array.isArray(idvD)
      ? idvD[0] || {}
      : idvD.data?.[0] || idvD.data || idvD;

    const masterFuel =
      idvRow.fuelType || idvRow.fuel || req.body.masterFuelType || "";
    const fuel = masterFuel
      ? normalizeFuel(String(masterFuel))
      : normalizeFuel(req.body.fuelType);
    const cc = String(
      idvRow.capacity ||
        idvRow.cubicCapacity ||
        idvRow.cc ||
        req.body.cubicCapacity ||
        "2255"
    );
    const seats = String(
      idvRow.seatingCapacity || req.body.seatingCapacity || "2"
    );
    const gvw =
      Number(String(req.body.grossWeight || "").replace(/\D/g, "")) || 0;
    const licensedCapacity = gvw ? String(gvw) : seats;

    // ---- IDV / exshowroom (from /cv/idv when available) ----
    const vehicleAge = new Date().getFullYear() - regYear;

    let selectedIdv = "";

    if (idvRow.idvAmount) {
      if (vehicleAge <= 0) selectedIdv = idvRow.idvAmount.upto6Months;
      else if (vehicleAge === 1) selectedIdv = idvRow.idvAmount.upto1Year;
      else if (vehicleAge === 2) selectedIdv = idvRow.idvAmount.upto2Year;
      else if (vehicleAge === 3) selectedIdv = idvRow.idvAmount.upto3Year;
      else if (vehicleAge === 4) selectedIdv = idvRow.idvAmount.upto4Year;
      else if (vehicleAge === 5) selectedIdv = idvRow.idvAmount.upto5Year;
      else if (vehicleAge === 6) selectedIdv = idvRow.idvAmount.upto6Year;
      else if (vehicleAge === 7) selectedIdv = idvRow.idvAmount.upto7Year;
      else if (vehicleAge === 8) selectedIdv = idvRow.idvAmount.upto8Year;
      else if (vehicleAge === 9) selectedIdv = idvRow.idvAmount.upto9Year;
      else selectedIdv = idvRow.idvAmount.upto10Year;
    }

    const idv = String(selectedIdv || req.body.idv || "480000");

    console.log("IDV ROW >>>", JSON.stringify(idvRow, null, 2));
    const exshowroom = String(
      idvRow.exShowroomPrice ||
        idvRow.exshowroomPrice ||
        req.body.exshowroomPrice ||
        idv + ".00"
    );
    const previousPolicyExpiryDate = isRollover && insUpto ? insUpto : "";
    const previousPolicyStartDate = previousPolicyExpiryDate
      ? addYearsYmd(previousPolicyExpiryDate, -1, 1)
      : "";
    const hasPreviousPolicy = Boolean(previousPolicyExpiryDate);

    const typeFields = deriveVehicleFields(req.body);
    const isGcv = typeFields.vehicleType === "GCV";

    const token = await getZunoToken();

    // Quote the base package first. Addons can be rated after we have a
    // successful base quote and know the selected cover is allowed.
    const contractDetails = [
      {
        contract: "Own Damage Contract",
        coverage: {
          coverage: "Own Damage Coverage",
          deductable: "Own Damage Basis Deductible",
          discount: [],
          subCoverage: [
            {
              subCoverage: "Own Damage Basic",
              limit: "Own Damage Basic Limit",
              idvValue: idv,
            },
          ],
        },
      },
      {
        contract: "Third Party Multiyear Contract",
        coverage: [
          {
            coverage: "Legal Liability to Third Party Coverage",
            discount: "Third Party Property Damage Discount",
            deductible: "TP Deductible",
            subCoverage: [
              {
                subCoverage: "Third Party Basic Sub Coverage",
                limit: "Third Party Property Damage Limit",
                thirdPartyPropertyDamageLimit: "6000",
              },
            ],
          },
        ],
      },
      {
        contract: "PA Compulsary Contract",
        coverage: {
          coverage: "PA Owner Driver Coverage",
          subCoverage: {
            subCoverage: "PA Owner Driver",
            limit: "PA Owner Driver Limit",
            sumInsuredPerPerson: "1500000",
          },
        },
      },
    ];

    // ============================================================
    // REAL /quote PAYLOAD (mirrors UAT collection GCV/PCV samples)
    // ============================================================
    const payload: any = {
      commissionContractID:
        process.env.ZUNO_COMMISSION_CONTRACT_ID || "1000011692",
      channelCode: "002",
      agentEmail:
        process.env.ZUNO_AGENT_EMAIL || "vaibhav.kamble@quality.com",
      saleManagerCode: "",
      saleManagerName: process.env.ZUNO_SALE_MANAGER || "setu rohini",
      typeOfBusiness: isRollover ? "Rollover" : "New",
      policyType: "Package Policy",
      subPolicyType: req.body.subPolicyType || "",
      ownershipOfTheVehicle: req.body.ownershipOfTheVehicle || "Ind",
      typeOfLoan: "NLN",
      policyStartDate: todayYmd(),
      previousInsurancePolicy: hasPreviousPolicy ? "1" : "0",
      previousPolicyStartDate,
      previousPolicyExpiryDate,
      policyTenure: "1",
      contractTenure: "1",
      CATenure: "1",

      make,
      model,
      variant,
      idvCity: rto.idvCity,
      newOrUsed: isRollover ? "Used" : "New",
      cubicCapacity: cc,
      validLicenceNo: "Y",
      fuelType: fuel,
      registrationDate: regDate,
      dateOfTransaction: regDate,
      dateOfFirstPurchaseOrRegistration: regDate,
      fibreGlassFuelTank: "No",
      bodystyleDescription: "",
      transmissionType: "",
      yearOfManufacture: String(regYear),
      licencedSeatingCapacity: seats,
      licencedCarryingCapacity: isGcv ? licensedCapacity : seats,
      handicapped: "N",
      antiTheftDeviceInstalled: "No",
      typeOfDeviceInstalled: "",
      automobileAssociationMembershipNumber: "",
      automobileAssociationMembershipExpiryDate: "",

      stateCode: rto.rtoStateCode,
      rtoState: rto.rtoLocationName.split("-")[0] || "",
      rtoStateCode: rto.rtoStateCode,
      rtoLocationName: rto.rtoLocationName,
      rtoCityOrDistrict: rto.rtoCityOrDistrict,
      clusterZone: rto.clusterZone,
      carZone: rto.carZone,
      rtoZone: rto.rtoStateCode,

      protectionofNcbValue: "",
      claimDeclaration: "N",
      transferOfNcb: "N",
      transferOfNcbPercentage: "",
      PreviousClaimMade: "N",
      applicableNcb: "",
      idv,
      policyHolderGender: "",
      dateOfBirth: req.body.dateOfBirth || "1998-01-01", // TODO: collect earlier or reuse profile
      policyholderOccupation: "Medium to High",
      overrideAllowableDiscount: "N",
      requiredDiscountOrLoadingPercentage: "0",
      renewalStatus: "New Policy",
      annualMileage: "00000",
      breakininsurance: breakin,
      typeOfGrid: "Grid 1",
      foreignEmbassyVehicle: "N",
      useOfVehicle: "PRI",
      importedVehicleWithoutCustomDuty: "N",
      typeOfCart: "Except E Cart",
      ...typeFields, // vehicleType / vehicleSubClass / busType
      CoverformotorlampstyresetcImt23: "N",
      indemnityToHirer: "N",
      overturning: "N",
      gpsTracking: "N",
      revisedGVW: isGcv && gvw ? gvw + ".00" : cc + ".00",
      drivingTuitionsUsage: "N",

      contractDetails,
      exshowroomPrice: exshowroom,
    };

    console.log("FINAL CV QUOTE PAYLOAD:", JSON.stringify(payload).slice(0, 2000));

    const callQuote = async (p: any) => {
      const r = await fetch(`${process.env.ZUNO_MOTOR_CVI_URL}/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-API-KEY": process.env.ZUNO_CV_KEY!,
          Accept: "application/json",
        },
        body: JSON.stringify(p),
      });
      return { status: r.status, text: await r.text() };
    };

    const attempts: string[] = ["base"];
    let { status, text } = await callQuote(payload);

    // The rate master lists many CV models under DIESEL only; a non-diesel
    // fuel from the RC can crash rating (E1205). Retry once with DIESEL.
    if (
      status === 500 &&
      text.includes("E1205") &&
      payload.fuelType !== "DIESEL"
    ) {
      console.log(
        `CV QUOTE: E1205 with fuel=${payload.fuelType} - retrying with DIESEL`
      );
      payload.fuelType = "DIESEL";
      attempts.push("fuel:DIESEL");
      ({ status, text } = await callQuote(payload));
    }

    // Some Zuno CV rate rows use the UAT "New" value even for Rollover
    // business, while others expect "Used". Try the alternate enum on E1205.
    if (
      status === 500 &&
      text.includes("E1205") &&
      isRollover &&
      payload.newOrUsed === "Used"
    ) {
      payload.newOrUsed = "New";
      attempts.push("newOrUsed:New");
      ({ status, text } = await callQuote(payload));
    }

    // GCV masters sometimes rate on public carrier subclass rather than the
    // pickup-specific subclass. Keep this as a fallback, not the first payload.
    if (
      status === 500 &&
      text.includes("E1205") &&
      isGcv &&
      payload.vehicleSubClass !== "PUBLIC"
    ) {
      payload.vehicleSubClass = "PUBLIC";
      attempts.push("vehicleSubClass:PUBLIC");
      ({ status, text } = await callQuote(payload));
    }

    console.log("CV QUOTE ATTEMPTS:", attempts.join(" -> "));
    console.log("CV QUOTE STATUS:", status);
    console.log("CV QUOTE RAW:", text.slice(0, 4000));

    const data = parseJson(text);

    if (status === 500 && text.includes("ETIMEDOUT")) {
      return res.status(500).json({
        success: false,
        message: "Zuno internal rating timeout",
        retry: true,
        zunoError: data,
      });
    }

    return res.status(status).json({
      success: status >= 200 && status < 300 && data?.status !== "error",
      data,
      attempts,
      payloadUsed: payload, // CV5 stores this; full-quote builds on it
    });
  } catch (error: any) {
    console.log("CV QUOTE ERROR", error);
    return res.status(500).json({ message: error.message, success: false });
  }
}
