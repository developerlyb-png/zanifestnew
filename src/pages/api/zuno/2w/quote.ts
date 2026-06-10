import type {
  NextApiRequest,
  NextApiResponse,
} from "next";


import ZunoTwoWheeler from
"@/services/insurers/zuno/twoWheeler";



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {


try {


if (req.method !== "POST") {

return res.status(405).json({

success:false,

message:"Method not allowed"

});

}



const result =
await ZunoTwoWheeler.quote(
req.body
);



return res.status(200).json({

success:true,

data:result

});



} catch(error:any){


console.log(
"ZUNO QUOTE ERROR",
error
);



return res.status(500).json({

success:false,

message:"Zuno quote failed",

error:error.message

});



}


}