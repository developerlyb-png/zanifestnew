import React from "react";
import styles from "@/styles/pages/grouphealthinsurance.module.css";

import groupImage from "../assets/pageImages/group-avatars.png";
import sbi from "../assets/pageImages/sbi.png";
import care from "../assets/pageImages/care.png";
import manipal from "../assets/pageImages/manipal.png";
import icici from "../assets/pageImages/Icici.png";
import niva from "../assets/pageImages/niva.jpeg";
import reliance from "../assets/pageImages/reliance.png";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import Footer from "@/components/ui/Footer";

export default function GroupHealthInsurance() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <div className={styles.groupHealthContainer}>
        <div className={styles.leftBlock}>
          <h4>Group Health Insurance</h4>
          <h2>
            Compare and Save{" "}
            <span className={styles.highlightBlue}>upto 65%</span>
          </h2>

          <div className={styles.partnerBox}>
            <p>20+ insurance partners</p>
            <div className={styles.logos}>
              <img src={sbi.src} alt="SBI" />
              <img src={icici.src} alt="ICICI" />
              <img src={care.src} alt="Care" />
              <img src={niva.src} alt="Niva" />
              <img src={manipal.src} alt="Manipal Cigna" />
              <img src={reliance.src} alt="Reliance" />
            </div>
          </div>

          <img
            src={groupImage.src}
            alt="Group Avatars"
            className={styles.avatarImg}
          />
        </div>

        <div className={styles.rightForm}>
          <h3>
            Get ₹1 Lakh cover starting at <br />
            just{" "}
            <span className={styles.highlightBlue}>₹110/month/employee*</span>
          </h3>

          <p className={styles.stepLabel}>Step 1/2</p>

          <div className={styles.benefits}>
            <span>🕒 Zero waiting period</span>
            <span>📄 Paperless claims</span>
          </div>

          <input
            type="text"
            placeholder="Mobile number"
            className={styles.mobileInput}
          />
          <p className={styles.otpNote}>No OTP required</p>

          <button className={styles.viewBtn}>View Plans Instantly</button>

          <div className={styles.expertHelp}>
            <span>🎓 Only IRDAI certified expert will assist you</span>
          </div>

          <label className={styles.whatsappOptin}>
            <input type="checkbox" defaultChecked />
            Get Quotes on WhatsApp
          </label>

          <p className={styles.formNote}>
            By clicking on “View Plans Instantly”, you agree to our{" "}
            <a href="#">Privacy Policy</a>, <a href="#">Terms of Use</a> &{" "}
            <a href="#">*Disclaimer</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
