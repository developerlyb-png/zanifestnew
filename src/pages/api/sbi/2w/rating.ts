import type {
  NextApiRequest,
  NextApiResponse,
} from "next";
import { mapZunoBike } from "@/utils/zunoBikeMapper";

// TOKEN FUNCTION

async function getZunoToken() {

  const auth = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
  ).toString("base64");


  const response = await fetch(
    `${process.env.ZUNO_BASE_URL}/oauth2/token`,
    {
      method:"POST",

      headers:{

        Authorization:`Basic ${auth}`,

        "Content-Type":
        "application/x-www-form-urlencoded",

        "x-api-key":
        process.env.ZUNO_X_API_KEY!,

      },

      body:
      "grant_type=client_credentials",

    }
  );


  const data =
  await response.json();


  return data.access_token;

}




export default async function handler(
 req:NextApiRequest,
 res:NextApiResponse
){


 try{


 if(req.method !== "POST"){

  return res.status(405).json({
   success:false,
   message:"Only POST"
  });

 }



 const token =
 await getZunoToken();

const vehicle =
req.body.vehicle;

console.log(
"FRONT VEHICLE DATA",
JSON.stringify(vehicle)
);
const isNew =
vehicle.isNewBike === "true";


const today =
new Date()
.toISOString()
.split("T")[0];





const rto = vehicle.rto || {};

const registrationDate =
  vehicle.registrationDate ||
  vehicle.registration_date ||
  vehicle.regDate ||
  `${vehicle.year}-06-01`;
const zunoVehicle = mapZunoBike(vehicle);

console.log(
  "ZUNO MASTER VEHICLE",
  zunoVehicle
);



const getValue = (...keys: string[]) => {
  for (const key of keys) {
    const value = rto[key];
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }
  return "";
};

const getVehicle = (...keys: string[]) => {
  for (const key of keys) {
    const value = vehicle[key];
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }
  return "";
};
const zunoPayload: any = {

  commissionContractID:
  vehicle.commissionContractID ||
  process.env.ZUNO_COMMISSION_CONTRACT_ID ||
  "",

  channelCode:
  vehicle.channelCode ||
  process.env.ZUNO_CHANNEL_CODE ||
  "002",
branch:
vehicle.branch ||
process.env.ZUNO_BRANCH ||
"MUMBAI",

  // ===========================
  // VEHICLE MASTER
  // ===========================

make: zunoVehicle?.make || getVehicle("make"),

model: zunoVehicle?.model || getVehicle("model"),

variant: zunoVehicle?.variant || getVehicle("variant"),

  idvCity: getValue(
    "idvcity",
    "idvCity"
  ),

  rtoStateCode: getValue(
    "statecode",
    "stateCode"
  ),

  rtoLocationName: getValue(
    "rtolocation",
    "rtoLocation",
    "rtoCode"
  ),

rtoZone:
getValue(
   "rtozone",
   "zone",
   "carzone"
),
  rtoCityOrDistrict: getValue(
    "rtocityordistrict",
    "city",
    "rtoCityOrDistrict"
  ),

  clusterZone: getValue(
    "clusterzone",
    "clusterZone"
  ),

  carZone: getValue(
    "carzone",
    "carZone"
  ),

  idv: getVehicle("idv"),
  registrationDate,

  previousInsurancePolicy: isNew ? "0" : "1",

  previousInsuranceCompanyName:
  getVehicle("previousInsuranceCompanyName"),

  previousPolicyNo:
  getVehicle("previousPolicyNo"),

  previousPolicyStartDate:
isNew
  ? ""
  : getVehicle(
      "previousPolicyStartDate",
      "previousPolicyFrom"
    ),

 previousPolicyEndDate:
isNew
  ? ""
  : getVehicle(
      "previousPolicyEndDate",
      "previousPolicyTo"
    ),

policyType:
getVehicle("policyType") ||
(isNew
 ? "Bundled Insurance"
 : "Package Policy"),

  subPolicyType: "",

 typeOfBusiness:
getVehicle("typeOfBusiness") ||
(isNew ? "New" : "Rollover"),

  policyStartDate:
  getVehicle("policyStartDate") || today,

  policyTenure:
vehicle.policyTenure ||
(isNew ? "5" : "1"),

  contractTenure:
vehicle.contractTenure ||
(isNew ? "5" : "1"),

  claimDeclaration:
getVehicle("claimDeclaration"),

  annualMileage:
getVehicle("annualMileage"),

  transmissionType:
    vehicle.transmissionType || "",

  fuelType: getVehicle("fuelType"),


  validLicenceNo:
vehicle.validLicenceNo || "Y",

  previousNcb:
    vehicle.previousNcb || "",

  transferOfNcb:
    vehicle.transferOfNcb || "N",

  proofOfNcb:
    vehicle.proofOfNcb || "NCBRESRV",

  protectionofNcbValue:
    vehicle.protectionofNcbValue || "",

 breakininsurance:
vehicle.breakininsurance ||
(isNew ? "NBK" : "No Break"),

 renewalStatus:
vehicle.renewalStatus ||
(isNew
 ? "New Policy"
 : "Rollover"),

  dateOfTransaction: today,

  fibreGlassFuelTank:
    vehicle.fibreGlassFuelTank || "Yes",

 overrideAllowableDiscount:
getVehicle("overrideAllowableDiscount") ||
"N",

  antiTheftDeviceInstalled:
    vehicle.antiTheftDeviceInstalled || "Yes",

  automobileAssociationMember:
    vehicle.automobileAssociationMember || "Yes",

  bodystyleDescription:
    vehicle.bodyStyle || "",

  dateOfFirstPurchaseOrRegistration:
    registrationDate,

  dateOfBirth:
    vehicle.dateOfBirth || "1989-12-12",

  policyHolderGender:
    vehicle.gender || "Male",

  occupationofpolicyholder:"MH",

  typeOfGrid:
    vehicle.typeOfGrid || "Grid1",

  contractDetails: [

    {
      contract: "Own Damage Contract",

      coverage: {

        coverage: "Own Damage Coverage",

        deductible: [
          "Own Damage Basis Deductible",
          "Voluntary Deductible"
        ],

        voluntaryDeductible:
vehicle.voluntaryDeductible || "3000",

        discount: [
          "Auto Mobile Association Discount",
          "Voluntary Deductible Discount",
          "Side car Discount",
          "AntiTheft Discount"
        ],

        subCoverage: [
          {
            subCoverage: "Own Damage Basic",
            limit: "Own Damage Basic Limit"
          }
        ]
      }
    },

    ...(isNew
      ? [
          {
            contract: "Addon Contract",

            coverage: {

              coverage: "Add On Coverage",

              deductible:
getVehicle("keyReplacementDeductible") ||
"Key Replacement Deductible",


              underwriterDiscount:
vehicle.underwriterDiscount || "0.0",

              subCoverage: [

                {
                  subCoverage: "Return To Invoice"
                },

                {
                  subCoverage: "Pillion Protect",
                  limit: "Pillion Protect Limit",
                  sumInsuredPerPerson:
vehicle.paCover || "1500000",
                },

                {
                  subCoverage: "Zero Depreciation"
                },

                {
                  subCoverage: "Consumable Cover"
                }

              ]
            }
          }
        ]
      : []),

    {
      contract: "PA Compulsary Contract",

      coverage: {

        coverage: "PA Owner Driver Coverage",

        subCoverage: {

          subCoverage: "PA Owner Driver",

          limit: "PA Owner Driver Limit",

          sumInsuredPerPerson:
vehicle.paCover || "1500000"
        }
      }
    },

    {
      contract: "Third Party Multiyear Contract",

      coverage: {

        coverage:
          "Legal Liability to Third Party Coverage",

        deductible: "TP Deductible",

        discount:
          "Third Party Property Damage Discount",

        subCoverage: [

          {
            subCoverage:
              "Third Party Basic Sub Coverage",

            limit:
              "Third Party Property Damage Limit",

            thirdPartyPropertyDamageLimit:
vehicle.thirdPartyPropertyDamageLimit || "6000",
          }

        ]
      }
    }

  ]
};




console.log(
 "TOKEN:",
 token ? "YES":"NO"
);


console.log(
  "RTO OBJECT =>",
  JSON.stringify(rto, null, 2)
);

console.log(
  "ZUNO VEHICLE =>",
  JSON.stringify(zunoVehicle, null, 2)
);

console.log(
  "PAYLOAD =>",
  JSON.stringify(zunoPayload, null, 2)
);
console.log(
 "FINAL ZUNO PAYLOAD",
 JSON.stringify(zunoPayload)
);





const response =
await fetch(

`${process.env.ZUNO_BASE_URL}/motor-two-wheeler/rating`,

{

method:"POST",


headers:{


Authorization:
`Bearer ${token}`,


"Content-Type":
"application/json",


"x-api-key":
process.env.ZUNO_X_API_KEY!,


},



body:
JSON.stringify(zunoPayload)



}

);




const text =
await response.text();



console.log(
"STATUS:",
response.status
);


console.log(
"RAW:",
text
);




let data;

try{

data=JSON.parse(text);

}catch{

data=text;

}




return res.status(response.status).json({

success:response.ok,

data

});



 }
 catch(error:any){


 console.log(
 "ERROR",
 error
 );


 return res.status(500).json({

 success:false,

 error:error.message

 });


 }


}