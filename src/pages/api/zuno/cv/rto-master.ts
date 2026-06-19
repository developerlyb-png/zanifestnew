import type {
 NextApiRequest,
 NextApiResponse
} from "next";



// ======================
// TOKEN CREATE
// ======================

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



const text =
await response.text();



console.log(
"TOKEN STATUS:",
response.status
);


console.log(
"TOKEN RAW:",
text
);



if(!response.ok){

throw new Error(text);

}



const data =
JSON.parse(text);


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




// ======================
// GET TOKEN
// ======================


const token =
await getZunoToken();



console.log(
"CV TOKEN:",
token
);




// ======================
// RTO MASTER API
// ======================


const url =
`${process.env.ZUNO_BASE_URL}/cv/rtoMaster`;



console.log(
"CV RTO URL:",
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

"x-api-key":
process.env.ZUNO_CV_MASTER_KEY!

}

}

);





const text =
await response.text();




console.log(
"RTO STATUS:",
response.status
);



console.log(
"RAW RTO:",
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



console.log(
"RTO MASTER ERROR:",
error
);



return res.status(500).json({

success:false,

message:error.message

});



}



}