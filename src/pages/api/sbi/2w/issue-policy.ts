import type {
 NextApiRequest,
 NextApiResponse,
} from "next";

import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";


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
 process.env.ZUNO_X_API_KEY!

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

 message:"Method not allowed"

 });

 }



 await dbConnect();


 const token =
 await getZunoToken();



 console.log(
 "ISSUE REQUEST",
 JSON.stringify(req.body)
 );



 // =====================
 // ZUNO ISSUE PAYLOAD
 // =====================
// =====================
// GET QUOTE DETAILS
// =====================

const quoteNo =

req.body.fullQuote
?.policyLevelDetails
?.quoteNo
||
req.body.fullQuote
?.policyLevelDetails
?.quoteNumber;



const quoteOptionNo =

req.body.fullQuote
?.policyLevelDetails
?.quoteOptionNo
||
req.body.fullQuote
?.policyLevelDetails
?.quoteOptionNumber;


console.log(
"QUOTE NO",
quoteNo
);


console.log(
"QUOTE OPTION NO",
quoteOptionNo
);


if(
!quoteNo ||
!quoteOptionNo
){

return res.status(400).json({

success:false,

message:
"Quote details missing"

});

}

const issuePayload = {


 product: {

  name:"EGICProductWebServicesV1",

  version:"1"

 },


 policyList:[

  {

   quoteNo:String(quoteNo),

   quoteOptionNo:String(quoteOptionNo)

  }

 ],


 ipContextInfo:{

  productName:"EGICProductWebServicesV1",

  productVersion:"1"

 }


};


 console.log(
 "FINAL ISSUE PAYLOAD",
 JSON.stringify(issuePayload)
 );





 const response =
 await fetch(

 `${process.env.ZUNO_BASE_URL}/motor-two-wheeler/issue-policy`,

 {

 method:"POST",


 headers:{


 "Content-Type":
 "application/json",


 Authorization:
 `Bearer ${token}`,


 "x-api-key":
 process.env.ZUNO_X_API_KEY!


 },


 body:
 JSON.stringify(issuePayload)


 }

 );





 const text =
 await response.text();



 console.log(
 "ISSUE STATUS",
 response.status
 );


 console.log(
 "ISSUE RAW",
 text
 );




 let zunoData:any;


 try{

 zunoData =
 JSON.parse(text);

 }
 catch{

 zunoData = text;

 }





 if(!response.ok){

 return res.status(response.status).json({

 success:false,

 data:zunoData

 });

 }





 // =====================
 // SAVE POLICY
 // =====================


const policyNumber =

zunoData?.PolicyNr ||

zunoData?.policyNumber ||

Date.now().toString();






 const existing =
 await IssuedPolicy.findOne({

 policyNumber

 });



 if(existing){

 return res.status(200).json({

 success:true,

 data:existing

 });

 }




 const startDate =
 new Date();


 const endDate =
 new Date();


 endDate.setFullYear(
 endDate.getFullYear()+1
 );





 const saved =
 await IssuedPolicy.create({


 policyNumber,


 quoteNumber:
zunoData?.zzQuoteNo ||
quoteNo,


quoteOptionNumber:
zunoData?.zzQuoteOptNo ||
quoteOptionNo,

 customer:
 req.body.customer,


 vehicle:
 req.body.vehicle,


 premium:
 req.body.premium,


 status:
 "ISSUED",


 startDate,


 endDate,


 zunoResponse:
 zunoData


 });





 return res.status(200).json({


 success:true,


 data:saved


 });




}

catch(error:any){


 console.log(
 "ISSUE ERROR",
 error
 );


 return res.status(500).json({

 success:false,

 message:
 error.message

 });

}


}