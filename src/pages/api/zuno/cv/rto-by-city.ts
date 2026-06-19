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
process.env.ZUNO_2WR_MASTER_X_API_KEY!

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


const {city}=req.query;



if(!city){

return res.status(400).json({

message:"City required"

});

}



const token =
await getZunoToken();




const url =
`${process.env.ZUNO_RTO_URL}/${city}`;


console.log(
"RTO URL:",
url
);




const response =
await fetch(
url,
{

method:"GET",

headers:{


Authorization:
`Bearer ${token}`,


"x-api-key":
process.env.ZUNO_2WR_MASTER_X_API_KEY!,


Accept:
"application/json"


}


}

);




console.log(
"RTO STATUS:",
response.status
);



const text =
await response.text();



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
"RTO ERROR",
error
);



return res.status(500).json({

message:error.message

});


}


}