import type {
 NextApiRequest,
 NextApiResponse
} from "next";



// TOKEN

async function getZunoToken(){


const auth =
Buffer.from(
`${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
)
.toString("base64");



const response =
await fetch(

`${process.env.ZUNO_BASE_URL}/oauth2/token`,

{

method:"POST",


headers:{


Authorization:
`Basic ${auth}`,


"Content-Type":
"application/x-www-form-urlencoded",


"x-api-key":
process.env.ZUNO_KYC_X_API_KEY!


},


body:
"grant_type=client_credentials"


}

);



const data =
await response.json();


console.log(
"TOKEN API",
data
);



return data.access_token;


}








export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){


try{


if(req.method !== "POST"){

return res.status(405).json({
success:false
});

}




const token =
await getZunoToken();



console.log(
"TOKEN CHECK",
token ? "YES":"NO"
);





const kycPayload={


MIBL_Unique_ID:
Date.now().toString(),


Search_Type:
"PAN",


ProposerType:
"I",


Customer_full_name:
req.body.customer.fullName,


Pan_Details:{


pan_no:
req.body.customer.pan,


dob:
"01-01-1999"


},


Ckyc_Details:{},

Aadhaar_details:{},

Epic_Details:{},

DL_Details:{},

Passport_Details:{},

Cin_Details:{},


pep_flag:false,


Form_60_flag:false,


Other_Add_Field1:"",

Other_Add_Field2:"",

Other_Add_Field3:"",

Other_Add_Field4:"",

Other_Add_Field5:""


};




console.log(
"MIBL KYC PAYLOAD",
JSON.stringify(kycPayload)
);





const response =
await fetch(


`${process.env.ZUNO_BASE_URL}/mibl-ekyc/e-kyc`,


{


method:"POST",


headers:{


Authorization:
`Bearer ${token}`,



"Content-Type":
"application/json",



"x-api-key":
process.env.ZUNO_KYC_X_API_KEY!



},



body:
JSON.stringify(kycPayload)



}


);




const text =
await response.text();



console.log(
"KYC STATUS",
response.status
);


console.log(
"KYC RAW",
text
);





let data;


try{

data=JSON.parse(text);

}
catch{

data=text;

}





return res.status(response.status).json({

success:
response.ok,


data


});




}
catch(error:any){


console.log(
"KYC ERROR",
error
);



return res.status(500).json({

success:false,

message:error.message

});


}



}