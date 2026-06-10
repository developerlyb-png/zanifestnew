import React from "react";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import styles from "@/styles/pages/carinsurance2.module.css";
import Image from "next/image";
import { FaArrowRight} from "react-icons/fa6";
import { IoIosArrowBack } from "react-icons/io";
import indiaFlag from "@/assets/pageImages/Flag_of_India.png";
import {useRouter} from 'next/router';


function carinsurance2() {
  const router =useRouter();
   React.useEffect(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
}, []);

  return (
    <div>
      <UserDetails />
      <Navbar />
 {/* <button
    className={styles.backBtn}
    onClick={() => router.push("./carinsurance")} // or use router.back() for dynamic back
  >
    <IoIosArrowBack className={styles.arrowBack} />
  </button> */}
      <div className={styles.cont}>
        
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <div className={styles.iconBox}>
             <IoIosArrowBack  className={styles.arrow}/>
           
            </div>
              <p className={styles.titleText}>Almost done! Just one last step</p>
          </div>

          <input type="text" placeholder="Full Name" aria-label="Full Name" className={styles.input} />

          <div className={styles.mobileInputGroup}>
            <div className={styles.flagWrapper}>
              <Image
              className={styles.flagImg}
                src={indiaFlag}
                alt="India Flag"
                width={24}
                height={16}
              />
              <span>+91</span>
            </div>
            <input
              type="text"
              aria-label="Mobile Number"
              placeholder="Mobile number"
              className={styles.mobileInput}
            />
          </div>

          <button className={styles.submitButton} onClick={()=>{router.push('./carinsurance4')}}  aria-label="View Prices">
            View Prices <FaArrowRight />
          </button>

          <p className={styles.terms}>
            By clicking on "View Prices", you agree to our{" "}
            <span className={styles.link}>Privacy Policy</span> &{" "}
            <span className={styles.link}>Terms of Use</span>
          </p>
        </div>

    
        <div className={styles.imageCont}>
          <Image
            src={require("@/assets/pageImages/blackcar.png")}
            alt="Car Image"
            className={styles.image}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default carinsurance2;
