import type {
 NextApiRequest,
 NextApiResponse
} from "next";

import { getZunoMakeName } from "@/utils/zunoBikeMapper";
// TOKEN FUNCTION

async function getZunoToken(){

 const auth = Buffer.from(
  `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
 ).toString("base64");


 const response = await fetch(
 `${process.env.ZUNO_BASE_URL}/oauth2/token`,
 {
  method:"POST",

  headers:{

   Authorization:`Basic ${auth}`,

   "Content-Type":
   "application/x-www-form-urlencoded",

   "x-api-key":
   process.env.ZUNO_X_API_KEY!,

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
  message:"Only GET"
 });

}



const token =
await getZunoToken();



const {make} =
req.query;

const makeName = getZunoMakeName(String(make));

console.log("TOKEN =>", token);

console.log("MAKE =>", makeName);

console.log(
  "URL =>",
  `${process.env.ZUNO_BASE_URL}/two-wheeler/model?make=${encodeURIComponent(makeName)}`
);

const response = await fetch(
  `${process.env.ZUNO_BASE_URL}/two-wheeler/model?make=${encodeURIComponent(makeName)}`,
  {
    method: "GET",

    headers: {
      Authorization: `Bearer ${token}`,

      "x-api-key": process.env.ZUNO_2W_MASTER_X_API_KEY!,

      "Content-Type": "application/json",
    },
  }
);

// Read response as text first
const body = await response.text();

console.log("STATUS =>", response.status);
console.log("BODY =>", body);

try {
  return res.status(response.status).json(JSON.parse(body));
} catch {
  return res.status(response.status).send(body);
}



const data =
await response.json();

console.log("MAKE =>", makeName);
console.log("STATUS =>", response.status);
console.log("MODEL API RESPONSE =>", data);

return res
.status(response.status)
.json(data);



}catch(error:any){


return res.status(500).json({

message:"Model API Failed",

error:error.message

});


}


}