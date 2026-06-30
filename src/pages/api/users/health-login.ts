import type { NextApiRequest,NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";


export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){

try{


if(req.method !== "POST"){

return res.status(405).json({
message:"Only POST allowed"
});

}


await dbConnect();


const {
name,
email,
mobile
}=req.body;



let user = await User.findOne({

$or:[
 {email},
 {mobile}
]

});



// ===============================
// OLD USER UPDATE
// ===============================

if(user){


user.userName = name;

user.mobile = mobile;


await user.save();


}



// ===============================
// NEW USER CREATE
// ===============================

else{


user = await User.create({

userName:name,

email,

mobile

});


}



return res.status(200).json({

success:true,

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