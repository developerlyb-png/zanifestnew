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
 email,
 otp,
 fullName
}=req.body;


console.log(
"VERIFY BODY",
req.body
);

// =====================
// EMAIL OTP CHECK
// =====================


const savedOtp =
await Otp.findOne({

email

});



console.log(
"EMAIL OTP DB",
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
mobile,
email
});


return res.status(400).json({

success:false,
message:"OTP expired"

});


}






// =====================
// CREATE / UPDATE USER
// =====================


// =====================
// CREATE / UPDATE USER
// =====================

let user =
await User.findOne({

email:savedOtp.email

});


// agar email se nahi mila to mobile se check
if(!user){

user =
await User.findOne({

mobile:
savedOtp.mobile

});

}




if(!user){


user =
await User.create({


email:
savedOtp.email,


mobile:
savedOtp.mobile,


userName:
fullName || "Customer",


isVerified:true


});


}

else{


user.email =
savedOtp.email;


user.mobile =
savedOtp.mobile;


user.isVerified =
true;


if(fullName){

user.userName =
fullName;

}


await user.save();


}



if(!user){


user =
await User.create({

email,

mobile,

userName:
fullName || "Customer",

isVerified:true


});


}
else{


user.email=email;

user.userName =
fullName || user.userName;

user.isVerified=true;


await user.save();


}




await Otp.deleteOne({

mobile,
email

});






// =====================
// JWT LOGIN
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

message:"Login successful",


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
"VERIFY EMAIL OTP ERROR",
error
);


return res.status(500).json({

success:false,
message:"Server error"

});


}


}