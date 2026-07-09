import type { NextApiRequest, NextApiResponse } from "next";

// ================= TOKEN =================
async function getZunoToken() {
  const auth = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(process.env.ZUNO_TOKEN_URL!, {
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

// Normalize RC manufacturer names to Zuno catalog makes
function normalizeCarMake(raw: string) {
  const b = (raw || "").toUpperCase().replace(/\s+/g, " ").trim();
  if (b.includes("MARUTI")) return "MARUTI SUZUKI";
  if (b.includes("HYUNDAI")) return "HYUNDAI";
  if (b.includes("TATA")) return "TATA";
  if (b.includes("MAHINDRA")) return "MAHINDRA";
  if (b.includes("HONDA")) return "HONDA";
  if (b.includes("TOYOTA")) return "TOYOTA";
  if (b.includes("KIA")) return "KIA";
  if (b.includes("VOLKSWAGEN")) return "VOLKSWAGEN";
  if (b.includes("SKODA")) return "SKODA";
  if (b.includes("RENAULT")) return "RENAULT";
  if (b.includes("NISSAN")) return "NISSAN";
  if (b.includes("MG")) return "MG";
  if (b.includes("CHEVROLET")) return "CHEVROLET";
  if (b.includes("FORD")) return "FORD";
  return b;
}

// dd-mm-yyyy (RC format) -> yyyy-mm-dd
function rcDateToIso(d: string) {
  const m = String(d || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST" });
  }

  try {
    const b = req.body;
    console.log("4W QUOTE FRONTEND BODY", JSON.stringify(b));

    // Accept BOTH shapes:
    //  - nested (frontend): { vehicleData: {...}, rcDetails: {...}, ... }
    //  - flat (Postman/testing): { make, model, variant, ... }
    const v = b.vehicleData || {};
    const rc = b.rcDetails || {};

    const make = normalizeCarMake(
      v.brand || v.make || b.make || rc.vehicle_manufacturer_name || ""
    );

    const model = (v.model || b.model || "")
      .toUpperCase()
      .replace(/\s+/g, " ")
      .trim();

    const variant = (v.variant || b.variant || "")
      .toUpperCase()
      .replace(/\s+/g, " ")
      .trim();

    const registrationDate =
      b.registrationDate || rcDateToIso(rc.reg_date) || "";

    const isNew = b.isNew === true || b.isNew === "true";

    const payload = {
      channelCode: "002",
      branch: b.branch || "Mumbai",

      make,
      model,
      variant,

      idvcity: b.idvcity || "MUMBAI",
      rtoStateCode: b.rtoStateCode || "13",
      rtoLocationName: b.rtoLocationName || "MH-02",
      clusterZone: b.clusterZone || "Cluster 3",
      carZone: b.carZone || "A",
      rtoZone: b.rtoZone || b.rtoStateCode || "13",
      rtoCityOrDistrict:
        b.rtoCityOrDistrict || "Andheri (Mumbai Western Suburbs)",

      idv: String(b.idv || ""),

      registrationDate,
      previousInsurancePolicy: isNew ? "0" : "1",
      previousPolicyExpiryDate: b.previousPolicyExpiryDate || "",

      typeOfBusiness: isNew ? "New" : "Rollover",
      renewalStatus: isNew ? "New Policy" : "Rollover",

      policyType: "Bundled Insurance",
      policyStartDate:
        b.policyStartDate || new Date().toISOString().split("T")[0],
      policyTenure: String(b.policyTenure || "1"),

      claimDeclaration: "",
      previousNcb: "",
      annualMileage: "10000",

      fuelType: v.fuel || b.fuelType || rc.type || "Petrol",
      transmissionType: b.transmissionType || "Manual",

      dateOfTransaction: new Date().toISOString().split("T")[0],
      subPolicyType: "",
      validLicenceNo: "Y",

      transferOfNcb: "N",
      transferOfNcbPercentage: "",
      proofProvidedForNcb: "",
      protectionofNcbValue: "",

      breakinInsurance: "NBK",
      contractTenure: String(b.policyTenure || "1"),

      overrideAllowableDiscount: "N",
      fibreGlassFuelTank: "Y",
      antiTheftDeviceInstalled: "Y",
      automobileAssociationMember: "Y",

      bodystyleDescription: (
        b.bodystyleDescription ||
        rc.body_type ||
        "HATCHBACK"
      )
        .toUpperCase()
        .replace(/\s+/g, ""),

      dateOfFirstPurchaseOrRegistration: registrationDate,

      dateOfBirth: b.dateOfBirth || "1990-01-01",
      policyHolderGender: b.gender || "Male",
      policyholderOccupation: "Medium to High",

      typeOfGrid: "Grid 1",

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
              },
            ],
          },
        },
      ],
    };

    console.log("4W QUOTE PAYLOAD", JSON.stringify(payload));

    const token = await getZunoToken();
    console.log("4W TOKEN:", token ? "YES" : "NO");

    const url = `${process.env.ZUNO_MOTOR_URL}/quote`;
    console.log("CALLING 4W QUOTE URL", url);

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
    console.log("4W QUOTE STATUS", response.status);
    console.log("4W QUOTE RAW", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(response.status).json({ success: response.ok, data });
  } catch (error: any) {
    console.log("4W QUOTE ERROR", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}