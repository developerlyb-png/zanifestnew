import type {
 NextApiRequest,
 NextApiResponse
} from "next";


export default async function handler(
req:NextApiRequest,
res:NextApiResponse
){

try{


if(req.method !== "POST"){

return res.status(405).end();

}


const {
registrationNumber
}=req.body;



const response =
await fetch(
"https://verify.rechargkit.biz/validation/rcAdvanceVerify",
{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:
`Bearer ${process.env.RECHARGEKIT_TOKEN}`

},

body:JSON.stringify({

rc_no:registrationNumber,

partner_request_id:
"RC"+Date.now()

})

}

);



const data =
await response.json();


console.log(
"RECHARGEKIT RAW RESPONSE",
data
);



// RechargeKit wraps the RC record: cardData.data.result holds owner,
// vehicle, registration and insurance blocks, and currentCredit/creditUsed
// sit beside it. Flatten to the field names the car flow already reads.
const card = data.cardData || {};
const record = card.data?.result;

if (data.status !== 1 || card.error === true || !record) {
  return res.status(400).json({
    success: false,
    message: card.data?.errorMessage || data.msg || data.message || "RC lookup failed",
    raw: data
  });
}

const vehicle = record.vehicle_details || {};
const registration = record.registration_details || {};
const owner = record.owner_details || {};
const rcNumber = String(registration.rc_number || "").toUpperCase();
const toDmy = (iso: string) => {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

const rc = {
  reg_no: rcNumber,
  reg_date: toDmy(vehicle.registration_date),
  rto_code: rcNumber.slice(0, 4),
  vehicle_manufacturer_name: vehicle.maker || "",
  model: vehicle.model || "",
  type: vehicle.fuel_type || "",
  vehicle_cubic_capacity: vehicle.cubic_capacity != null ? String(vehicle.cubic_capacity) : "",
  body_type: vehicle.body_type || "",
  engine: vehicle.engine_number || "",
  chassis: vehicle.chassis_number || "",
  owner_name: owner.name || "",
  pincode: (String(owner.present_address || "").match(/\b(\d{6})\b/) || String(owner.permanent_address || "").match(/\b(\d{6})\b/) || [])[1] || "",
  raw: record
};

return res.status(200).json({
  success: true,
  data: rc
});


}
catch(error:any){


return res.status(500).json({

success:false,

message:error.message

});


}

}