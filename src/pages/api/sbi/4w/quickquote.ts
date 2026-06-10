import type {
 NextApiRequest,
 NextApiResponse
} from "next";

import axios from "axios";

import {
 encryptSBI,
 decryptSBI
} from "../common/encryption";



export default async function handler(
 req:NextApiRequest,
 res:NextApiResponse
){


if(req.method !== "POST"){

 return res.status(405).json({
  success:false,
  message:"Only POST allowed"
 });

}


try{


// SBI FORMAT

const payload = {

 RequestHeader:{

  requestID:
  Date.now().toString(),

  action:
  "quickQuote",

  channel:
  "SBIG",

  transactionTimestamp:
  new Date().toISOString()

 },


 RequestBody:
 req.body

};


console.log(
"QUICK QUOTE BODY",
payload
);



// encrypt

const encryptedPayload =
encryptSBI(payload);




// SBI API HIT

const response =
await axios.post(

`${process.env.SBI_BASE_URL}/motor/v1`,

encryptedPayload,

{

headers:{


"x-IBM-Client-Id":
process.env.SBI_CLIENT_ID,


"x-IBM-Client-Secret":
process.env.SBI_CLIENT_SECRET,


"Content-Type":
"application/json"


}

}

);



// decrypt


const result =
decryptSBI(
response.data
);




return res.status(200).json({


success:true,


premium:
result.DuePremium,


quotationNo:
result.QuotationNo,


data:
result


});



}
catch(error:any){


console.log(
"SBI 4W QUICK ERROR",
error.response?.data ||
error.message
);


return res.status(500).json({

success:false,

error:
error.response?.data ||
error.message

});

}

}