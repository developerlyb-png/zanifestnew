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
const [isLoggedIn,setIsLoggedIn] =
useState(false);
const [userData,setUserData] =
useState<any>(null);
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
const storedPlan =
localStorage.getItem(
"selectedInsurancePlan"
);
if(storedPlan){
setSelectedPlan(
JSON.parse(storedPlan)
);
}
// CHECK LOGIN USER
const user =
localStorage.getItem("user");
if(user){
const parsed =
JSON.parse(user);
setUserData(parsed);
setIsLoggedIn(true);
// AUTO FILL
setFullName(
parsed.name ||
parsed.fullName ||
""
);
setMobile(
parsed.mobile ||
""
);
setEmail(
parsed.email ||
""
);
// SKIP OTP
setMobileVerified(true);
setEmailVerified(true);
}
},[]);
if (!selectedPlan) {
  return <div>Loading...</div>;
}
// ======================
// SEND WHATSAPP OTP
// ======================
const sendWhatsappOtp = async () => {
try{
if(!mobile){
alert("Enter mobile number");
return;
}
setLoading(true);
const response =
await fetch(
"/api/auth/send-whatsapp-otp",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:
JSON.stringify({
mobile
})
}
);
const data =
await response.json();
console.log(
"WHATSAPP OTP RESPONSE",
data
);
setLoading(false);
if(data.success){
setMobileOtpSent(true);
alert(
"OTP sent on WhatsApp"
);
}
else{
alert(
data.message ||
"OTP send failed"
);
}
}
catch(error){
console.log(error);
setLoading(false);
alert(
"Something went wrong"
);
}
};
const verifyWhatsappOtp = async () => {
try{
if(!mobileOtp){
alert("Enter Mobile OTP");
return;
}
setLoading(true);
const response =
await fetch(
"/api/auth/verify-whatsapp-otp",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:
JSON.stringify({
mobile,
otp:mobileOtp,
fullName,
email
})
}
);
const data =
await response.json();
console.log(
"VERIFY RESPONSE",
data
);
setLoading(false);
if(data.success){
setMobileVerified(true);
if(data.user){
localStorage.setItem(
"user",
JSON.stringify(
data.user
)
);
window.dispatchEvent(
new Event(
"userLogin"
)
);
}
alert(
"Mobile Verified"
);
}
else{
alert(
data.message ||
"Wrong OTP"
);
}
}
catch(error){
console.log(error);
setLoading(false);
alert(
"Verification failed"
);
}
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
JSON.stringify({...data.user, loginTime: Date.now()})
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
selectedPlan?.bikeData?.registrationNumber || "",
registrationDate:
selectedPlan?.bikeData?.registrationDate || "",
make:
selectedPlan?.bikeData?.make,
model:
selectedPlan?.bikeData?.model,
variant:
selectedPlan?.bikeData?.variant,
idv:
selectedPlan?.bikeData?.idv,
fuelType:
selectedPlan?.bikeData?.fuelType,
capacity:
selectedPlan?.bikeData?.capacity,
seatingCapacity:
selectedPlan?.bikeData?.seatingCapacity,
exShowroomPrice:
selectedPlan?.bikeData?.exShowroomPrice,
year:
selectedPlan?.bikeData?.year,
manufacturingYear:
selectedPlan?.bikeData?.year,
isNewBike:
selectedPlan?.bikeData?.isNewBike,
previousPolicyStartDate:
selectedPlan?.bikeData?.previousPolicyStartDate,
previousPolicyEndDate:
selectedPlan?.bikeData?.previousPolicyEndDate,
engineNumber:
selectedPlan?.bikeData?.engineNumber || "NA",
chassisNumber:
selectedPlan?.bikeData?.chassisNumber || "NA",
rto:
selectedPlan?.bikeData?.rto || {}
}
};
console.log(
"FULL QUOTE PAYLOAD",
payload
);
// ======================
// STEP 1 : FULL QUOTE
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
// save full quote
localStorage.setItem(
 "fullQuoteData",
 JSON.stringify(
  quoteData.data
 )
);
// update selected plan also
// update selected plan also — keep the ORIGINAL rating data in
// zunoQuote (real-quote needs it); store the full quote separately
const updatedPlan = {
  ...selectedPlan,
  fullQuote: quoteData.data,
  customer: { fullName, mobile, email },
};
localStorage.setItem(
  "selectedInsurancePlan",
  JSON.stringify(updatedPlan)
);
// ======================
// STEP 2 : EXTRACT QUOTE NUMBERS
// ======================
const quoteNo =
  quoteData.data?.policyLevelDetails?.quoteNo;
