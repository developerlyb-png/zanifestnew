import React from "react";
import styles from "@/styles/pages/grouppersonalaccident.module.css";

import illustration from "../assets/pageImages/accident.png";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import Footer from "@/components/ui/Footer";

export default function GroupAccidentInsurance() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <div className={styles.accidentInsuranceContainer}>
        <div className={styles.contentLeft}>
          <h2>Group Personal Accident Insurance</h2>
          <p>
            An insurance plan offered to employees by their employer to secure
            them financially from medical expenses incurred due to an accident
            leading to bodily injury or death.
          </p>
          <img
            src={illustration.src}
            alt="Accident Illustration"
            className={styles.insuranceImg}
          />

          <div className={styles.insuranceStats}>
            <div>
              <strong>21700+</strong>
              <p>Cashless Healthcare Providers</p>
            </div>
            <div>
              <strong>58 Lakh+</strong>
              <p>Insurance Claims Settled</p>
            </div>
            <div>
              <strong>24*7</strong>
              <p>Claim and Customer Support</p>
            </div>
          </div>
        </div>

        <div className={styles.formRight}>
          <h3>Insure Your Employees From Care Health Insurance Now!</h3>
          <p className={styles.getQuoteLabel}>Get a Free Quote</p>

          <div className={`${styles.formGroup} ${styles.dualInput}`}>
            <input type="text" placeholder="Enter Mobile Number" />
            <input type="text" placeholder="Enter Your Pincode" />
          </div>

          <div className={styles.formGroup}>
            <input type="email" placeholder="Enter Email Id" />
          </div>

          <div className={`${styles.formGroup} ${styles.selectedOption}`}>
            <span>📄 Group Personal Accident Insurance</span>
          </div>

          <button className={styles.submitBtn}>GET QUOTE</button>

          <p className={styles.termsNote}>
            By clicking, you agree to our <a href="#">Terms and Conditions</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
