import type {
 NextApiRequest,
 NextApiResponse
} from "next";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";


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
fullName,
email
}=req.body;



if(!mobile || !email){

return res.status(400).json({

success:false,

message:"Mobile and email required"

});

}


const userEmail =
email.toLowerCase();



// CHECK EXISTING USER

let user =
await User.findOne({

$or:[

{mobile},

{email:userEmail}

]

});





// UPDATE EXISTING USER

if(user){


user.userName =
fullName || user.userName;


user.mobile =
mobile;


user.email =
userEmail;


user.isVerified=true;



await user.save();


}




// CREATE NEW USER

else{


user =
await User.create({


mobile,


email:userEmail,


userName:
fullName || "Customer",


isVerified:true


});


}





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

catch(error:any){


console.log(error);



return res.status(500).json({

success:false,

message:error.message

});


}



}