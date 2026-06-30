import type {
 NextApiRequest,
 NextApiResponse
} from "next";



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
process.env.ZUNO_X_API_KEY!

},

body:
"grant_type=client_credentials"

}

);



const data =
await response.json();


console.log(
"TOKEN RESPONSE",
data
);


return data.access_token;


}







export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){


try{


const city =
req.query.idvCity || "DELHI";



const token =
await getZunoToken();



console.log(
"TOKEN OK",
!!token
);



const url =
`${process.env.ZUNO_BASE_URL}/rto/${city}`;



console.log(
"2W RTO URL",
url
);




const response =
await fetch(
url,
{

method:"GET",

headers:{


Authorization:
token,


"X-API-KEY":
process.env.ZUNO_2WR_MASTER_X_API_KEY!,


"Content-Type":
"application/json"


}

}
);



const text =
await response.text();



console.log(
"2W RTO STATUS",
response.status
);


console.log(
"2W RTO RAW",
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
.json({
message:text
});

}




}
catch(error:any){


return res.status(500).json({

message:
"RTO API Failed",

error:
error.message

});


}


}