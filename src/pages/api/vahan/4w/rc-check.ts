import type {
 NextApiRequest,
 NextApiResponse
} from "next";


export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){

try{


if(req.method !== "POST"){

return res.status(405).end();

}


const {
registrationNumber
}=req.body;



const response =
await fetch(
"https://verify.rechargkit.biz/validation/rcAdvanceVerify",
{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:
`Bearer ${process.env.RECHARGEKIT_TOKEN}`

},

body:JSON.stringify({

rc_no:registrationNumber,

partner_request_id:
"RC"+Date.now()

})

}

);



const data =
await response.json();


console.log(
"RECHARGEKIT RAW RESPONSE",
data
);



if(
data.status !== 1
){

return res.status(400).json({

success:false,

message:
data.msg || data.message,

raw:data

});

}



return res.status(200).json({

success:true,

data:
data.cardData.result

});


}
catch(error:any){


return res.status(500).json({

success:false,

message:error.message

});


}

}