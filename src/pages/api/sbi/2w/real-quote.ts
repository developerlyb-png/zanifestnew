import type {
 NextApiRequest,
 NextApiResponse
} from "next";


// ================= TOKEN =================

async function getZunoToken(){

 const auth =
 Buffer.from(
 `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
 ).toString("base64");


 const response =
 await fetch(
 `${process.env.ZUNO_BASE_URL}/oauth2/token`,
 {
  method:"POST",

  headers:{

   Authorization:`Basic ${auth}`,

   "Content-Type":
   "application/x-www-form-urlencoded",

   "x-api-key":
   process.env.ZUNO_X_API_KEY!

  },

  body:
  "grant_type=client_credentials"

 }
 );


 const data =
 await response.json();


 return data.access_token;

}



// ================= DATE =================

function getPolicyDate(){

const d =
new Date();

return d
.toISOString()
.split("T")[0];

}

function getPolicyEndDate(startDate:string){

const d = new Date(startDate);

d.setFullYear(
 d.getFullYear()+1
);

d.setDate(
 d.getDate()-1
);

return d
.toISOString()
.split("T")[0];

}

// ================= REGISTRATION =================

function getRegistration(vehicle:any){


const reg =
(
vehicle.registrationNumber ||
""
)
.replace(/[^a-zA-Z0-9]/g,"")
.toUpperCase();



const match =
reg.match(
/^([A-Z]{2})([0-9]{2})([A-Z]{1,3})([0-9]{3,5})$/
);



if(!match){


return {


stateCode:
vehicle.rto?.statecode || "",


districtCode:
"",


rtoCode:
vehicle.rto?.rtolocation || "",


vehicleSeriesNumber:
"",


registrationNumber:
"",


vehicleRegistrationNumber:
vehicle.registrationNumber || ""


};


}



return {


// Zuno state master code
stateCode:
vehicle.rto?.statecode || "",


// 01,02,06 etc
districtCode:
match[2],


// GJ-06, DL-01 etc
rtoCode:
`${match[1]}-${match[2]}`,


vehicleSeriesNumber:
match[3],


registrationNumber:
match[4],


vehicleRegistrationNumber:
reg


};



}
// ================= PREVIOUS POLICY =================

function getPreviousPolicy(
vehicle:any,
previousStartDate:string,
previousEndDate:string
){

const isNew =
vehicle.isNewBike === true ||
vehicle.isNewBike === "true";


if(isNew){

return {

previousInsurancePolicy:"0",
previousInsuranceCompanyName:"",
previousPolicyNo:"",
previousPolicyStartDate:"",
previousPolicyEndDate:""

};

}


return {

previousInsurancePolicy:"1",

previousInsuranceCompanyName:
"National Insurance Co. Ltd.",

previousPolicyNo:
"POL12345678",

previousPolicyStartDate:
previousStartDate,


previousPolicyEndDate:
previousEndDate

};


}



// ================= CONTRACT =================

// ================= CONTRACT =================

// function buildContracts(
// ratingData:any,
// vehicle:any
// ){


// return (ratingData.contractDetails || [])
// .map((item:any)=>{


// const contract =
// JSON.parse(JSON.stringify(item));


// // keep contract name

// contract.contract =
// contract.salesProductTemplateId;


// // ROOT LEVEL

// contract.engineNumber =
// vehicle.engineNumber;


// contract.chassisNumber =
// vehicle.chassisNumber;



// // ======================
// // FIX INSURED OBJECT ONLY
// // ======================

// if(contract.insuredObject){


// contract.insuredObject.engineNumber =
// vehicle.engineNumber;


// contract.insuredObject.chassisNumber =
// vehicle.chassisNumber;


// // IMPORTANT KEEP MASTER

// contract.insuredObject.make =
// vehicle.make;


// contract.insuredObject.model =
// vehicle.model;


// contract.insuredObject.variant =
// vehicle.variant;


// contract.insuredObject.fuelType =
// vehicle.fuelType;


// contract.insuredObject.systemIdv =
// vehicle.idv;


// contract.insuredObject.exshowroomPrice =
// vehicle.exShowroomPrice;


// contract.insuredObject.cubiccapacity =
// vehicle.capacity;


// contract.insuredObject.licencedCarryingcapacity =
// vehicle.seatingCapacity;


// }



// // OD

// if(
// contract.salesProductTemplateId ===
// "Own Damage Contract"
// ){

// contract.contractTenure="1";

// contract.multiYear="1";

// }



// // TP

// if(
// contract.salesProductTemplateId ===
// "Third Party Multiyear Contract"
// ){

// contract.contractTenure="1";

// contract.multiYear="1";

// }



// // PA

// if(
// contract.salesProductTemplateId ===
// "PA Compulsary Contract"
// ){

// contract.multiYear="1";

// delete contract.contractTenure;

// }


// return contract;


// });


// }
// ================= CONTRACT =================

function buildContracts(
 ratingData:any,
 vehicle:any
){

return (ratingData.contractDetails || [])
.map((item:any)=>{


const contract =
JSON.parse(JSON.stringify(item));


// add required key

contract.contract =
contract.salesProductTemplateId;


// DON'T REMOVE ANYTHING FROM RATING RESPONSE


// update vehicle numbers only

if(contract.insuredObject){


contract.insuredObject.engineNumber =
vehicle.engineNumber;


contract.insuredObject.chassisNumber =
vehicle.chassisNumber;


// keep rating idv

contract.insuredObject.systemIdv =
contract.insuredObject.systemIdv;


// keep original master values

contract.insuredObject.make =
contract.insuredObject.make;


contract.insuredObject.model =
contract.insuredObject.model;


contract.insuredObject.variant =
contract.insuredObject.variant;


}


// keep dates from rating

contract.contractStartDate =
item.contractStartDate;


contract.contractEndDate =
item.contractEndDate;


contract.endTime =
item.endTime || "235900";



// OD

if(
contract.salesProductTemplateId ===
"Own Damage Contract"
){

contract.contractTenure =
"1";

contract.multiYear =
"1";

}



// TP

if(
contract.salesProductTemplateId ===
"Third Party Multiyear Contract"
){

contract.contractTenure =
"1";

contract.multiYear =
"1";

}



// PA

if(
contract.salesProductTemplateId ===
"PA Compulsary Contract"
){

contract.multiYear =
"1";

delete contract.contractTenure;

}



return contract;


});


}

function createPayload(
ratingData:any,
body:any
){


const vehicle =
body.vehicle;


const customer =
body.customer;


const rto =
vehicle.rto || {};


const policy =
ratingData.policyData || {};


// CURRENT POLICY DATE
const today =
getPolicyDate();


const endDate =
getPolicyEndDate(today);

const prevEnd =
new Date(today);

prevEnd.setDate(
prevEnd.getDate() - 1
);

const previousEndDate =
prevEnd.toISOString().split("T")[0];


const prevStart =
new Date(previousEndDate);

prevStart.setFullYear(
prevStart.getFullYear() - 1
);

prevStart.setDate(
prevStart.getDate() + 1
);

const previousStartDate =
prevStart.toISOString().split("T")[0];

const contract =
ratingData.contractDetails?.[0] || {};



const isNew =
vehicle.isNewBike === true ||
vehicle.isNewBike === "true";


const isRenewal = false;

const regData =
getRegistration(vehicle);

const prevPolicy =
getPreviousPolicy(
vehicle,
previousStartDate,
previousEndDate
);

return {


source:"",


branch:
body.branch ||
process.env.ZUNO_BRANCH ||
"MUMBAI",


agentEmail:
body.agentEmail ||
process.env.ZUNO_AGENT_EMAIL,

saleManagerCode:
body.saleManagerCode ||
process.env.ZUNO_SALE_MANAGER_CODE,

saleManagerName:
body.saleManagerName ||
process.env.ZUNO_SALE_MANAGER_NAME,

mainApplicantField:
"1",


typeOfBusiness:
isNew
?
"New"
:
isRenewal
?
"Renewal"
:
"Rollover",



policyType:
"Package Policy",



subPolicyType:"",



// UPDATED DATE FIX

policyStartDate:
ratingData.policyData.policyStartDate,


policyStartTime:
"000000",


policyEndDay:
ratingData.contractDetails?.[0]?.contractEndDate,


policyEndTime:
"235900",




previousInsurancePolicy:
prevPolicy.previousInsurancePolicy,



previousInsuranceCompanyName:
prevPolicy.previousInsuranceCompanyName,



previousInsuranceCompanyAddress:"",



previousPolicyStartDate:
prevPolicy.previousPolicyStartDate,



previousPolicyEndDate:
prevPolicy.previousPolicyEndDate,



previousPolicyNo:
prevPolicy.previousPolicyNo,




policyTenure:
"1",



make:
vehicle.make,


model:
vehicle.model,


variant:
vehicle.variant,


makeModelMasterCode:
contract?.insuredObject?.makeModelMasterCode,



idvCity:
contract?.insuredObject?.idvCity
||
rto.idvcity,



cubicCapacity:
contract?.insuredObject?.cubiccapacity
||
String(vehicle.capacity)
.replace(".00",""),



licencedCarryingCapacity:
vehicle.seatingCapacity || "2",



validLicenceNo:
policy.validLicenceNo || "Y",



fuelType:
vehicle.fuelType || "PETROL",



newOrUsed:
isNew ? "New":"Used",



yearOfManufacture:
vehicle.year,



registrationDate:
isNew
?
`${vehicle.year}-06-05`
:
`${vehicle.year}-01-01`,



vehicleAge:
isNew
?
"0"
:
contract?.insuredObject?.ageofVehicle || "2",




engineNumber:
vehicle.engineNumber,


chassisNumber:
vehicle.chassisNumber,



fibreGlassFuelTank:
"Y",



bodystyleDescription:
contract?.insuredObject?.bodystyleDescription || "",



bodyType:"",


transmissionType:"",



handicapped:"N",


certifiedVintageCar:"N",



automobileAssociationMember:
"N",


antiTheftDeviceInstalled:
"N",




// RTO

stateCode:
contract?.insuredObject?.rtoStateNameandCode
||
rto.statecode
||
regData.stateCode,



districtCode:
regData.districtCode,


vehicleSeriesNumber:
regData.vehicleSeriesNumber,


registrationNumber:
regData.registrationNumber,


vehicleRegistrationNumber:
regData.vehicleRegistrationNumber,



rtoLocationName:
regData.rtoCode,

rtoState:
rto.rtostate,


rtoCityOrDistrict:
contract?.insuredObject?.rtoCityorDistrict
||
rto.rtocityordistrict,



clusterZone:
rto.clusterzone,


carZone:
rto.carzone,


rtoZone:
contract?.insuredObject?.rtoZone
||
rto.carzone,




transferOfNCB:
"N",


applicableNCB:
"0",



originalIDVValue:
vehicle.idv,



financeType:"",


financierName:"",




salutation:
"Mr.",


firstName:
customer.fullName,


middleName:"",


lastName:
"Radhakrishnan",



gender:
"Male",


maritalStatus:
"Single",


dateOfBirth:
"1995-06-19",



nationality:
"IN",




currentAddressLine1:
"187/A",


currentAddressLine2:
"Tent Road",


currentAddressLine3:"",


currentCountry:
"IN",


pincode:
"560016",


currentCity:
"Bengaluru",


currentState:
"13",


street:
"Tent Road",


area:
"RM Nagara",


location:
"ShivajiNagar",




mobileNumber:
String(customer.mobile)
.slice(-10),



emailId:
customer.email,



commissionContractID:
ratingData.commisionDetails
?.commissionContractId
||
"1000014234",




occupation:
"Salaried",




nomineeName:
"Radhakrishnan",



relationshipWithApplicant:
"Father",



isNomineeMinor:
"N",


nomineeDOB:
"1994-05-25",


nomineeAge:
"30",




renewalstatus:
isNew
?
"New Policy"
:
isRenewal
?
"Renewal"
:
"Rollover",




annualmileageofthecar:
"10000",



breakininsurance:
isNew
?
"NBK"
:
"N",



typeofGrid:
policy.typeofGrid || "Grid 1",




driverDetails:{


nameofDriver:
customer.fullName,


dateofBirth:
"1995-06-19",


genderoftheDriver:
"Male",


ageofDriver:
"30",


relationshipwithProposer:
"SELF",


drivingExperienceinyears:
"5",


middleName:"",


lastName:
"Radhakrishnan"


},




contractDetails:
buildContracts(
ratingData,
vehicle
)



};


}






// ================= API =================


export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){


try{


if(req.method !== "POST"){

return res.status(405).json({
success:false
});

}



const token =
await getZunoToken();



const ratingData =
req.body.quote;



if(!ratingData){

return res.status(400).json({

success:false,

message:"quote missing"

});

}



const payload =
createPayload(
ratingData,
req.body
);
console.log("========= DATE CHECK =========");

console.log({
 ratingPolicyStart:
 ratingData.policyData?.policyStartDate,

 ratingContractStart:
 ratingData.contractDetails?.[0]?.contractStartDate,

 ratingContractEnd:
 ratingData.contractDetails?.[0]?.contractEndDate,

 fullQuoteStart:
 payload.policyStartDate,

 fullQuoteEnd:
 payload.policyEndDay,

 previousStart:
 payload.previousPolicyStartDate,

 previousEnd:
 payload.previousPolicyEndDate
});


console.log("========= DRIVER CHECK =========");

console.log(payload.driverDetails);


console.log("========= RTO CHECK =========");

console.log({
 number: payload.vehicleRegistrationNumber,
 rto: payload.rtoLocationName,
 city: payload.rtoCityOrDistrict,
 state: payload.rtoState
});
console.log(
"POLICY CHECK",
{
policyType:payload.policyType,
policyTenure:payload.policyTenure,
typeOfBusiness:payload.typeOfBusiness,
newOrUsed:payload.newOrUsed,
previousInsurancePolicy:payload.previousInsurancePolicy
}
);


console.log(
"CONTRACT CHECK",
JSON.stringify(payload.contractDetails)
);

console.log(
"FINAL FULL QUOTE",
JSON.stringify(payload)
);




const response =
await fetch(

`${process.env.ZUNO_BASE_URL}/motor-two-wheeler/full-quote`,

{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:
`Bearer ${token}`,

"x-api-key":
process.env.ZUNO_X_API_KEY!

},


body:
JSON.stringify(payload)


}

);



const text =
await response.text();



console.log(
"STATUS",
response.status
);


console.log(
"RAW",
text
);



let data;


try{

data=JSON.parse(text);

}catch{

data=text;

}



return res.status(response.status).json({

success:
response.ok,

data

});



}
catch(error:any){


console.log(error);


return res.status(500).json({

success:false,

message:error.message

});


}



}