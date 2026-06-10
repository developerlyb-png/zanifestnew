import type {
 NextApiRequest,
 NextApiResponse
} from "next";


import dbConnect from "@/lib/dbConnect";
import Otp from "@/models/Otp";

import nodemailer from "nodemailer";





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
 email,
 mobile
}=req.body;




if(!email || !mobile){


return res.status(400).json({

success:false,

message:"Missing fields"

});


}





const otp =
Math.floor(
100000+
Math.random()*900000
).toString();






// DELETE OLD OTP

await Otp.deleteMany({

email

});





// SAVE OTP

await Otp.create({


mobile,

email,

otp,


expire:
new Date(
Date.now()+5*60*1000
)


});








// =====================
// SEND EMAIL
// =====================


const transporter =
nodemailer.createTransport({


service:"gmail",


auth:{


user:
process.env.EMAIL_USER,


pass:
process.env.EMAIL_PASS


}


});






await transporter.sendMail({



from:
process.env.EMAIL_USER,


to:
email,


subject:
"Zanifest Insurance OTP Verification",



html:
`

<div style="font-family:Arial">

<h2>Zanifest Insurance</h2>

<p>Your verification OTP is:</p>


<h1>${otp}</h1>


<p>This OTP is valid for 5 minutes.</p>


</div>

`


});







console.log(
"EMAIL OTP SENT",
email,
otp
);







return res.status(200).json({


success:true,


message:
"Email OTP Sent"


});







}
catch(error:any){



console.log(
"EMAIL OTP ERROR",
error
);



return res.status(500).json({


success:false,


message:
error.message


});


}



}