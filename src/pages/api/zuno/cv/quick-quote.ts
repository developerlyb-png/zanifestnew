import type { NextApiRequest, NextApiResponse } from "next";


// =======================
// ZUNO TOKEN
// =======================

async function getZunoToken(){

try{

const auth =
Buffer.from(
`${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
)
.toString("base64");



const response =
await fetch(
`${process.env.ZUNO_BASE_URL}/oauth2/token`,
{

method:"POST",

headers:{

Authorization:
`Basic ${auth}`,

"Content-Type":
"application/x-www-form-urlencoded",

"X-API-KEY":
process.env.ZUNO_CV_KEY!

},

body:
"grant_type=client_credentials"

}
);



const data =
await response.json();



console.log(
"TOKEN RESPONSE:",
data
);



return data.access_token;


}
catch(error){

console.log(
"TOKEN ERROR",
error
);


throw error;

}


}







// =======================
// QUICK QUOTE API
// =======================


export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){


try{


if(req.method !== "POST"){

return res.status(405).json({

message:
"Only POST allowed"

});

}




console.log(
"CV QUICK URL:",
`${process.env.ZUNO_MOTOR_CVI_URL}/quote`
);


// generate token

const token =
await getZunoToken();

const {

make,
model,
yearOfPurchase,
rtoDetails

}=req.body;


const variant =
req.body.variant ||
req.body.varient;


console.log(
"VARIANT CHECK",
variant
);



console.log(
"BODY DATA",
req.body
);
console.log(
"RTO DETAILS CHECK",
rtoDetails
);
console.log(
"CV TOKEN:",
token
);




// final zuno payload


// =======================
// FINAL ZUNO CV PAYLOAD
// =======================

const payload:any = {

branch:"MAH001",

numberOfRelationshipsWithEdelweissGroup:0,

renewalStatus:"",

annualMileageOfTheCar:"",


// =====================
// VEHICLE MASTER
// =====================

make:make,

model:model,

variant:
variant,


// =====================
// RTO DETAILS
// =====================

idvCity:
rtoDetails.idvcity,


rtoStateCode:
Number(
rtoDetails.statecode
),


rtoLocationName:
rtoDetails.rtolocation,


clusterZone:
rtoDetails.clusterzone,


carZone:
rtoDetails.carzone,


rtoZone:
"Except E Cart",


rtoCityOrDistrict:
rtoDetails.rtocityordistrict,



// =====================
// IDV
// =====================

idv:2641000,



// =====================
// POLICY
// =====================

registrationDate:
`${yearOfPurchase}-03-03`,


previousInsurancePolicy:0,

typeOfBusiness:"New",

policyType:"Package Policy",

policyStartDate:"2026-06-19",


annualMileage:"00000",

transmissionType:"Manual",

subPolicyType:"LIAT",

typeOfPermit:"NAT",


// =====================
// OWNER
// =====================

ageOfTheDriver:25,

typeOfLoan:"NLN",

ownershipOfTheVehicle:"Ind",



// =====================
// FLAGS
// =====================

overrideAllowableDiscount:"N",

fibreGlassFuelTank:"Yes",

antiTheftDeviceInstalled:"No",

automobileAssociationMember:"N",

typeOfGrid:"Grid 1",

geographicalExtension:"Y",

foreignEmbassyVehicle:"Y",

useOfVehicle:"PRI",

importedVehicleWithoutCustomDuty:"Y",

drivingTuitionsUsage:"Y",



// =====================
// VEHICLE TYPE
// =====================

typeOfCart:"Except E Cart",

numberOfWheels:4,

vehicleSubClass:"PUBLIC",

vehicleType:"PCV",

busType:"SCBUS",


// =====================
// EXTRA COVERS
// =====================

coverForMotorLampsTyresEtc:"Y",

indemnityToHirer:"N",

overturning:"N",

gpsTracking:"Y",

licensedCarryingCapacity:37,


jarvisId:"Y",

requestId:"N",



// =====================
// CONTRACT
// =====================

contractDetails:[

{

contract:"Own Damage Contract",

coverage:{

coverage:
"Own Damage Coverage",


deductible:
"Own Damage Basis Deductible",


discount:[

"Used Confined to own Premises Discount"

],


subCoverage:[

{

subCoverage:
"Own Damage Basic",

limit:
"Own Damage Basic Limit"

}

]

}

}

]

};
console.log("TYPE CHECK", {

registrationDate:
payload.registrationDate,

policyStartDate:
payload.policyStartDate,

make:
payload.make,

model:
payload.model,

variant:
payload.variant,

idvCity:
payload.idvCity,

rtoCity:
payload.rtoCityOrDistrict,

vehicleType:
payload.vehicleType

});
// claim yes case only






console.log(
"FINAL CV QUICK PAYLOAD:",
payload
);






const response =
await fetch(
`${process.env.ZUNO_MOTOR_CVI_URL}/quote`,
{


method:"POST",



headers:{

"Content-Type":"application/json",

"Authorization":
`Bearer ${token}`,

"X-API-KEY":
process.env.ZUNO_CV_KEY!,

"Accept":"application/json"

},



body:
JSON.stringify(payload)


}
);






console.log("CV STATUS:", response.status);
console.log("CV OK:", response.ok);

const text = await response.text();

console.log("====== ZUNO RAW START ======");
console.log(text);
console.log("====== ZUNO RAW END ======");
console.log("RAW LENGTH:", text.length);


let data:any;

try{

data = text
? JSON.parse(text)
: {
    message:"EMPTY_RESPONSE_FROM_ZUNO",
    status:response.status
  };

}
catch(err){

data = {

message:"JSON_PARSE_FAILED",

raw:text

};

}





if(
response.status === 500 &&
text.includes("ETIMEDOUT")
){

return res.status(500).json({

success:false,

message:
"Zuno internal rating timeout",

retry:true,

zunoError:data

});

}



return res
.status(response.status)
.json({

success:
response.ok,

data:data

});




}
catch(error:any){



console.log(
"CV ERROR",
error
);



return res.status(500).json({

message:
error.message

});


}


}