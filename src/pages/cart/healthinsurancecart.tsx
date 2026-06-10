'use client';
import React, { useState } from "react";
import styles from "@/styles/pages/cart/healthinsurancecart.module.css";
import Image from "next/image";
import careLogo from "@/assets/liclogo.png";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";

const HealthInsuranceCart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("1");

  return (
    <div>
      <UserDetails />
      <Navbar />
      <div className={styles.wrapper}>
        <div className={styles.container}>
          {/* Left Section */}
          <div className={styles.left}>
            <div className={styles.planCard}>
              <div className={styles.planHeader}>
                <Image src={careLogo} alt="Care Logo" className={styles.logo} />
                <div className={styles.planTitle}>
                  <h3>Care Supreme Direct</h3>
                  <p>
                    <span className={styles.link}>View all features</span> •{" "}
                    <span className={styles.green}>202 Cashless hospitals</span>{" "}
                    (+Cashless anywhere support)
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.planCard}>
              <div className={styles.section}>
                <h4>Cover Amount</h4>
                <p>
                  Is this cover amount sufficient?{" "}
                  <span className={styles.green}>Let’s find out ›</span>
                </p>
                <select className={styles.selectInput}>
                  <option>₹10 Lakh</option>
                </select>
              </div>
            </div>

            <div className={styles.planCard}>
              <div className={styles.section}>
                <h4>Policy Period</h4>
                <p>
                  Choosing a multi-year plan saves your money and the trouble of
                  remembering yearly renewals.
                </p>
                <div className={styles.periodOptions}>
                  <div
                    className={`${styles.option} ${
                      selectedPeriod === "1" ? styles.selected : ""
                    }`}
                    onClick={() => setSelectedPeriod("1")}
                  >
                    <input
                      type="radio"
                      checked={selectedPeriod === "1"}
                      readOnly
                    />
                    <span>1 Year @ ₹12,151</span>
                  </div>
                  <div
                    className={`${styles.option} ${
                      selectedPeriod === "2" ? styles.selected : ""
                    }`}
                    onClick={() => setSelectedPeriod("2")}
                  >
                    <input
                      type="radio"
                      checked={selectedPeriod === "2"}
                      readOnly
                    />
                    <span>
                      2 Years @ ₹23,389 <em>Save ₹ 872</em>
                    </span>
                  </div>
                  <div
                    className={`${styles.option} ${
                      selectedPeriod === "3" ? styles.selected : ""
                    }`}
                    onClick={() => setSelectedPeriod("3")}
                  >
                    <input
                      type="radio"
                      checked={selectedPeriod === "3"}
                      readOnly
                    />
                    <span>
                      3 Years @ ₹34,324 <em>Save ₹ 2,035</em>
                    </span>
                  </div>
                </div>

                <p className={styles.subText}>
                  Premiums are inclusive of inbuilt riders worth ₹522.{" "}
                  <span className={styles.link}>View list ›</span>
                </p>
                <p className={styles.subText}>
                  Easy EMI options starting from{" "}
                  <span className={styles.bold}>₹1,087/month</span>.{" "}
                  <span className={styles.link}>View details ›</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className={styles.right}>
            <div className={styles.summaryCard}>
              <h4>Summary</h4>
              <hr />
              <div className={styles.summaryRow}>
                <span>Premium - {selectedPeriod} year</span>
                <strong>
                  {selectedPeriod === "1"
                    ? "₹12,151"
                    : selectedPeriod === "2"
                    ? "₹23,389"
                    : "₹34,324"}
                </strong>
              </div>

              <div><strong>Select Rider(s)</strong></div>
              <div className={styles.summaryItem}>
                <p className={styles.warning}>Missing out on benefits</p>
                <span className={styles.link}>View riders</span>
              </div>

              <div><strong>Select Add-ons</strong></div>
              <div className={styles.summaryItem}>
                <p className={styles.warning}>No add-ons selected</p>
                <span className={styles.link}>View add-ons</span>
              </div>

              <p className={styles.error}>
                ⚠️ Port option is only available from <strong>₹15 Lakh </strong> or above cover
                amount <span className={styles.link}>Change cover amount ›</span>
              </p>

              <div className={styles.totalRow}>
                <span>Total premium</span>
                <strong>
                  {selectedPeriod === "1"
                    ? "₹12,151"
                    : selectedPeriod === "2"
                    ? "₹23,389"
                    : "₹34,324"}
                </strong>
              </div>

              <div className={styles.benefitBox}>
                Get up to <strong>₹5,645</strong> in benefits.{" "}
                <span className={styles.link}>See how ›</span>
              </div>

              <button className={styles.proceedBtn}>Proceed to proposal</button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HealthInsuranceCart;
