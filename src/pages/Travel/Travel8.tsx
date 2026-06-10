"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/Travel/travel8.module.css";
import Image from "next/image";
import tataLogo from "@/assets/images.jpeg"; 
const Travel8: React.FC = () => {
  const [activeTab, setActiveTab] = useState("upi");

  return (
    <div className={styles.wrapper}>
      {/* Progress Steps */}
      <div className={styles.progressBar}>
        <div className={`${styles.step} ${styles.active}`}>
          <span>Payment Mode</span>
        </div>
        <div className={styles.line}></div>
        <div className={styles.step}>
          <span>Payment Complete</span>
        </div>
      </div>

      <div className={styles.container}>
        {/* LEFT SIDE - Payment Options */}
        <div className={styles.leftSection}>
          <ul className={styles.tabMenu}>
            <li
              className={activeTab === "upi" ? styles.activeTab : ""}
              onClick={() => setActiveTab("upi")}
            >
              UPI
            </li>
            <li
              className={activeTab === "debit" ? styles.activeTab : ""}
              onClick={() => setActiveTab("debit")}
            >
              Debit Card
            </li>
            <li
              className={activeTab === "netbanking" ? styles.activeTab : ""}
              onClick={() => setActiveTab("netbanking")}
            >
              NetBanking
            </li>
            <li
              className={activeTab === "credit" ? styles.activeTab : ""}
              onClick={() => setActiveTab("credit")}
            >
              Credit Card
            </li>
            <li
              className={activeTab === "wallet" ? styles.activeTab : ""}
              onClick={() => setActiveTab("wallet")}
            >
              Wallet
            </li>
          </ul>
        </div>

        {/* CENTER - Payment Form */}
        <div className={styles.middleSection}>
          {activeTab === "upi" && (
            <div className={styles.upiBox}>
              <h3 className={styles.heading}>Pay using UPI</h3>

              <div className={styles.upiContent}>
                {/* Scan and Pay */}
                <div className={styles.qrBox}>
                  <h4>Scan and Pay</h4>
                  <div className={styles.qrCode}>
                    <button className={styles.viewBtn}>View</button>
                  </div>
                </div>

                <div className={styles.orBox}>OR</div>

                {/* Enter UPI ID */}
                <div className={styles.upiInputBox}>
                  <h4>Enter UPI ID</h4>
                  <input
                    type="text"
                    placeholder="mobilenumber@upi"
                    className={styles.upiInput}
                  />
                  <button className={styles.verifyBtn}>Verify & Pay</button>

                  <ul className={styles.instructions}>
                    <li>Enter your registered VPA</li>
                    <li>Receive payment request on payment app</li>
                    <li>Authorize payment request</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Other payment methods placeholder */}
          {activeTab !== "upi" && (
            <div className={styles.placeholderBox}>
              <p>{activeTab} payment form here</p>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Summary */}
        <div className={styles.rightSection}>
          <div className={styles.summaryCard}>
            <div className={styles.orderRow}>
              <span>Order Number</span>
              <span className={styles.orderNumber}>PB135150925</span>
            </div>

            <div className={styles.planRow}>
              <Image
                src={tataLogo}
                alt="Tata AIG"
                className={styles.planLogo}
              />
              <div>
                <p>Premium</p>
                <h4>₹2,677.00</h4>
              </div>
            </div>

            <div className={styles.totalRow}>
              <span>Total Premium</span>
              <span className={styles.totalAmt}>₹2,677.00</span>
            </div>

            <div className={styles.accordion}>
              <details>
                <summary>Plan Details</summary>
                <p>Plan details content goes here...</p>
              </details>
              <details>
                <summary>Proposer Details</summary>
                <p>Proposer details content goes here...</p>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>
          <a href="#">Privacy Policy</a> | <a href="#">Terms & Conditions</a> |{" "}
          <a href="#">FAQ</a>
        </p>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/PCI_DSS_logo.svg/2560px-PCI_DSS_logo.svg.png"
          alt="PCI DSS Certified"
          className={styles.pciLogo}
        />
      </div>
    </div>
  );
};

export default Travel8;
