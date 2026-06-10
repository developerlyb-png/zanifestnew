import type {
 NextApiRequest,
 NextApiResponse
} from "next";


import dbConnect from "@/lib/dbConnect";
import Otp from "@/models/Otp";




export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){


try{


if(req.method !== "POST"){

return res.status(405).end();

}



await dbConnect();




const {
 mobile
}=req.body;




if(!mobile){


return res.status(400).json({


success:false,


message:"Mobile required"


});


}






// =====================
// GENERATE OTP
// =====================


const otp =
Math.floor(
100000+
Math.random()*900000
).toString();








// =====================
// DELETE OLD OTP
// =====================


await Otp.deleteMany({

mobile

});








// =====================
// SAVE OTP
// =====================


await Otp.create({



mobile,


otp,



expire:
new Date(
Date.now()+5*60*1000
)



});









// =====================
// PACKVIBE WHATSAPP
// =====================



const to =
"91" +
mobile.replace(/\D/g,"");





const payload={



messaging_product:
"whatsapp",



to:
to,



type:
"template",



template:{



name:
"otp_verification",




language:{


code:
"en_US"


},




components:[




{


type:
"body",



parameters:[


{


type:
"text",



text:
otp



}


]


},






{


type:
"button",


sub_type:
"url",


index:
"0",



parameters:[


{


type:
"text",



text:
otp



}


]



}



]



}



};








const response =
await fetch(

"https://crm.packvibeindia.com/api/meta/v19.0/908952548968056/messages",

{


method:"POST",



headers:{



Authorization:
`Bearer ${process.env.PACKVIBE_TOKEN}`,



"Content-Type":
"application/json"



},




body:
JSON.stringify(payload)



}


);







const result =
await response.json();






console.log(
"WHATSAPP RESPONSE",
result
);







if(!response.ok){



return res.status(400).json({


success:false,


message:"WhatsApp failed",


error:result



});


}










return res.status(200).json({

success:true,

message:
"OTP sent on WhatsApp",

whatsapp:
result.message

});







}
catch(error:any){





console.log(
"SEND OTP ERROR",
error
);






return res.status(500).json({



success:false,


message:
error.message



});




}



}