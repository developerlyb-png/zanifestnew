import type {
 NextApiRequest,
 NextApiResponse,
} from "next";


// TOKEN

async function getZunoToken(){

 const auth = Buffer.from(
  `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
 ).toString("base64");


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

   "x-api-key":
   process.env.ZUNO_X_API_KEY!,

  },

  body:
  "grant_type=client_credentials"

 });


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

   message:
   "Method not allowed"

  });

 }



 console.log(
 "REQUEST BODY",
 JSON.stringify(req.body)
 );



 const token =
 await getZunoToken();



 const quote =
 req.body.quote;



 if(!quote){

  return res.status(400).json({

   success:false,

   message:"Quote missing"

  });

 }




 // ============================
 // FINAL ZUNO PAYLOAD
 // ============================


 const proposalPayload:any = {


 ...quote,



 // POLICY FIX


 policyType:
 "Bundled Insurance",


 subPolicyType:
 "",


 typeOfBusiness:
 "New",


 policyStartDate:
 quote?.policyData?.policyStartDate,


 policyTenure:
 quote?.policyData?.policyTenure
 ||
 "5",


 contractTenure:
 "5",



 previousInsurancePolicy:
 quote?.policyData?.previousInsurancePolicy
 ||
 "0",


 renewalStatus:
 "New Policy",


 validLicenceNo:
 "Y",



 branch:
 quote?.policyData?.branch
 ||
 "GUJ001",


 channelCode:
 quote?.policyData?.channelType
 ||
 "002",



 dateOfTransaction:
 new Date()
 .toISOString()
 .split("T")[0],




 // FIX replace ERROR


 occupationofpolicyholder:

 quote?.policyData
 ?.occupationofpolicyholder
 ||
 "MH",



 policyholderOccupation:

 "MH",



 genderofpolicyholder:

 quote?.policyData
 ?.genderofpolicyholder
 ||
 "M",



 ageofpolicyholder:

 quote?.policyData
 ?.ageofpolicyholder
 ||
 "40",




 // CUSTOMER


 firstName:
 req.body.customer.fullName,


 fullName:
 req.body.customer.fullName,


 mobileNumber:
 req.body.customer.mobile
 ?.replace(/^0/,""),


 mobile:
 req.body.customer.mobile
 ?.replace(/^0/,""),


 email:
 req.body.customer.email,


 emailId:
 req.body.customer.email,



 dateOfBirth:
 "1989-12-12",


 policyHolderGender:
 "Male",



 // ADDRESS


 addressLine1:
 "TEST ADDRESS",


 addressLine2:
 "AHMEDABAD",


 city:
 "Ahmedabad",


 state:
 "Gujarat",


 pincode:
 "380001",


 pinCode:
 "380001",





 // RTO


 rtoStateCode:
 "06",


 rtoLocationName:
 "GJ-01",


 rtoZone:
 "06",


 rtoCityOrDistrict:
 "Ahmedabad",


 clusterZone:
 "Cluster 3",


 idvCity:
 "AHMEDABAD",






 // VEHICLE


 registrationNumber:
 req.body.vehicle.registrationNumber,


 vehicleRegistrationNumber:
 req.body.vehicle.registrationNumber,


 make:
 req.body.vehicle.make
 ?.toUpperCase(),


 model:
 req.body.vehicle.model
 ?.toUpperCase(),



 variant:

 quote?.contractDetails?.[0]
 ?.insuredObject?.variant
 ||
 "BS VI",



 manufacturingYear:
 req.body.vehicle.year,


 yearOfManufacture:
 req.body.vehicle.year,




 // ENGINE


 engineNumber:
 req.body.vehicle.engineNumber,


 engineeNumber:
 req.body.vehicle.engineNumber,


 chassisNumber:
 req.body.vehicle.chassisNumber,



 };





 // ============================
 // CONTRACT DETAILS SAME AS RATING
 // ============================


 const contracts =
 quote.contractDetails
 ||
 [];



 proposalPayload.contractDetails =
 contracts.map(
 (item:any)=>({


  ...item,


  insuredObject:{


   ...item.insuredObject,


   engineNumber:
   req.body.vehicle.engineNumber,


   engineeNumber:
   req.body.vehicle.engineNumber,


   chassisNumber:
   req.body.vehicle.chassisNumber,


  },



  coverage:{


   ...item.coverage,


   insuredObject:{


    ...item.coverage
    ?.insuredObject,


    engineNumber:
    req.body.vehicle.engineNumber,


    engineeNumber:
    req.body.vehicle.engineNumber,


    chassisNumber:
    req.body.vehicle.chassisNumber,


   }


  }


 })
 );






 console.log(
 "FINAL PAYLOAD",
 JSON.stringify(proposalPayload)
 );





 const response =
 await fetch(

 `${process.env.ZUNO_BASE_URL}/motor-two-wheeler/issue-policy`,

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
  JSON.stringify(proposalPayload)


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

  data =
  JSON.parse(text);

 }
 catch{

  data=text;

 }





 return res
 .status(response.status)
 .json({

  success:
  response.ok,

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

  error:
  error.message

 });

}


}