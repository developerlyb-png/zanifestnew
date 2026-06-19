import type { NextApiRequest, NextApiResponse } from "next";



// =======================
// ZUNO TOKEN
// =======================


async function getZunoToken(){


try{


const auth =
Buffer.from(
`${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
)
.toString("base64");



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


"X-API-KEY":
process.env.ZUNO_CV_KEY!


},


body:
"grant_type=client_credentials"


}
);




const data =
await response.json();



console.log(
"FULL QUOTE TOKEN RESPONSE:",
data
);



return data.access_token;



}
catch(error){


console.log(
"TOKEN ERROR:",
error
);



throw error;


}



}









// =======================
// FULL QUOTE API
// =======================


export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){



try{



if(req.method !== "POST"){


return res.status(405).json({

success:false,

message:
"Only POST allowed"

});


}





console.log(
"CV FULL QUOTE URL:",
`${process.env.ZUNO_BASE_URL}/commercial-vehicle/full-quote`
);






// TOKEN

const token =
await getZunoToken();





if(!token){


return res.status(401).json({


success:false,


message:
"Zuno token not generated"


});


}






console.log(
"FULL TOKEN OK"
);









// PAYLOAD


const payload =
req.body;





console.log(
"FINAL CV FULL PAYLOAD:",
JSON.stringify(
payload,
null,
2
)
);








// ZUNO FULL QUOTE CALL


const response =
await fetch(

`${process.env.ZUNO_BASE_URL}/commercial-vehicle/full-quote`,

{


method:"POST",



headers:{


"Content-Type":
"application/json",



Authorization:
`Bearer ${token}`,



"X-API-KEY":
process.env.ZUNO_CV_KEY!



},




body:
JSON.stringify(payload)



}

);








const text =
await response.text();






console.log(
"FULL QUOTE STATUS:",
response.status
);





console.log(
"FULL RESPONSE HEADERS:",
Object.fromEntries(
response.headers.entries()
)
);






console.log(
"FULL QUOTE RAW:",
text
);









let data:any;



try{


data =
JSON.parse(text);



}
catch{


data={

message:text

};



}










// ZUNO TIMEOUT

if(
response.status===500 &&
text.includes("ETIMEDOUT")
){



return res.status(503).json({


success:false,


message:
"Zuno CV full quote service unavailable",


zunoError:
data



});


}










// EMPTY OBJECT ERROR


if(
response.status===500 &&
JSON.stringify(data)==="{}"
){



return res.status(500).json({


success:false,


message:
"Zuno Full Quote internal error / missing quick quote dependency",


hint:
"First successful quick quote response may be required",


payloadSent:
payload



});


}











// SUCCESS / NORMAL ERROR


return res
.status(response.status)
.json({


success:
response.ok,


data:data



});








}
catch(error:any){






console.log(
"FULL QUOTE ERROR:",
error
);





return res.status(500).json({


success:false,


message:
error.message



});




}



}