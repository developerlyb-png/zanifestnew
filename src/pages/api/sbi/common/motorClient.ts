import axios from "axios";


export async function callMotor(
 endpoint:string,
 payload:any
){


const response =
await axios.post(

`${process.env.SBI_BASE_URL}${endpoint}`,

payload,

{

headers:{


"x-IBM-Client-Id":
process.env.SBI_CLIENT_ID,


"x-IBM-Client-Secret":
process.env.SBI_CLIENT_SECRET,


"Content-Type":
"application/json"

}

}

);


return response.data;

}