import type {
 NextApiRequest,
 NextApiResponse
} from "next";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callRechargeKit(rcNo: string) {
  const partnerReqId = "RC" + Date.now() + Math.floor(Math.random() * 1000);
  const response = await fetch(
    "https://verify.rechargkit.biz/validation/rcAdvanceVerify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RECHARGEKIT_TOKEN}`,
      },
      body: JSON.stringify({ rc_no: rcNo, partner_request_id: partnerReqId }),
    }
  );
  const data = await response.json();
  return { data, partnerReqId };
}

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

// RechargeKit's upstream VAHAN lookup is flaky — the same rc_no can fail
// on one attempt (status 3, "RC Advance validation failed") and succeed
// immediately on a fresh retry (confirmed live, same as the 2W handler).
// Each attempt needs its own partner_request_id (RechargeKit rejects
// reuse), and each is a new order on their side, so keep retries low.
const MAX_ATTEMPTS = 2;
let data: any = null;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  const result = await callRechargeKit(registrationNumber);
  data = result.data;
  console.log(`RECHARGEKIT ATTEMPT ${attempt} status=${data.status} msg=${data.msg}`, data);

  if (data.status === 1 || data.status === 2) break; // success or genuinely pending
  if (attempt < MAX_ATTEMPTS) await sleep(1500); // transient failure — retry fresh
}

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