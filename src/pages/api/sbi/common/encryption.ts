import crypto from "crypto";


const key =
process.env.SBI_ENCRYPTION_KEY!;


const iv =
process.env.SBI_IV!;

console.log(
"KEY LENGTH",
key.length
);

console.log(
"IV LENGTH",
iv.length
);

export function encryptSBI(data:any){


const cipher =
crypto.createCipheriv(

 "aes-256-cbc",

 Buffer.from(key),

 Buffer.from(iv)

);


let encrypted =
cipher.update(

JSON.stringify(data),

"utf8",

"base64"

);


encrypted +=
cipher.final("base64");


return {
request:
encrypted
};


}





export function decryptSBI(data:any){


const encrypted =
data.response || data;


const decipher =
crypto.createDecipheriv(

"aes-256-cbc",

Buffer.from(key),

Buffer.from(iv)

);



let decrypted =
decipher.update(
encrypted,
"base64",
"utf8"
);


decrypted +=
decipher.final("utf8");


return JSON.parse(decrypted);


}