import type {
  NextApiRequest,
  NextApiResponse,
} from "next";


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


const vehicleYear =
vehicle.year || "2024";


 const zunoPayload:any = {


commissionContractID:"1000014234",

channelCode:"002",

branch:"AHMEDABAD",


// TEST MASTER DATA

make:
vehicle.make,


model:
vehicle.model,


variant:
vehicle.variant,


idvCity:"AHMEDABAD",

rtoStateCode:"06",

rtoLocationName:"GJ-01",

rtoZone:"06",

rtoCityOrDistrict:"Ahmedabad",

clusterZone:"Cluster 3",

carZone:"A",


idv:
vehicle.idv,


registrationDate:
isNew
?
today
:
`${vehicleYear}-06-05`,


previousInsurancePolicy:
isNew ? "0" : "1",


previousInsuranceCompanyName:
isNew ? "" : "National Insurance Co. Ltd.",


previousPolicyNo:
isNew ? "" : "POL12345678",


previousPolicyStartDate:
isNew ? "" : "2024-06-10",


previousPolicyEndDate:
isNew ? "" : "2025-06-09",


policyType:
isNew
?
"Bundled Insurance"
:
"Package Policy",


subPolicyType:"",


typeOfBusiness:
isNew ? "New" : "Rollover",

policyStartDate:
isNew
?
today
:
"2025-06-10",


policyTenure:
isNew ? "5" : "1",


contractTenure:
isNew ? "5" : "1",

claimDeclaration:"",

annualMileage:"",

transmissionType:"",


fuelType:
vehicle.fuelType,


validLicenceNo:"Y",


previousNcb:"",


transferOfNcb:"N",


proofOfNcb:"NCBRESRV",


protectionofNcbValue:"",


breakininsurance:
isNew ? "NBK" : "No Break",


renewalStatus:
isNew
?
"New Policy"
:
"Rollover",


dateOfTransaction:
today,


fibreGlassFuelTank:"Yes",


overrideAllowableDiscount:"N",


antiTheftDeviceInstalled:"Yes",


automobileAssociationMember:"Yes",


bodystyleDescription:"COUPE",

dateOfFirstPurchaseOrRegistration:
isNew
?
today
:
`${vehicleYear}-06-05`,


dateOfBirth:"1989-12-12",


policyHolderGender:"Male",


policyholderOccupation:
"Medium to High",


typeOfGrid:"Grid1",




contractDetails:[


{
contract:"Own Damage Contract",

coverage:{

coverage:"Own Damage Coverage",


deductible:[

"Own Damage Basis Deductible",

"Voluntary Deductible"

],


voluntaryDeductible:"3000",



discount:[

"Auto Mobile Association Discount",

"Voluntary Deductible Discount",

"Side car Discount",

"AntiTheft Discount"

],



subCoverage:[


{

subCoverage:"Own Damage Basic",

limit:"Own Damage Basic Limit"

}


]

}

},



...(isNew ? [

{
contract:"Addon Contract",

coverage:{
coverage:"Add On Coverage",

deductible:
"Key Replacement Deductible",

underwriterDiscount:"0.0",

subCoverage:[

{
subCoverage:"Return To Invoice"
},

{
subCoverage:"Pillion Protect",
limit:"Pillion Protect Limit",
sumInsuredPerPerson:"50000"
},

{
subCoverage:"Zero Depreciation"
},

{
subCoverage:"Consumable Cover"
}

]

}

}

] : []),




{

contract:"PA Compulsary Contract",


coverage:{


coverage:
"PA Owner Driver Coverage",



subCoverage:{


subCoverage:
"PA Owner Driver",


limit:
"PA Owner Driver Limit",


sumInsuredPerPerson:
"1500000"


}


}

},





{

contract:
"Third Party Multiyear Contract",



coverage:{



coverage:
"Legal Liability to Third Party Coverage",



deductible:"TP Deductible",



discount:
"Third Party Property Damage Discount",




subCoverage:[


{


subCoverage:
"Third Party Basic Sub Coverage",


limit:
"Third Party Property Damage Limit",


thirdPartyPropertyDamageLimit:
"6000"


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