import type {
 NextApiRequest,
 NextApiResponse,
} from "next";


export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){

try{


if(req.method !== "POST"){


return res.status(405).json({

success:false,

message:"Only POST"

});


}



const {registrationNo}=req.body;



if(!registrationNo){


return res.status(400).json({

success:false,

message:"registrationNo required"

});


}



// EXACT YAML URL

const url =
`${process.env.ZUNO_VAHAN_URL}/dashboard/`;



console.log("VAHAN URL:",url);

console.log(
"API KEY:",
process.env.ZUNO_VAHAN_X_API_KEY ? "YES":"NO"
);

console.log(
"REG:",
registrationNo
);





const response =
await fetch(
url,
{

method:"GET",

headers:{


"x-api-key":
process.env.ZUNO_VAHAN_X_API_KEY!,


Accept:
"application/json",


// try both possible names

"registrationNo":
registrationNo,


"registration-no":
registrationNo


}


}

);




const text =
await response.text();



console.log(
"STATUS:",
response.status
);


console.log(
"RAW:",
text
);




let data:any;


try{

data=JSON.parse(text);

}
catch{

data=text;

}




return res.status(response.status)
.json({

success:
response.ok,

data

});





}

catch(error:any){


console.log(
"VAHAN ERROR",
error
);



return res.status(500).json({

success:false,

message:error.message

});

}


}