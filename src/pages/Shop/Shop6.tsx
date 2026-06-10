"use client";
import React from "react";
import styles from "@/styles/pages/Shop/shop6.module.css";
import { FiArrowLeft } from "react-icons/fi";
import Image from "next/image";
import logo from "@/assets/CommercialVehicle/shriram.png"; 
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
// import personImg from "@/assets/person.png"; 
import { useRouter } from "next/navigation";
export default function Shop6() {
  const router = useRouter();
  return (
       // ✅ router instance
    
    <>
    <Navbar/>
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <FiArrowLeft className={styles.backIcon} onClick={() => router.push("Shop5")}/>
        <h2 className={styles.title}>Checkout</h2>
      </div>

      {/* Success message */}
      <p className={styles.successMsg}>
        Thank you <span>Mr Asdas Aaa</span> for choosing Zanifest for your
        Shop Owner Insurance requirements.
      </p>

      {/* Alert box */}
      <div className={styles.alertBox}>
        <p>
          <b>As per new IRDAI guidelines,</b> KYC submission is now mandatory
          for policy issuance and policy copy will only be delivered after
          successful KYC submission
        </p>
      </div>

      {/* Reference section */}
      <div className={styles.policyCard}>
        <div className={styles.refNo}>Reference Number: 898265426</div>

        <div className={styles.policyDetails}>
          {/* Left section */}
          <div className={styles.policyInfo}>
            <Image src={logo} alt="Shriram Logo" className={styles.logo} />
            <h3 className={styles.policyName}>Shri Shopkeeper Package</h3>
            <div className={styles.detailsGrid}>
              <div>
                <p className={styles.label}>Limit of liability</p>
                <p className={styles.value}>₹ 5,00,000</p>
              </div>
              <div>
                <p className={styles.label}>Policy start date</p>
                <p className={styles.value}>21-08-2025</p>
              </div>
              <div>
                <p className={styles.label}>Policy end date</p>
                <p className={styles.value}>20-08-2026</p>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className={styles.rightSection}>
            <p className={styles.premium}>
              Premium <br />
              <span>₹ 590/- (Inclusive of all taxes)</span>
            </p>
            <button className={styles.uploadBtn}             onClick={() => router.push("Shop7")}>Upload documents</button>
          </div>
        </div>
      </div>

      {/* Personal details */}
      <div className={styles.personalCard}>
        <h3 className={styles.sectionTitle}>Personal details</h3>
        <div className={styles.personalDetails}>
          <div>
            <p className={styles.label}>Name</p>
            <p className={styles.value}>Mr Asdas Aaa</p>
          </div>
          <div>
            <p className={styles.label}>Phone number</p>
            <p className={styles.value}>+91 89*****465</p>
          </div>
          <div>
            <p className={styles.label}>Email ID</p>
            <p className={styles.value}>ad****@gmail.com</p>
          </div>
        </div>
        {/* <Image src={personImg} alt="Illustration" className={styles.personImg} /> */}
      </div>
    </div>
    <Footer/>
    </>
  );
}
