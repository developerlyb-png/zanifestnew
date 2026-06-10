import type {
 NextApiRequest,
 NextApiResponse
} from "next";


import jwt from "jsonwebtoken";

import { serialize } from "cookie";


import dbConnect from "@/lib/dbConnect";

import User from "@/models/User";

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
 mobile,
 otp,
 fullName,
 email
}=req.body;






// =====================
// OTP CHECK
// =====================


const savedOtp =
await Otp.findOne({

mobile

});




console.log(
"OTP FROM DB",
savedOtp
);



if(!savedOtp){


return res.status(400).json({

success:false,

message:"OTP expired"

});


}




if(

String(savedOtp.otp).trim()

!==

String(otp).trim()

){



return res.status(400).json({

success:false,

message:"Wrong OTP"

});



}





if(
new Date() >
savedOtp.expire
){


await Otp.deleteOne({
mobile
});



return res.status(400).json({

success:false,

message:"OTP expired"

});


}






// =====================
// CREATE / LOGIN USER
// =====================



let user =
await User.findOne({

mobile

});





if(!user){



if(email){


user =
await User.create({

email:
email,

mobile,

userName:
fullName || "Customer",

isVerified:true

});


}



}

else{


user.mobile = mobile;


user.userName =
fullName;


user.email =
email;


user.isVerified=true;


await user.save();


}






// remove otp


await Otp.deleteOne({

mobile

});


// ONLY MOBILE VERIFIED RESPONSE

if(!user){


return res.status(200).json({

success:true,

message:"Mobile verified"

});


}




// =====================
// JWT
// =====================


const token =
jwt.sign(

{

id:user._id,

email:user.email,

userName:user.userName

},


process.env.JWT_SECRET!,


{
expiresIn:"1d"
}

);







// =====================
// COOKIE LOGIN
// =====================


res.setHeader(

"Set-Cookie",

serialize(

"userToken",

token,

{

httpOnly:true,

secure:
process.env.NODE_ENV==="production",


path:"/",


sameSite:"lax",


maxAge:
60*60*24

}

)

);








return res.status(200).json({


success:true,


message:
"Login successful",



user:{

id:user._id,

name:user.userName,

email:user.email,

mobile:user.mobile

}



});





}

catch(error){


console.log(
"VERIFY OTP ERROR",
error
);



return res.status(500).json({

success:false,

message:"Server error"

});


}



}