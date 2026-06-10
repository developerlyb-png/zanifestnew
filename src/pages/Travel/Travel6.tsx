"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/Travel/travel6.module.css";
import { FaArrowLeft } from "react-icons/fa";
import Image from "next/image";
import tataLogo from "@/assets/images.jpeg"; 

export default function Travel6() {
  const [selected, setSelected] = useState("No");

  return (
    <div className={styles.wrapper}>
      {/* Left Section */}
      <div className={styles.leftSection}>
        {/* Back */}
        <div className={styles.back}>
          <FaArrowLeft className={styles.backIcon} />
          <span>Go back to personal details</span>
        </div>

        {/* Step Heading */}
        <h3 className={styles.stepTitle}>Step 2:</h3>
        <h2 className={styles.mainTitle}>Medical history</h2>
        <p className={styles.description}>
          Does any of the traveller(s) have pre-existing medical conditions? <br />
          <span>
            Select YES if any of the traveller(s) have health issues for which they
            need to take regular medication as part of the long-term treatment.
          </span>
        </p>

        {/* Options */}
        <div className={styles.options}>
          <div
            className={`${styles.option} ${
              selected === "Yes" ? styles.selected : ""
            }`}
            onClick={() => setSelected("Yes")}
          >
            Yes
          </div>
          <div
            className={`${styles.option} ${
              selected === "No" ? styles.selected : ""
            }`}
            onClick={() => setSelected("No")}
          >
            No
          </div>
        </div>

        {/* Continue Button */}
        <button className={styles.continueBtn}>Continue</button>
      </div>

      {/* Right Section */}
      <div className={styles.rightSection}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Premium Summary</h3>
          <div className={styles.tripDetails}>
            <div className={styles.tripHeader}>
              <span>Trip Details</span>
              <span className={styles.arrow}>⌄</span>
            </div>
            <div className={styles.plan}>
              <p>
                Plan for: <b>Asd Asd (30 yrs)</b>
              </p>
              <div className={styles.planDetails}>
                <Image
                  src={tataLogo}
                  alt="Plan Logo"
                  className={styles.planLogo}
                />
                <div>
                  <p className={styles.planName}>
                    International Plus Gold Without Sublimit
                  </p>
                  <p className={styles.sumInsured}>Sum Insured: $250,000</p>
                </div>
              </div>
            </div>
            <div className={styles.priceRow}>
              <span>Premium</span>
              <span>₹2,677/-</span>
            </div>
          </div>
          <div className={styles.totalRow}>
            <span>TOTAL PREMIUM</span>
            <span>₹2,677/-</span>
          </div>
          <p className={styles.gstText}>(GST included)</p>
        </div>
      </div>
    </div>
  );
}
