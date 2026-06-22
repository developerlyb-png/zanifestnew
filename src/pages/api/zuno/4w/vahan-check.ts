import type {
 NextApiRequest,
 NextApiResponse
} from "next";

import axios from "axios";


export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){

if(req.method!=="POST"){

return res.status(405).json({
success:false
});

}


try{


const reg =
req.body.registrationNumber
.toUpperCase()
.trim();



const response =
await axios.get(

"https://devapi.hizuno.com/dev/vahanCheck/dashboard",

{

params:{

registration_no:reg

},

headers:{


"x-api-key":
process.env.ZUNO_VAHAN_X_API_KEY,


accept:"application/json"

}


}

);



return res.status(200).json({

success:true,

data:response.data

});



}

catch(error:any){


console.log(
"VAHAN FAILED",
error.response?.status,
error.response?.data
);


return res.status(500).json({

success:false,

error:error.response?.data

});


}


}