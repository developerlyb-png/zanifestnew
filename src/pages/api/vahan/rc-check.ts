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


// REMOVE DASH SPACE
const cleanNumber =
String(registrationNumber || "")
.toUpperCase()
.replace(/[^A-Z0-9]/g,"");


console.log(
"BIKE NUMBER SEND =>",
cleanNumber
);



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

rc_no:cleanNumber,

partner_request_id:
"BIKE"+Date.now()

})

}

);



const data =
await response.json();


console.log(
"BIKE VAHAN RESULT",
data
);



if(data.status !== 1){

return res.status(400).json({

success:false,

message:
data.msg || data.message,

raw:data

});

}



return res.status(200).json({

success:true,

vehicle:{


number:
data.cardData.result.reg_no,


brand:
data.cardData.result.vehicle_manufacturer_name,


model:
data.cardData.result.model,


fuel:
data.cardData.result.type,


engine:
data.cardData.result.engine,


chassis:
data.cardData.result.chassis,


year:
data.cardData.result.vehicle_manufacturing_month_year,


rto:
data.cardData.result.reg_authority,


cc:
data.cardData.result.vehicle_cubic_capacity,





rtoCode:
data.cardData.result.rto_code,


regDate:
data.cardData.result.reg_date
}


});


}
catch(error:any){


return res.status(500).json({

success:false,

message:error.message

});


}

}