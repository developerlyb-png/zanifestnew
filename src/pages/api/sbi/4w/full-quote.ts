import type { NextApiRequest, NextApiResponse } from "next";
import { getSbiToken } from "@/lib/sbiToken";


export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){

if(req.method !== "POST"){
return res.status(405).json({
message:"Method not allowed"
});
}


try{


const token = await getSbiToken();


const payload = req.body;


console.log("SBI TOKEN", token ? "YES":"NO");

console.log(
"SBI QUOTE PAYLOAD",
JSON.stringify(payload,null,2)
);



const response = await fetch(
`${process.env.SBI_BASE_URL}/cld/v1/fullQuote`,
{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:`Bearer ${token}`,

"X-IBM-Client-Id":
process.env.SBI_CLIENT_ID!,

"X-IBM-Client-Secret":
process.env.SBI_CLIENT_SECRET!,

},

body:JSON.stringify(payload)

}

);



const text = await response.text();


console.log("SBI STATUS",response.status);

console.log("SBI RAW",text);



return res.status(response.status).send(text);



}catch(error:any){

console.log(
"SBI QUOTE ERROR",
error
);


return res.status(500).json({

message:error.message

});

}


}