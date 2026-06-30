import type {
 NextApiRequest,
 NextApiResponse
} from "next";

import { getZunoMakeName } from "@/utils/zunoBikeMapper";
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

 Authorization:`Basic ${auth}`,

 "Content-Type":
 "application/x-www-form-urlencoded",

 "x-api-key":
 process.env.ZUNO_X_API_KEY!

 },

 body:"grant_type=client_credentials"

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


const token =
await getZunoToken();



const {
 make,
 model,
 variant,
 idvCity
}=req.query;


const makeName = getZunoMakeName(String(make));
const response = await fetch(
`${process.env.ZUNO_BASE_URL}/two-wheeler/idv?make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(String(model))}&variant=${encodeURIComponent(String(variant))}&idvCity=${encodeURIComponent(String(idvCity))}`,

{

method:"GET",

headers:{

Authorization:
`Bearer ${token}`,

"x-api-key":
process.env.ZUNO_2W_MASTER_X_API_KEY!,

"Content-Type":
"application/json"

}

}

);


console.log({
  make: makeName,
  model,
  variant,
  idvCity,
});

console.log(
  `${process.env.ZUNO_BASE_URL}/two-wheeler/idv?make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(String(model))}&variant=${encodeURIComponent(String(variant))}&idvCity=${encodeURIComponent(String(idvCity))}`
);
const text =
await response.text();


console.log(
"IDV STATUS:",
response.status
);


console.log(
"IDV RAW:",
text
);


let data;


try{

 data =
 JSON.parse(text);

}catch{

 data = text;

}



return res
.status(response.status)
.json({

success:response.ok,

data:data

});


}catch(error:any){

return res.status(500).json({

message:"IDV API Failed",

error:error.message

});

}


}