import type {
 NextApiRequest,
 NextApiResponse
} from "next";



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


 Authorization:
 `Basic ${auth}`,


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



const {

idvCity

}=req.query;



if(!idvCity){


return res.status(400).json({

message:
"idvCity required"

});


}





const token =
await getZunoToken();





const response =
await fetch(

`${process.env.ZUNO_BASE_URL}/rto/${idvCity}`,

{


method:"GET",



headers:{


Authorization:
`Bearer ${token}`,



// RTO MASTER KEY
"x-api-key":
process.env.ZUNO_2WR_MASTER_X_API_KEY!,



"Content-Type":
"application/json"



}


}


);




const data =
await response.json();




console.log(
"RTO STATUS",
response.status
);



console.log(
"RTO DATA",
data
);





return res
.status(response.status)
.json(data);






}catch(error:any){



return res.status(500).json({

message:
"RTO API Failed",


error:
error.message


});



}



}