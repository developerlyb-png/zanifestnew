import type {
NextApiRequest,
NextApiResponse
} from "next";


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


const {
registrationNumber
}=req.body;



const response =
await fetch(
process.env.SBI_4W_VAHAN_URL!,
{

method:"POST",

headers:{

"Content-Type":
"application/json",


// SAME AS YOUR 2W
"Authorization":
req.headers.authorization || ""

},


body:JSON.stringify({

registrationNumber

})


}

);



const data =
await response.json();



console.log(
"SBI VAHAN:",
data
);



return res.status(200).json({

success:true,

data

});


}

catch(err:any){


return res.status(500).json({

success:false,

error:err.message

});

}


}