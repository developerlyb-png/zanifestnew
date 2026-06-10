import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import axios from "axios";

import {
  encryptSBI,
  decryptSBI,
} from "../common/encryption";


export default async function handler(
 req: NextApiRequest,
 res: NextApiResponse
) {


if(req.method !== "POST"){

return res.status(405).json({
success:false,
message:"Only POST allowed"
});

}


try{


// ======================
// STEP 1 TOKEN
// ======================


const tokenResponse =
await axios.get(

"https://devapi.sbigeneral.in/cld/v1/token",

{

headers:{


"X-IBM-Client-Id":

process.env.SBI_CLIENT_ID,


"X-IBM-Client-Secret":

process.env.SBI_CLIENT_SECRET,


"Content-Type":

"application/json"

}

}

);



const token =
tokenResponse.data.access_token;


console.log(
"SBI TOKEN:",
token
);




// ======================
// STEP 2 ENCRYPT DATA
// ======================


const encryptedBody = {


ciphertext:

encryptSBI(req.body)


};



console.log(
"CKYC BODY",
encryptedBody
);





// ======================
// STEP 3 CKYC API
// ======================



const ckycResponse =
await axios.post(


"https://devapi.sbigeneral.in/pt/ckycDocUpload/insertDataWithImage",


encryptedBody,


{

headers:{


Authorization:

`Bearer ${token}`,



"X-IBM-Client-Id":

process.env.SBI_CLIENT_ID,



"X-IBM-Client-Secret":

process.env.SBI_CLIENT_SECRET,



"Content-Type":

"application/json"


}

}


);




// ======================
// STEP 4 DECRYPT RESPONSE
// ======================


let result =
ckycResponse.data;



if(
ckycResponse.data.ciphertext
){

result =
decryptSBI(

ckycResponse.data.ciphertext

);

}




return res.status(200).json({


success:true,


data:result


});




}catch(error:any){


console.log(
"SBI CKYC ERROR",
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