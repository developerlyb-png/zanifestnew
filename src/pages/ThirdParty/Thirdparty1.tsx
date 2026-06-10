"use client";
import React from "react";
import styles from "@/styles/pages/Thirdparty/thirdparty1.module.css";
import { FiClock } from "react-icons/fi";
import { FiShield } from "react-icons/fi";
import { FaCarSide } from "react-icons/fa";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useRouter } from "next/navigation";

const Thirdparty1: React.FC = () => {
  const router = useRouter();

  return (
    <div>
      <Navbar />
      <div className={styles.wrapper}>
        {/* Top small text */}
        <p className={styles.topText}>
          Third Party Insurance starting at only{" "}
          <span className={styles.price}>₹2,094/year</span> #
        </p>

        {/* Heading */}
        <h1 className={styles.heading}>
          Compare & <span className={styles.highlight}>Save upto 91%+</span> on
          Car Insurance
        </h1>

        {/* Features with icons */}
        <div className={styles.features}>
          <div className={styles.featureItem}>
            <FiClock className={styles.icon} /> Renew policy in 2 minutes*
          </div>
          <div className={styles.featureItem}>
            <FiShield className={styles.icon} /> 21+ Insurers to choose
          </div>
          <div className={styles.featureItem}>
            <FaCarSide className={styles.icon} /> 1.2Cr+ Vehicles Insured
          </div>
        </div>

        {/* Input + Button */}
        <div className={styles.form}>
          <input
            type="text"
            className={styles.input}
            placeholder="Enter your car number (e.g DL1AB1234)"
          />
          <button
            className={styles.button}
            onClick={() => router.push("Thirdparty2")}
          >
            View Prices
          </button>
        </div>

        {/* Bottom text */}
        {/* <p className={styles.bottomText}>
          Brand new car? <a href="#">Click here</a>
        </p> */}
      </div>
      <Footer />
    </div>
  );
};

export default Thirdparty1;
