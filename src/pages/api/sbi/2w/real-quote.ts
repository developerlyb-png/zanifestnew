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



// ================= REGISTRATION =================

function getRegistration(vehicle:any){


const isNew =
vehicle.isNewBike === "true" &&
Number(vehicle.year) >=
new Date().getFullYear() - 1;

if(isNew){

return {

registrationNumber:"",

vehicleRegistrationNumber:""

};

}


const reg =
vehicle.registrationNumber
.replace(/[^a-zA-Z0-9]/g,"")
.toUpperCase();


return {

registrationNumber:reg,

vehicleRegistrationNumber:reg

};


}


// ================= PREVIOUS POLICY =================

function getPreviousPolicy(vehicle:any){


 const isNew =
vehicle.isNewBike === "true" &&
Number(vehicle.year) >=
new Date().getFullYear() - 1;


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
 "2023-06-05",

 previousPolicyEndDate:
 "2024-06-04"

 };


}




// ================= CONTRACT =================

function buildContracts(
ratingData:any,
vehicle:any
){

// const isNew =
// vehicle.isNewBike === "true";


return (
ratingData.contractDetails || []
)
.map((item:any)=>({


...item,


// yaha date mat change karo
contractStartDate:
item.contractStartDate,


contractEndDate:

new Date(item.contractEndDate)
<
new Date(item.contractStartDate)
?
item.contractStartDate
:
item.contractEndDate,

contract:
item.contract ||
item.salesProductTemplateId ||
"Own Damage Contract",



engineNumber:
vehicle.engineNumber,


engineeNumber:
vehicle.engineNumber,


chassisNumber:
vehicle.chassisNumber,



contractPremium:{


...item.contractPremium,


// original rating wali date rakho
premiumStartDate:
item.contractPremium?.premiumStartDate,


premiumEndDate:
item.contractPremium?.premiumEndDate


},



coverage:{


...item.coverage,


coverage:
item.coverage?.salesProductTemplateId ||
item.coverage?.coverage ||
"Own Damage Coverage",



insuredObject:{


...item.coverage?.insuredObject,


rtoLocationName:
"GJ-01",


engineNumber:
vehicle.engineNumber,


engineeNumber:
vehicle.engineNumber,


chassisNumber:
vehicle.chassisNumber


}


},

insuredObject:{

...item.insuredObject,

engineNumber:
vehicle.engineNumber,

engineeNumber:
vehicle.engineNumber,

chassisNumber:
vehicle.chassisNumber

}





}));

}





// ================= PAYLOAD =================


function createPayload(
ratingData:any,
body:any
){


const vehicle =
body.vehicle;


const customer =
body.customer;


const isNew =
vehicle.isNewBike === "true" &&
Number(vehicle.year) >=
new Date().getFullYear() - 1;


const insuredObject =
ratingData
?.contractDetails?.[0]
?.coverage
?.insuredObject
||
ratingData
?.contractDetails?.[0]
?.insuredObject;



return {


source:"",


branch:
ratingData?.policyData?.branch
|| "BANGALORE",



typeOfBusiness:
isNew
?
"New"
:
"Rollover",



policyType:
isNew
?
"Bundled Insurance"
:
"Package Policy",



subPolicyType:"",



policyStartDate:

ratingData?.policyData?.policyStartDate
||
getPolicyDate(),



policyStartTime:
"120100",

policyTenure:
(
ratingData?.policyData?.policyType === "BUN"
||
isNew
)
?
"5"
:
"1",




...getPreviousPolicy(vehicle),



// VEHICLE


make:
vehicle.make.toUpperCase(),


model:
vehicle.model.toUpperCase(),


variant:
"BS VI",


idvCity:
"BANGALORE",


cubicCapacity:
"220",


licencedCarryingCapacity:
"2.0",


fuelType:
"Petrol",



newOrUsed:
isNew
? "New"
: "Used",



yearOfManufacture:
String(vehicle.year),


registrationDate:

isNew
?
getPolicyDate()
:
(
insuredObject?.dateoffirstpurchaseorregistration
||
`${vehicle.year}-06-05`
),

vehicleAge:

insuredObject?.ageofVehicle
||
(isNew ? "0" : "1"),



engineNumber:
vehicle.engineNumber,


engineeNumber:
vehicle.engineNumber,


chassisNumber:
vehicle.chassisNumber,



...getRegistration(vehicle),



rtoLocationName:
insuredObject?.rtoLocationName
|| "GJ-01",


rtoCityOrDistrict:
insuredObject?.rtoCityorDistrict
|| "Ahmedabad",


rtoState:
insuredObject?.rtoStateNameandCode
|| "06",


rtoZone:
insuredObject?.rtoZone
|| "A",


clusterZone:
insuredObject?.clusterZone
|| "Cluster 3",



validLicenceNo:
"Y",




// CUSTOMER


salutation:"Mr.",


firstName:
customer.fullName,


gender:
"Male",


dateOfBirth:
"1995-06-19",


nationality:"IN",


currentAddressLine1:
"TEST ADDRESS",


currentAddressLine2:
"TEST",


currentCountry:"IN",


pincode:"110001",


currentCity:"Delhi",


currentState:"10",



mobileNumber:
customer.mobile,


emailId:
customer.email,




// NOMINEE


nomineeName:
"Test Nominee",


relationshipWithApplicant:
"Father",


nomineeDOB:
"1970-01-01",


nomineeAge:
"50",



renewalstatus:
isNew
? "New Policy"
: "Rollover",



annualmileageofthecar:
"10000",


breakininsurance:
"No Break",


typeofGrid:
"Grid 4",



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
"5"


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