const quoteOptionNo =
  quoteData.data?.policyLevelDetails?.quoteOptionNo;
console.log("QUOTE NUMBERS >>>", { quoteNo, quoteOptionNo });
if (!quoteNo || !quoteOptionNo) {
  setLoading(false);
  alert("Quote numbers missing — check console");
  return;
}
// ======================
// STEP 3 : KYC REFERENCE (TESTING MODE)
// ======================
// KYC is customer-level, so we reuse the approved KYC request
// number. Set once in the browser console:
//   localStorage.setItem("bikeApprovedKycNo", "zuno-000000180434")
const kycNo =
  localStorage.getItem("bikeApprovedKycNo") ||
  localStorage.getItem("carApprovedKycNo") ||
  "";
console.log("2W KYC NO (stored) >>>", kycNo || "(none)");
if (!kycNo) {
  setLoading(false);
  alert(
    "Set localStorage bikeApprovedKycNo first (zuno-... number)"
  );
  return;
}
// ======================
// STEP 4 : ISSUE POLICY
// ======================
const issueRes = await fetch("/api/sbi/2w/issue-policy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    quoteNo,
    quoteOptionNo,
    kycNo, // sent as VISoF_KYC_Req_No
     policyNumber:
      quoteData.data?.policyLevelDetails?.policyNumber || "",
  }),
});
const issueData = await issueRes.json();
console.log(
  "2W ISSUE RESPONSE >>>",
  JSON.stringify(issueData, null, 2)
);
if (!issueRes.ok || !issueData.success) {
  setLoading(false);
  alert("Issue Policy failed — check console");
  return;
}
// Zuno response shape: issuePolicyObject.issuepolicy.policynrTt
const ip =
  issueData.data?.issuePolicyObject?.issuepolicy || {};
const policyNo = ip.policynrTt || "";
console.log("2W POLICY NO >>>", policyNo);
localStorage.setItem(
  "bikePolicyResult",
  JSON.stringify({
    policyNo,
    quoteNo,
    quoteOptionNo,
    amount: selectedPlan?.premium,
    raw: issueData.data,
  })
);
// ======================
// STEP 5 : PAYMENT
// ======================
const payRes = await fetch(
  "/api/sbi/2w/online-payment",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transactionId: policyNo || quoteNo,
      amount: selectedPlan?.premium,
      returnUrl: `${window.location.origin}/cart/bike-policy-success`,
      customer:{
        fullName,
        mobile,
        email
      }
    })
  }
);
const payData = await payRes.json();
console.log(
  "ZUNO PAYMENT RESPONSE >>>",
  JSON.stringify(payData, null, 2)
);
setLoading(false);
// Payment link — same extraction style as 4W
const pd = payData.data?.data || payData.data || {};
const payLink =
  pd.paymentLink ||
  pd.paymentUrl ||
  pd.payment_url ||
  pd.link ||
  pd.url ||
  pd.shortUrl ||
  "";
if (payData.success && payLink) {
    window.location.href = payLink;
} else {
    console.log("PAYMENT RESPONSE", payData);
    alert("Payment link not found — policy IS issued, check console");
}
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
{/* =========================
    LOGIN USER DETAILS
========================= */}
{
isLoggedIn && (
<div>
<p style={{color:"green"}}>
✓ Logged in
</p>
<p>
Mobile : {mobile}
</p>
<p>
Email : {email}
</p>
</div>
)
}
{/* =========================
    GUEST OTP FLOW
========================= */}
{
!isLoggedIn && (
<>
{/* MOBILE ROW */}
<div className={styles.otpRow}>
<div className={styles.mobileBox}>
<label className={styles.label}>
Mobile number
</label>
<input
 className={styles.otpInput}
 value={mobile}
 onChange={(e)=>
 setMobile(e.target.value)}
/>
</div>
{
!mobileVerified && (
mobileOtpSent
?
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
{/* MOBILE OTP */}
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
 onChange={(e)=>
 setMobileOtp(e.target.value)}
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
 onChange={(e)=>
 setEmail(e.target.value)}
/>
</div>
{
!emailVerified && (
emailOtpSent
?
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
 onChange={(e)=>
 setEmailOtp(e.target.value)}
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
</>
)
}
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