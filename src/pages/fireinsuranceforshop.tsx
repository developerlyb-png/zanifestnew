import React from "react";
import styles from "@/styles/pages/fireinsurance.module.css";

import fireImage from "../assets/pageImages/fire1.png";
import icici from "../assets/pageImages/Icici.png";
import bajaj from "../assets/pageImages/bajaj.png";
import hdfc from "../assets/pageImages/hdfc.png";
import reliance from "../assets/pageImages/reliance.png";
import UserDetails from "@/components/ui/UserDetails";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function FireInsurance() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <div className={styles.fireContainer}>
        {/* Left Section */}
        <div className={styles.leftContent}>
          <h2>Fire Insurance for Shop</h2>
          <p>
            Fire insurance for shop provides coverage for the loss or damage
            caused to the shop as well as the goods kept inside the shop. This
            insurance policy not only provides coverage for the damages caused
            due to fire accident but also specified natural calamities,
            landslides, etc. <a href="#">read more</a>
          </p>

          <div className={styles.featuresWithImage}>
            <div className={styles.features}>
              <div className={styles.featureItem}>
                🔥 Get right expert advice
              </div>
              <div className={styles.featureItem}>📄 Hassle-free policy</div>
              <div className={styles.featureItem}>⚡ Speedy Claims</div>
            </div>
            <img
              src={fireImage.src}
              alt="Fireman"
              className={styles.fireImageSide}
            />
          </div>

          <div className={styles.insurerBar}>
            <span>
              Fast-track your search with instant quotes from prominent insurers
            </span>
            <div className={styles.insurers}>
              <img src={icici.src} alt="ICICI" />
              <img src={bajaj.src} alt="Bajaj" />
              <img src={hdfc.src} alt="HDFC" />
              <img src={reliance.src} alt="Reliance" />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.rightForm}>
          <h3>
            Get <span className={styles.boldBlue}>₹50 Lakh</span> cover <br />
            starting at <span className={styles.boldBlue}>₹283/month*</span>
          </h3>

          <input
            type="text"
            placeholder="Mobile number"
            className={styles.mobileInput}
          />

          <label className={styles.whatsappOptin}>
            <input type="checkbox" defaultChecked />
            Get Updates on WhatsApp
          </label>

          <button className={styles.checkBtn}>Check Your Premium Now</button>

          <p className={styles.formNote}>
            By clicking on “Check Your Premium Now” you agree to our{" "}
            <a href="#">Privacy Policy</a> and <a href="#">Terms Of Use</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
