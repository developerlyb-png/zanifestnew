import type { NextApiRequest, NextApiResponse } from "next";


// TOKEN CREATE

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


return data.access_token;

}





export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){

try{


if(req.method !== "GET"){

return res.status(405).json({
message:"Method Not Allowed"
});

}


const {make}=req.query;


const token =
await getZunoToken();


const url =
`https://devapi.hizuno.com/cv/model?make=${make}`;


console.log(
"CV MODEL URL:",
url
);


const response =
await fetch(
url,
{

method:"GET",

headers:{

"Content-Type":
"application/json",


Authorization:
`Bearer ${token}`,

"x-api-key":
process.env.ZUNO_CV_MASTER_KEY!

}

}
);



const text =
await response.text();


console.log(
"STATUS:",
response.status
);


console.log(
"RAW MODEL:",
text
);



let data;


try{

data =
JSON.parse(text);

}
catch{

data={
message:text
};

}



return res
.status(response.status)
.json(data);



}
catch(error:any){


return res.status(500).json({

message:error.message

});


}

}