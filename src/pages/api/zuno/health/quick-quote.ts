import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Only POST allowed",
    });
  }

  try {
    console.log("HEALTH FRONTEND BODY", req.body);

    // ================= TOKEN =================

    const basicToken = Buffer.from(
      `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`,
    ).toString("base64");

    const tokenResponse = await axios.post(
      process.env.ZUNO_TOKEN_URL!,

      new URLSearchParams({
        grant_type: "client_credentials",
      }),

      {
        headers: {
          Authorization: `Basic ${basicToken}`,

          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const token = tokenResponse.data.access_token;

    console.log("TOKEN OK");

    // ================= HELPERS =================

    const today = new Date().toISOString().split("T")[0];

    const getAge = (dob: string) => {
      const birth = new Date(dob);

      let age = new Date().getFullYear() - birth.getFullYear();

      return String(age);
    };

    const getDobFromAge = (age: any) => {
      return `${new Date().getFullYear() - Number(age)}-01-01`;
    };

    // IMPORTANT FIX
    // if frontend sends empty members

    const finalMembers =
      req.body.members && req.body.members.length > 0
        ? req.body.members
        : [
            {
              name: req.body.name,

              relation: "Self",

              gender: req.body.gender || "M",

              dob: req.body.dob,

              age: getAge(req.body.dob),
            },
          ];

    // ================= PAYLOAD =================

    const payload: any = {
      policyLevelDetails: {
        branch: "TEL001",

        source: "PP",

        policyType: "Individual",

        policyStartDate: today,

        policyTenure: "1",
      },

      policyHolder: {
        salutation: (req.body.gender || "M") === "M" ? "Mr." : "Mrs.",

        insuredFirstName: req.body.name,

        insuredLastname: "Test",

        middleName: "",

        dateofBirth: req.body.dob,

        gender: (req.body.gender || "M") === "M" ? "Male" : "Female",

        maritalStatus: "Married",

        policyHolderOccupation: "Salaried",

        adhaarNo: "",

        panNo: "",

        gstNo: "",

        street: "Test Address",

        landmark: "Mumbai",

        region: "13",

        pincode: req.body.pincode,

        city: "Mumbai",

        nationality: "IN",

        country: "IN",

        telephone: req.body.mobile,

        email: req.body.email,
      },

      contractDetails: [
        {
          contract: "Health Contract",

          productVariant: "Gold",

          coverageDetails: {
            coverage: "Basic Health Coverage",

            sumInsured: req.body.sumInsured || "500000",

            discount: ["Other Discount"],

            subCoverage: [
              {
                subCoverage: "Recharge",

                limit: "Recharge Limit",
              },
            ],
          },

          insuredObject: finalMembers.map((m: any) => {
            const isSelf = m.relation === "Self";

            const dob = isSelf ? req.body.dob : m.dob || getDobFromAge(m.age);

            return {
              salutation: m.gender === "M" ? "Mr." : "Mrs.",

              firstName: isSelf ? req.body.name : m.name || m.relation,

              middleName: "",

              lastName: "Test",

              gender: m.gender === "M" ? "Male" : "Female",

              dateOfBirth: dob,

              age: isSelf ? getAge(req.body.dob) : String(m.age),

              coresspondenceStreetAddress: "Test Address",

              city: "Mumbai",

              state: "13",

              nationality: "IN",

              country: "IN",

              pincode: req.body.pincode,

              eigExisitngPolicy: "0",
            };
          }),
        },
      ],
    };

    console.log(
      "FINAL ZUNO PAYLOAD",

      JSON.stringify(payload, null, 2),
    );

    // ================= ZUNO CALL =================

    const response = await axios.post(
      `${process.env.ZUNO_BASE_URL}/health/quick-quote`,

      payload,

      {
        headers: {
          Authorization: `Bearer ${token}`,

          "x-api-key": process.env.ZUNO_HEALTH_API_KEY,

          "Content-Type": "application/json",
        },
      },
    );

    console.log(
      "ZUNO RESPONSE",

      JSON.stringify(response.data, null, 2),
    );

const zuno = response.data;


// ================= CHECK SUCCESS =================

if (
  zuno?.webServiceResponseControl
    ?.webServiceStatus
    ?.code !== "Success"
) {

  return res.status(400).json({

    message: "Zuno quote failed",

    rawData: zuno

  });

}



// ================= EXTRACT VALUES =================

const premium =
  zuno
  ?.primaryRatingObject
  ?.policyData
  ?.contractDetails
  ?.contractPremium
  ?.premiumAfterTax;


const sumInsured =
  zuno
  ?.primaryRatingObject
  ?.policyData
  ?.contractDetails
  ?.coveragePackage
  ?.coverage
  ?.subcoverage?.[0]
  ?.sumInsured;



const plans = [
  {

    company:
    "Zuno Health Insurance",

    planName:
    "Gold",

    premium:
    premium,

    sumInsured:
    sumInsured,

    policyTenure:
    zuno.primaryRatingObject.policyData.policyTenure,

    productVariant:
    zuno.primaryRatingObject.policyData.contractDetails.productVariant,

    rawData:
    zuno

  }
];


return res.status(200).json(plans);

return res.status(200)
.json(plans);  } catch (error: any) {
    console.log(
      "ZUNO ERROR",

      JSON.stringify(
        error.response?.data || error.message,

        null,

        2,
      ),
    );

    return res.status(500).json({
      message: "Health quote failed",

      error: error.response?.data,
    });
  }
}
