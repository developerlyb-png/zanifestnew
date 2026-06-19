import type { NextApiRequest, NextApiResponse } from "next";


// =======================
// ZUNO MASTER TOKEN
// =======================

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

Authorization:
`Basic ${auth}`,

"Content-Type":
"application/x-www-form-urlencoded",

"x-api-key":
process.env.ZUNO_CV_MASTER_KEY!

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







// =======================
// RTO MASTER
// =======================

export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){

try{


const city =
req.query.city || "MUMBAI";


// TOKEN

const token =
await getZunoToken();



console.log(
"TOKEN OK:",
!!token
);




// RTO URL

const url =
`${process.env.ZUNO_BASE_URL}/rto/${city}`;


console.log(
"RTO URL:",
url
);




// RTO API

const response =
await fetch(
url,
{

method:"GET",

headers:{

Authorization:
token,

"X-API-KEY":
process.env.ZUNO_CV_MASTER_KEY!

}

}
);




const text =
await response.text();



console.log(
"RTO STATUS",
response.status
);


console.log(
"RTO RAW",
text
);



try{

return res
.status(response.status)
.json(JSON.parse(text));

}
catch{

return res
.status(response.status)
.send(text);

}



}
catch(error:any){


console.log(
"RTO ERROR",
error
);


return res.status(500).json({

message:error.message

});


}


}