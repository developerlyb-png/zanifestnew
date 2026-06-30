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
 mobile,
 otp
}=req.body;



if(
!mobile ||
!otp
){

return res.status(400).json({

success:false,

message:"Mobile and OTP required"

});

}





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





await Otp.deleteOne({

mobile

});





return res.status(200).json({


success:true,


message:
"Mobile verified successfully"


});






}

catch(error:any){



console.log(
"VERIFY OTP ERROR",
error
);



return res.status(500).json({


success:false,


message:error.message


});


}



}