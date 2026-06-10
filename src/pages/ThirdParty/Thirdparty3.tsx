"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/Thirdparty/thirdparty3.module.css";
import { FiArrowLeft } from "react-icons/fi";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Image from "next/image";
import zurich from "@/assets/pageImages/zurich kotak.png";
import { FaWhatsapp } from "react-icons/fa";
import { FaRupeeSign } from "react-icons/fa";
import { useRouter } from "next/navigation";

const Thirdparty3 = () => {
  const [owner, setOwner] = useState("individual");
  const router = useRouter();

  return (
    <div>
      <Navbar />
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.backBox}>
            <FiArrowLeft className={styles.backIcon} />
            <span
              className={styles.backText}
              onClick={() => router.push("Thirdparty2")}
            >
              Back
            </span>
          </div>
          <h2 className={styles.title}>Summary</h2>
        </div>

        <div className={styles.container}>
          {/* Left Section */}
          <div className={styles.left}>
            {/* Insurance Card */}
            <div className={styles.insuranceCard}>
              <div className={styles.insuranceTop}>
                <Image
                  className={styles.insuranceLogo}
                  src={zurich}
                  alt="Zurich Kotak"
                />
                <div>
                  <p className={styles.head}>Zurich Kotak Insurance</p>
                  <p className={styles.policyName}>Third Party policy</p>
                </div>
              </div>
              <p className={styles.note}>
                Third party price is same for all insurers. Pay now and{" "}
                <span className={styles.highlight}>get policy instantly!</span>
              </p>
            </div>

            {/* Confirm & Pay */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Confirm & Pay</h3>
              <p className={styles.subText}>Car is owned by</p>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="owner"
                    checked={owner === "company"}
                    onChange={() => setOwner("company")}
                  />
                  <span>A Company</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="owner"
                    checked={owner === "individual"}
                    onChange={() => setOwner("individual")}
                  />
                  <span>An Individual</span>
                </label>
              </div>
            </div>

            {/* Car Details */}
            <div className={styles.dropdown}>
              <h3 className={styles.sectionshead}>Car Details</h3>
              <span className={styles.arrow}>⌄</span>
            </div>
          </div>

          {/* Right Section */}
          <div className={styles.right}>
            <div className={styles.planSummary}>
              <h3 className={styles.sectionhead}>Plan Summary</h3>

              <div className={styles.summaryRow}>
                <span>Premium Amount</span>
                <span className={styles.amount}>₹3,416</span>
              </div>

              <div className={styles.summaryRow}>
                <span>GST @18%</span>
                <span className={styles.amount}>+ ₹615</span>
              </div>

              <div className={styles.addonBox}>
                <label className={styles.addonLeft}>
                  <input type="checkbox" defaultChecked />
                  <span>
                    <b>Mandatory</b> Personal Accident cover (₹15 lakhs) by
                    Digit <a href="#">know more</a>
                  </span>
                </label>
                <span className={styles.price}>+ ₹378</span>
              </div>

              <div className={styles.totalPay}>
                <div className={styles.payText}>
                  <FaRupeeSign className={styles.dot} />
                  <p>You'll Pay</p>
                </div>
                <h2>₹4,031</h2>
              </div>

              <button
                className={styles.payBtn}
                onClick={() => router.push("Thirdparty4")}
              >
                PAY SECURELY →
              </button>

              <label className={styles.whatsapp}>
                <input type="checkbox" /> Get updates on Whatsapp{" "}
                <FaWhatsapp className={styles.whatsappIcon} />
              </label>

              <p className={styles.terms}>
                <input type="checkbox" /> I agree to the{" "}
                <a href="#">terms & conditions</a> and confirm: my car is not a
                commercial vehicle and my car has a valid PUC certificate.
              </p>
            </div>

            {/* Next Step */}
            <div className={styles.nextStep}>
              <h4>Next step</h4>
              <p>
                After payment, we’ll ask you to fill a few details and complete
                your KYC to <b>deliver your policy instantly</b> to your inbox.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Thirdparty3;
