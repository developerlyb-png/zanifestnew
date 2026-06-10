"use client";
import React from "react";
import styles from "@/styles/pages/Travel/travel7.module.css";
import { FaArrowLeft, FaEdit } from "react-icons/fa";
import Image from "next/image";
import tataLogo from "@/assets/images.jpeg"; 

const Travel7: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      {/* BACK LINK */}
      <div className={styles.backLink}>
        <FaArrowLeft /> Go back to medical history
      </div>

      <div className={styles.container}>
        {/* LEFT SECTION */}
        <div className={styles.leftSection}>
          <h3 className={styles.stepHeading}>Step 3:</h3>
          <h2 className={styles.mainHeading}>Contact details</h2>
          <p className={styles.infoText}>
            We will send the policy copy on this number
            <span className={styles.phone}> +91 98*****456</span>
            <button className={styles.editBtn}>
              <FaEdit /> Edit
            </button>
          </p>

          <p className={styles.userName}>Asd Asd (30 yrs)</p>

          {/* FORM GRID */}
          <div className={styles.formGrid}>
            <input type="email" placeholder="Enter email" />
            <input type="text" placeholder="Enter pincode" />
            <input type="text" placeholder="Select city" />
            <input type="text" placeholder="Enter address" />
            <div className={styles.phoneInput}>
              <span className={styles.prefix}>+91</span>
              <input type="text" placeholder="Enter alternate number (Optional)" />
            </div>
          </div>

          {/* CHECKBOXES */}
          <div className={styles.checkboxes}>
            <label>
              <input type="checkbox" /> I declare that nominee is of 18 years of age
            </label>
            <label>
              <input type="checkbox" /> I hereby declare that information provided above is true,
              and I accept all <a href="#">Terms & Conditions</a>
            </label>
            <label>
              <input type="checkbox" /> I hereby consent to receive information from Central KYC
              Registry through SMS/email on the provided details.
              <a href="#">...Read More</a>
            </label>
          </div>

          {/* PAY NOW BUTTON */}
          <button className={styles.payNowBtn}>Pay Now</button>
        </div>

        {/* RIGHT SECTION */}
        <div className={styles.rightSection}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>Premium Summary</div>
            <div className={styles.dropdown}>
              <p className={styles.dropdownLabel}>Trip Details</p>
            </div>
            <div className={styles.planBox}>
              <Image src={tataLogo} alt="Plan Logo" width={50} height={50} />
              <div>
                <p className={styles.planName}>
                  International Plus Gold Without Sublimit
                </p>
                <p className={styles.sumInsured}>Sum Insured: $250,000</p>
              </div>
              <p className={styles.premium}>₹2,677/-</p>
            </div>
            <div className={styles.totalBox}>
              <p>TOTAL PREMIUM</p>
              <p className={styles.totalPrice}>₹2,677/-</p>
              <span className={styles.gst}>(GST included)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Travel7;
