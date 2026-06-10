import React from "react";
import styles from "@/styles/pages/homeinsurance.module.css";

import home from "../assets/pageImages/home.jpg";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import Footer from "@/components/ui/Footer";

export default function HomeInsurance() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      {/* <div className={styles.badge}>🏠 HOME INSURANCE</div> */}
      <div className={styles.homeInsuranceContainer}>
        
        <div className={styles.homeInsuranceLeft}>
          
          <h2>
            Protect your home at just <span>₹18/month*</span>
          </h2>
          <p className={styles.subtext}>
            ✅ Compare and save up to <strong>25%</strong>**
          </p>

          <form className={styles.homeForm}>
            <div className={styles.inputGroup}>
              <input type="text" placeholder="Your full name" />
              <input type="tel" placeholder="Mobile number" />
              <button type="submit">View free quotes ➜</button>
            </div>
            <p className={styles.consentText}>
              By clicking on "View Free Quotes" you agree to our{" "}
              <a href="#">Privacy Policy</a> & <a href="#">Terms of Use</a>
            </p>
            <label className={styles.whatsappCheck}>
              <input type="checkbox" /> Get Updates on WhatsApp
            </label>
          </form>
        </div>

        <div className={styles.homeInsuranceRight}>
          <img src={home.src} alt="Home" className={styles.homeImg} />
          <div className={styles.badges}>
            <span>🏦 Bank approved</span>
            <span>🆓 Free addons</span>
            <span>💸 Discounted plans</span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
