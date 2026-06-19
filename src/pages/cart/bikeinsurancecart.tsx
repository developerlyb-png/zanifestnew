// pages/twowheeler-confirm.tsx
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/cart/bikeinsurancecart.module.css";
import Image from "next/image";
import { IoIosArrowBack } from "react-icons/io";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";

export default function bikeinsurancecart() {
  const [selectedYear, setSelectedYear] = useState("1");
const [selectedPlan, setSelectedPlan] = useState<any>(null);
const [fullName, setFullName] =
  useState("");
const [loading, setLoading] =
  useState(false);
const [mobile, setMobile] =
  useState("");
const [otp, setOtp] = useState("");
const [mobileOtp,setMobileOtp] =
useState("");

const [emailOtp,setEmailOtp] =
useState("");


const [mobileOtpSent,setMobileOtpSent] =
useState(false);


const [emailOtpSent,setEmailOtpSent] =
useState(false);


const [mobileVerified,setMobileVerified] =
useState(false);


const [emailVerified,setEmailVerified] =
useState(false);
const [otpSent, setOtpSent] = useState(false);
const [isVerified, setIsVerified] = useState(false);
const [email, setEmail] =
  useState("");
 
useEffect(() => {

  const storedPlan = localStorage.getItem(
    "selectedInsurancePlan"
  );

  if (storedPlan) {
    setSelectedPlan(JSON.parse(storedPlan));
  }

}, []);
if (!selectedPlan) {
  return <div>Loading...</div>;
}
// ======================
// SEND WHATSAPP OTP
// ======================

// const sendWhatsappOtp = async () => {

// try{


// if(!mobile){

//  alert("Enter mobile number");
//  return;

// }


// setLoading(true);


// const response =
// await fetch(
//  "/api/auth/send-whatsapp-otp",
//  {

//  method:"POST",

//  headers:{
//   "Content-Type":"application/json"
//  },

// body:JSON.stringify({

// mobile,



// fullName,

// email

// })

//  }
// );


// const data =
// await response.json();


// console.log(
//  "OTP RESPONSE",
//  data
// );


// setLoading(false);



// if(data.success){

//  setMobileOtpSent(true);

//  alert("OTP sent on WhatsApp");

// }
// else{

//  alert(
//   "OTP sending failed"
//  );

// }


// }
// catch(error){

// console.log(error);

// setLoading(false);

// }


// };

const sendWhatsappOtp = async () => {

 if(!mobile){

  alert("Enter mobile number");
  return;

 }

 setLoading(true);

 setTimeout(()=>{

  setLoading(false);

  setMobileOtpSent(true);

  alert("Dummy OTP sent on WhatsApp : 123456");

 },500);

};


// ======================
// VERIFY OTP + LOGIN
// ======================

// const verifyWhatsappOtp = async () => {

// try{


// if(!mobileOtp){

//  alert("Enter Mobile OTP");
//  return;

// }


// setLoading(true);


// const response =
// await fetch(
//  "/api/auth/verify-whatsapp-otp",
//  {

//  method:"POST",

//  headers:{
//   "Content-Type":"application/json"
//  },

//  body:JSON.stringify({

//  mobile,

//  otp:mobileOtp,

//  fullName,

//  email

// })

//  }

// );



// const data =
// await response.json();



// console.log(
//  "VERIFY RESPONSE",
//  data
// );



// setLoading(false);



// if(data.success){


// setMobileVerified(true);


// if(data.user){

// localStorage.setItem(
// "user",
// JSON.stringify(data.user)
// );


// window.dispatchEvent(
// new Event("userLogin")
// );

// }


// alert("Mobile Verified");


// }

// else{


// alert(
//  "Wrong OTP"
// );


// }


// }
// catch(error){

// console.log(error);

// setLoading(false);

// }


// };
const verifyWhatsappOtp = async () => {

 if(!mobileOtp){

  alert("Enter Mobile OTP");
  return;

 }


 setLoading(true);


 setTimeout(()=>{


  if(mobileOtp === "123456"){


   setMobileVerified(true);


   const dummyUser = {

    fullName,

    mobile,

    email

   };


   localStorage.setItem(
    "user",
    JSON.stringify(dummyUser)
   );


   window.dispatchEvent(
    new Event("userLogin")
   );


   alert("Mobile Verified");


  }
  else{

   alert("Wrong OTP");

  }


  setLoading(false);


 },500);


};
// ======================
// SEND EMAIL OTP
// ======================

const sendEmailOtp = async()=>{

try{

if(!email){

alert("Enter email");
return;

}

setLoading(true);


const res =
await fetch("/api/auth/send-email-otp",{
 method:"POST",
 headers:{
  "Content-Type":"application/json"
 },
body:JSON.stringify({

 mobile,

 email,

 otp:emailOtp,

 fullName

})
})


const data =
await res.json();


setLoading(false);


if(data.success){

setEmailOtpSent(true);

alert("Email OTP Sent");

}
else{

alert("Email OTP Failed");

}


}
catch(err){

console.log(err);
setLoading(false);

}

};



// ======================
// VERIFY EMAIL OTP
// ======================


const verifyEmailOtp = async()=>{

try{


if(!emailOtp){

alert("Enter Email OTP");
return;

}


setLoading(true);


const res =
await fetch(
"/api/auth/verify-email-otp",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

mobile,

email,

otp:emailOtp,

fullName

})

}
);


