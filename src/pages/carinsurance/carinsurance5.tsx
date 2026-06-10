import React from "react";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import styles from "@/styles/pages/carinsurance5.module.css";
import carImage from "@/assets/pageImages/blackcar.png";
import UserDetails from "@/components/ui/UserDetails";
import {useRouter} from 'next/router';
import { IoIosArrowBack } from "react-icons/io";

const CarInsurance5 = () => {
    const router =useRouter();

  return (
    <div>
             <UserDetails />
      <Navbar />
 {/* <button
    className={styles.backBtn}
    onClick={() => router.push("./carinsurance4")} // or use router.back() for dynamic back
  >
    <IoIosArrowBack className={styles.arrowBack} />
  </button> */}
      <div className={styles.pageContainer}>
        <div className={styles.leftSection}>
          <div className={styles.outerBox}>
            <div className={styles.innerBox}>
              <div className={styles.claimDetails}>
              <h2 className={styles.sectionTitle}>Claim detail</h2>
              </div>
              <p className={styles.question}>
                Did you make a claim in your existing policy?
              </p>

              <div className={styles.options}>
                <button className={styles.optionButton} onClick={()=>{router.push('./carinsurance3')}} >Yes</button>
                <button className={styles.optionButton} onClick={()=>{router.push('./carinsurance3')}}>No</button>
                <button className={styles.optionButton} onClick={()=>{router.push('./carinsurance3')}}>Not sure</button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.imageCircle}>
            <Image src={carImage} alt="Car" className={styles.carImage} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CarInsurance5;
