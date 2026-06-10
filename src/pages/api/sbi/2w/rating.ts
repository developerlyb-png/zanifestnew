import type {
  NextApiRequest,
  NextApiResponse,
} from "next";


// TOKEN FUNCTION

async function getZunoToken() {

  const auth = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
  ).toString("base64");


  const response = await fetch(
    `${process.env.ZUNO_BASE_URL}/oauth2/token`,
    {
      method:"POST",

      headers:{

        Authorization:`Basic ${auth}`,

        "Content-Type":
        "application/x-www-form-urlencoded",

        "x-api-key":
        process.env.ZUNO_X_API_KEY!,

      },

      body:
      "grant_type=client_credentials",

    }
  );


  const data =
  await response.json();


  return data.access_token;

}




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



 const token =
 await getZunoToken();




 const zunoPayload:any = {


commissionContractID:"1000014234",

channelCode:"002",

branch:"AHMEDABAD",


// TEST MASTER DATA

make:
req.body.vehicle.make.toUpperCase(),


model:
req.body.vehicle.model.toUpperCase(),


variant:
req.body.vehicle.variant || "BS VI",


idvCity:"AHMEDABAD",

rtoStateCode:"06",

rtoLocationName:"GJ-01",

rtoZone:"06",

rtoCityOrDistrict:"Ahmedabad",

clusterZone:"Cluster 3",

carZone:"A",


idv:"112182",


registrationDate:"2024-06-05",


previousInsurancePolicy:"0",


policyType:"Bundled Insurance",


subPolicyType:"",


typeOfBusiness:"New",


policyStartDate:"2024-06-05",


policyTenure:"5",


contractTenure:"5",


claimDeclaration:"",

annualMileage:"",

transmissionType:"",


fuelType:"Petrol",


validLicenceNo:"Y",


previousNcb:"",


transferOfNcb:"N",


proofOfNcb:"NCBRESRV",


protectionofNcbValue:"",


breakininsurance:"NBK",


renewalStatus:"New Policy",


dateOfTransaction:"2024-06-05",


fibreGlassFuelTank:"Yes",


overrideAllowableDiscount:"N",


antiTheftDeviceInstalled:"Yes",


automobileAssociationMember:"Yes",


bodystyleDescription:"COUPE",


dateOfFirstPurchaseOrRegistration:
"2024-06-05",


dateOfBirth:"1989-12-12",


policyHolderGender:"Male",


policyholderOccupation:
"Medium to High",


typeOfGrid:"Grid1",




contractDetails:[


{
contract:"Own Damage Contract",

coverage:{

coverage:"Own Damage Coverage",


deductible:[

"Own Damage Basis Deductible",

"Voluntary Deductible"

],


voluntaryDeductible:"3000",



discount:[

"Auto Mobile Association Discount",

"Voluntary Deductible Discount",

"Side car Discount",

"AntiTheft Discount"

],



subCoverage:[


{

subCoverage:"Own Damage Basic",

limit:"Own Damage Basic Limit"

}


]

}

},




{

contract:"Addon Contract",


coverage:{


coverage:"Add On Coverage",


deductible:
"Key Replacement Deductible",



underwriterDiscount:"0.0",



subCoverage:[


{
subCoverage:"Return To Invoice"
},


{
subCoverage:"Pillion Protect",

limit:"Pillion Protect Limit",

sumInsuredPerPerson:"50000"

},


{
subCoverage:"Zero Depreciation"
},


{
subCoverage:"Consumable Cover"
}


]


}


},




{

contract:"PA Compulsary Contract",


coverage:{


coverage:
"PA Owner Driver Coverage",



subCoverage:{


subCoverage:
"PA Owner Driver",


limit:
"PA Owner Driver Limit",


sumInsuredPerPerson:
"1500000"


}


}

},





{

contract:
"Third Party Multiyear Contract",



coverage:{



coverage:
"Legal Liability to Third Party Coverage",



deductible:"TP Deductible",



discount:
"Third Party Property Damage Discount",




subCoverage:[


{


subCoverage:
"Third Party Basic Sub Coverage",


limit:
"Third Party Property Damage Limit",


thirdPartyPropertyDamageLimit:
"6000"


}


]


}


}


]

};




console.log(
 "TOKEN:",
 token ? "YES":"NO"
);



console.log(
 "FINAL ZUNO PAYLOAD",
 JSON.stringify(zunoPayload)
);





const response =
await fetch(

`${process.env.ZUNO_BASE_URL}/motor-two-wheeler/rating`,

{

method:"POST",


headers:{


Authorization:
`Bearer ${token}`,


"Content-Type":
"application/json",


"x-api-key":
process.env.ZUNO_X_API_KEY!,


},



body:
JSON.stringify(zunoPayload)



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




let data;

try{

data=JSON.parse(text);

}catch{

data=text;

}




return res.status(response.status).json({

success:response.ok,

data

});



 }
 catch(error:any){


 console.log(
 "ERROR",
 error
 );


 return res.status(500).json({

 success:false,

 error:error.message

 });


 }


}