const data =
await res.json();


setLoading(false);



if(data.success){


setEmailVerified(true);


// LOGIN SAVE
if(data.user){

localStorage.setItem(
"user",
JSON.stringify(data.user)
);


window.dispatchEvent(
new Event("userLogin")
);

}


alert("Email Verified");


}
else{

alert("Wrong Email OTP");

}


}
catch(err){

console.log(err);

setLoading(false);

}


};

const handleProposal = async () => {

try{


if(
!mobileVerified ||
!emailVerified
){

alert(
"Please verify mobile and email"
);

return;

}



setLoading(true);


// ======================
// FULL QUOTE PAYLOAD
// ======================

const payload = {


 quote:
 selectedPlan?.zunoQuote,


 customer:{


  fullName,

  mobile,

  email

 },

vehicle:{


registrationNumber:
selectedPlan?.bikeData?.registrationNumber,


make:
selectedPlan?.bikeData?.make,


model:
selectedPlan?.bikeData?.model,


variant:
selectedPlan?.bikeData?.variant,


idv:
selectedPlan?.bikeData?.idv,


capacity:
selectedPlan?.bikeData?.capacity,


seatingCapacity:
selectedPlan?.bikeData?.seatingCapacity,


fuelType:
selectedPlan?.bikeData?.fuelType,


year:
selectedPlan?.bikeData?.year,


isNewBike:
selectedPlan?.bikeData?.isNewBike,


engineNumber:
selectedPlan?.bikeData?.engineNumber,


chassisNumber:
selectedPlan?.bikeData?.chassisNumber,

rto:
selectedPlan?.bikeData?.rto
}

};

console.log(
"FULL QUOTE PAYLOAD",
payload
);

// console.log(
//  "FULL QUOTE PAYLOAD",
//  payload
// );



// ======================
// FULL QUOTE API
// ======================


// ======================
// STEP 1 : ZUNO KYC
// ======================


// const kycResponse =
// await fetch(
//  "/api/sbi/2w/zuno-kyc",
//  {

//  method:"POST",

//  headers:{

//   "Content-Type":
//   "application/json"

//  },

//  body:
//  JSON.stringify(payload)

//  }
// );



// const kycData =
// await kycResponse.json();



// console.log(
//  "KYC RESPONSE",
//  kycData
// );



// if(!kycData.success){


//  alert(
//   "KYC Failed"
//  );


//  setLoading(false);


//  return;

// }





// ======================
// STEP 2 : FULL QUOTE
// ======================


const quoteResponse =
await fetch(
 "/api/sbi/2w/real-quote",
 {

 method:"POST",

 headers:{

  "Content-Type":
  "application/json"

 },


 body:
 JSON.stringify(payload)


 }

);


const quoteData =
await quoteResponse.json();



console.log(
 "FULL QUOTE RESPONSE",
 quoteData
);




if(!quoteData.success){


 alert(
  "Full Quote Failed"
 );


 setLoading(false);


 return;

}




localStorage.setItem(

 "fullQuoteData",

 JSON.stringify(
  quoteData.data
 )

);



alert(
 "Full Quote Generated Successfully"
);



setLoading(false);



}

catch(error){


console.log(error);


setLoading(false);


alert(
 "Something went wrong"
);


}


};
  return (
     <div>
                      <UserDetails />
                      <Navbar />
    
       <div className={styles.wrapper}>
      <div className={styles.back}>
        <IoIosArrowBack size={18} />
        <span>Back to plans page</span>
      </div>

      <div className={styles.card}>
        {/* Left Form */}
        <div className={styles.left}>
          <h2>
            Hi <span className={styles.green}>
  {fullName || "Customer"}!
</span> Great Choice
          </h2>
          <p className={styles.info}>
            👏 85% of the vehicles stolen in India are two wheelers, let's protect yours!
          </p>

          {/* Title + Full Name */}
          <div className={styles.userRow}>
            <div className={styles.titleBox}>
              <label className={styles.label}>Title</label>
              <select className={styles.select}>
                <option>Mr.</option>
                <option>Ms.</option>
              </select>
            </div>
            <div className={styles.nameBox}>
              <label className={styles.label}>Full name</label>
              <div className={styles.nameInputWrapper}>
                <input
  type="text"
  value={fullName}
  onChange={(e) =>
    setFullName(e.target.value)
  }
  className={styles.input}
/>
                <button className={styles.editBtn}>Edit</button>
              </div>
            </div>
          </div>

     {/* MOBILE ROW */}
<div className={styles.otpRow}>

<div className={styles.mobileBox}>
<label className={styles.label}>
Mobile number
</label>

<input
 className={styles.otpInput}
 value={mobile}
 onChange={(e)=>setMobile(e.target.value)}
/>

</div>


{
!mobileVerified && (

mobileOtpSent ?
null

:

<button
 className={styles.otpBtn}
 onClick={sendWhatsappOtp}
>
Send OTP
</button>

)

}

</div>


{/* MOBILE OTP INPUT */}
{
mobileOtpSent &&
!mobileVerified &&

<div className={styles.otpRow}>

<div className={styles.mobileBox}>

<label className={styles.label}>
OTP
</label>

<input
 className={styles.otpInput}
 placeholder="Enter Mobile OTP"
 value={mobileOtp}
 onChange={(e)=>setMobileOtp(e.target.value)}
/>

</div>


<button
 className={styles.otpBtn}
 onClick={verifyWhatsappOtp}
>
Verify OTP
</button>


</div>

}


{
mobileVerified &&

<p style={{color:"green"}}>
✓ Mobile Verified
</p>

}


{/* EMAIL AFTER MOBILE VERIFY */}
{
mobileVerified &&

<>

<div className={styles.otpRow}>

<div className={styles.mobileBox}>

<label className={styles.label}>
Email address
</label>

<input
 className={styles.otpInput}
 value={email}
 onChange={(e)=>setEmail(e.target.value)}
/>

</div>

{
!emailVerified && (

emailOtpSent ?
null

:

<button
 className={styles.otpBtn}
 onClick={sendEmailOtp}
>
Send OTP
</button>

)

}

</div>


{
emailOtpSent &&
!emailVerified &&

<div className={styles.otpRow}>

<div className={styles.mobileBox}>

<label className={styles.label}>
Email OTP
</label>

<input
 className={styles.otpInput}
 placeholder="Enter Email OTP"
 value={emailOtp}
 onChange={(e)=>setEmailOtp(e.target.value)}
/>

</div>


<button
 className={styles.otpBtn}
 onClick={verifyEmailOtp}
>
Verify OTP
</button>


</div>

}


{
emailVerified &&

<p style={{color:"green"}}>
✓ Email Verified
</p>

}

</>



}
{


}




          {/* Multi-Year Box */}
          {/* <div className={styles.multiYearBox}>
            <h4 className={styles.multiTitle}>Save More with a Multi-Year Plan</h4>
            <p className={styles.multiDesc}>
              Enjoy exclusive discounts and don’t worry about annual renewals
            </p>
            <div className={styles.radioWrap}>
              {[
                { value: "1", label: "1 year @ ₹728" },
                { value: "2", label: "2 year @ ₹1,509" },
                { value: "3", label: "3 year @ ₹2,258" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`${styles.radioBtn} ${
                    selectedYear === option.value ? styles.active : ""
                  }`}
                >
                  <input
                    type="radio"
                    checked={selectedYear === option.value}
                    onChange={() => setSelectedYear(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div> */}
        </div>

        {/* Right Plan Summary */}
        <div className={styles.right}>
          <div className={styles.planHeader}>
            <div>
              <h4>
  {selectedPlan?.bikeData?.make}
  {" "}
  {selectedPlan?.bikeData?.model}
</h4>

<p>
  {selectedPlan?.bikeData?.registrationNumber}
  {" | Registered in "}
  {selectedPlan?.bikeData?.year}
</p>
            </div>
            <span className={styles.bikeIcon}>🛵</span>
          </div>

          <div className={styles.insurerBlock}>
   <Image
  src={
    selectedPlan?.companyLogo ||
    selectedPlan?.logo ||
    "/assets/default-insurance.png"
  }
  alt={selectedPlan?.company}
  width={120}
  height={40}
/>
            <p>
  {selectedPlan?.company}
  {" "}
{selectedPlan?.policyType || "Comprehensive"}
</p>
            <span className={styles.idv}>
  IDV: {selectedPlan?.idv}
</span>
          </div>

          <div className={styles.alertBox}>
            <div className={styles.alertTop}>
              <strong>
                Compulsory personal accident cover of ₹15 Lakh for 1 year @₹331
              </strong>
              <span className={styles.lawTag}>Mandatory by law</span>
            </div>
            <p className={styles.alertNote}>
              Not having this may lead to <strong>rejection of claim</strong>
            </p>
            <input type="checkbox" />
          </div>

          <div className={styles.pricing}>
            <div>
              <span>Plan premium</span>
              <span>{selectedPlan?.premium}</span>
            </div>
            <div>
              <span>GST</span>

<span>
 {selectedPlan?.gst}
</span>
            </div>
            <div className={styles.total}>
              <strong>Final premium</strong>
            <strong className={styles.totalAmt}>
  {selectedPlan?.premium}
</strong>
            </div>
       <button
 className={styles.payBtn}
 onClick={handleProposal}
 disabled={
loading ||
!mobileVerified ||
!emailVerified
}
>{
  loading
  ? "Processing..."
  : "🔒 Pay securely"
}</button>
            <p className={styles.terms}>
              By clicking on ‘Pay securely’, I agree to the{" "}
              <a href="#">terms & conditions</a>
            </p>
          </div>
        </div>
      </div>
    </div>
        <Footer />
            </div>
  );
}
