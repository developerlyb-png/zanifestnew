import type {
  NextApiRequest,
  NextApiResponse
} from "next";

import axios from "axios";


// ================= TOKEN =================

async function getZunoToken(){

const basic =
Buffer.from(
`${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
).toString("base64");


const tokenResponse =
await axios.post(

process.env.ZUNO_TOKEN_URL!,

new URLSearchParams({

grant_type:"client_credentials"

}),

{

headers:{

Authorization:`Basic ${basic}`,

"Content-Type":
"application/x-www-form-urlencoded"

}

}

);


return tokenResponse.data.access_token;

}







// ================= FULL QUOTE =================


export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){


if(req.method !== "POST"){

return res.status(405).json({

message:"Only POST allowed"

});

}



try{


console.log("FULL QUOTE START");



// TOKEN

const token =
await getZunoToken();


console.log("TOKEN OK");





// ================= COPY QUICK RESPONSE =================


const payload =
JSON.parse(
JSON.stringify(req.body)
);


delete payload.webServiceResponseControl;



const policy =
payload.primaryRatingObject.policyData;







// ================= FULL MODE =================


policy.sourceRequest="PO";


policy.branch =
policy.branch || "HO";


delete policy.isFullQuote;

delete policy.quoteNumber;

delete policy.proposalNumber;









// ================= HOLDER =================


policy.policyHolder.gender ||= "2";

policy.policyHolder.salutation ||= "0002";

policy.policyHolder.maritalStatus ||= "2";

policy.policyHolder.profession ||= "0001";


policy.policyHolder.panNo ||=
"ABCDE1234F";



policy.policyHolder.nomineeDetails={

nomineeName:"Test Nominee",

nomineeRelation:"Brother",

nomineeAge:"30"

};



policy.policyHolder.kycDetails={

kycType:"PAN",

kycNumber:
policy.policyHolder.panNo,

ckycNumber:""

};










// ================= CONTRACT =================


let contract =
policy.contractDetails;



if(Array.isArray(contract)){


contract =
contract[0].contractDetails ||
contract[0];


}




if(!contract.coveragePackage){


throw new Error(
"coveragePackage missing"
);


}




const coverage =
contract.coveragePackage.coverage;









// ================= REMOVE PREMIUM OBJECTS =================
// Full quote does not need quick premium response


delete contract.contractPremium;


delete coverage.coveragePremium;

delete coverage.coveragePremiumTax;

delete coverage.coverageSurchargeandDiscount;

delete coverage.coverageDeductible;










// ================= COVERAGE FIX =================


coverage.subCoverage =
(
coverage.subcoverage ||
coverage.subCoverage ||
[]
)
.map((item:any)=>{



delete item.grossPremium;

delete item.netPremium;

delete item.taxAmount;

delete item.discount;



if(!item.subCoverageLimit){

item.subCoverageLimit={};

}



delete item.subCoverageLimit.maximumLimit;




if(
item.subCoverageLimit.limit===undefined
){

item.subCoverageLimit.limit =
item.sumInsured || "0";

}



if(
item.sumInsured===undefined
){

item.sumInsured =
item.subCoverageLimit.limit;

}



if(
!item.subCoverageLimit.freeTextLimit
){

item.subCoverageLimit.freeTextLimit="NA";

}



return item;


});



delete coverage.subcoverage;







// contract array

policy.contractDetails =
[
contract
];










// ================= INSURED =================


function cleanInsured(item:any){



if(item.dateofBirth){


item.dateOfBirth =
item.dateofBirth;


delete item.dateofBirth;

}



return {

...item,


gender:
item.gender || "2",


salutation:
item.salutation || "0002",


height:
item.height || "170",


weight:
item.weight || "70",


preExistingDisease:
"0",


medicalQuestionnaire:
item.medicalQuestionnaire || [],


relationshipWithProposer:
item.relationshipWithProposer || "1"


};


}




if(
Array.isArray(
contract.insuredObject
)
){


contract.insuredObject =
contract.insuredObject.map(
cleanInsured
);


}

else{


contract.insuredObject =
[
cleanInsured(
contract.insuredObject
)
];


}









// ================= CLEAN EMPTY =================


function clean(obj:any){


if(
!obj ||
typeof obj !== "object"
){

return;

}


Object.keys(obj)
.forEach(key=>{


if(
obj[key]===null ||
obj[key]===undefined ||
obj[key]===""
){


delete obj[key];


}

else{


clean(obj[key]);


}


});


}



clean(policy);









// ================= DEBUG =================


const subs =
policy.contractDetails[0]
.coveragePackage
.coverage
.subCoverage;



console.log(
"COVER COUNT",
subs.length
);



console.log(
"LIMIT COUNT",
subs.filter(
(x:any)=>x.subCoverageLimit
).length
);



console.log(
"FINAL PAYLOAD",
JSON.stringify(
policy,
null,
2
)
);










// ================= FINAL REQUEST =================


const finalPayload={


primaryRatingObject:{


policyData:policy


}


};







const response =
await axios.post(


`${process.env.ZUNO_HEALTH_URL}/full-quote`,


finalPayload,


{


headers:{


Authorization:
`Bearer ${token}`,



"x-api-key":
process.env.ZUNO_HEALTH_API_KEY!,



"x-api-key-name":
"health",



"Content-Type":
"application/json"


}


}


);






console.log(
"FULL QUOTE SUCCESS",
JSON.stringify(response.data,null,2)
);




return res.status(200)
.json(response.data);






}

catch(error:any){



console.log(
"===== FULL FAILED ====="
);


console.log(
"STATUS:",
error.response?.status
);



console.log(
"DATA:",
JSON.stringify(
error.response?.data ||
error.message,
null,
2
)
);



return res.status(500).json({

message:"Full quote failed",

error:
error.response?.data ||
error.message

});


}
}