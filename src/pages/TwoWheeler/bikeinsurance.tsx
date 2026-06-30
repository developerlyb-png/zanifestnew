import React, { useEffect } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/pages/bikeinsurance.module.css";
import UserDetails from "@/components/ui/UserDetails";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Image from "next/image";
import AOS from "aos";
import "aos/dist/aos.css";

import {
  MdOutlineKeyboardDoubleArrowRight,
  MdKeyboardArrowRight,
} from "react-icons/md";

import { FaArrowRight } from "react-icons/fa6";

function bikeinsurance() {
  const router = useRouter();
  const [carNumber, setCarNumber] = React.useState("");

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

    // AOS animation
    useEffect(() => {
      AOS.init({ duration: 1000, once: true });
    }, []);
  return (
    <div>
      <UserDetails />
      <Navbar />
      <div className={styles.cont}>
        <div className={styles.imageCont}>
          <Image
            src={require("@/assets/pageImages/scooter.png")}
            alt="car Image"
            className={styles.image}
          />
        </div>
<div data-aos="fade-right">
          <h1 className={styles.headings}>TWO - WHEELER INSURANCE</h1>
          <div className={styles.bottom}>
            <p className={styles.heading}>
              Bike Insurance in<b className={styles.bold}> 60 seconds</b>
            </p>

            <div className={styles.path}>
              <section>
                <p>Bike No.</p>
              </section>
              <section>
                <MdOutlineKeyboardDoubleArrowRight />
              </section>
              <section>
                <p>Select Plan</p>
              </section>
              <section>
                <MdOutlineKeyboardDoubleArrowRight />
              </section>
              <section>
                <p>Policy Issued</p>
              </section>
            </div>
            <div className={styles.form}>
              <input
                type="text"
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
                placeholder="Your bike number ex - DL-10-CB-1234"
                className={styles.input}
              />
             <button
className={styles.button}
onClick={async()=>{

try{

 if(!carNumber){
 alert("Enter bike number");
 return;
 }


 const res = await fetch("/api/vahan/rc-check",{

 method:"POST",

 headers:{
   "Content-Type":"application/json"
 },

 body:JSON.stringify({

   registrationNumber:carNumber

 })

});


 const data = await res.json();


 console.log("BIKE RC",data);



 if(!data.success){

 alert(data.message || "RC not found");

 return;

 }


 localStorage.setItem(
 "vehicleNumber",
 carNumber
 );


 localStorage.setItem(
 "bikeRcDetails",
 JSON.stringify(data.vehicle)
 );


 router.push("./twowheeler");


}catch(err){

console.log(err);

alert("Something went wrong")

}

}}
>
Check Prices
</button>
            </div>
            <p>
              By clicking, I agree to{" "}
              <b className={styles.policy}>terms & conditions</b> and{" "}
              <b className={styles.policy}>privacy policy</b>
            </p>

            <button className={styles.transparentButton}>
              Brand new Bike <MdKeyboardArrowRight />
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default bikeinsurance;
