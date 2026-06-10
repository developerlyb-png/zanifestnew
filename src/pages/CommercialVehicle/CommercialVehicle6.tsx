import React from "react";
import styles from "@/styles/pages/CommercialVehicle/commercialVehicle6.module.css";
import icic from "@/assets/CommercialVehicle/ICICIlombard.png";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const CommercialVehicle6: React.FC = () => {
  return (
    <>
      <Navbar />

      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.mainContent}>
            
            {/* Left Section */}
            <div className={styles.leftSection}>
              {/* Info Bar ab left section ke top me */}
              <div className={styles.infoBar}>
                <div>
                  Third party <span className={styles.bold}>price is same</span> for all
                  insurers. Pay now and{" "}
                  <span className={styles.bold}>get policy instantly!</span>
                </div>
                <span className={styles.infoIcon}>i</span>
              </div>

              <div className={styles.headerRow}>
                <h3 className={styles.title}>Confirm your details</h3>
                <a href="#" className={styles.backLink}>
                  Back to Quotes
                </a>
              </div>

              <div className={styles.radioBox}>
                <p className={styles.label}>
                  Vehicle Is Owned By <span className={styles.required}>*</span>
                </p>
                <label className={styles.radioLabel}>
                  <input type="radio" name="owner" defaultChecked /> An Individual
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" name="owner" /> A Company
                </label>
              </div>
            </div>

            {/* Right Section */}
            <div className={styles.rightSection}>
              <h4 className={styles.planSummaryTitle}>Your Plan Summary</h4>

              <div className={styles.planSummary}>
                <div className={styles.planHeader}>
                  <Image
                    src={icic}
                    alt="ICICI Lombard"
                    className={styles.logo}
                    width={110}
                    height={60}
                  />
                  <span className={styles.planType}>Plan Type</span>
                  <span className={styles.planName}>Third Party cover</span>
                </div>

                <div className={styles.priceDetails}>
                  <div className={styles.priceRow}>
                    <span>Premium Amount</span>
                    <span>₹ 4,487</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span>GST@18%</span>
                    <span>+ ₹ 808</span>
                  </div>
                </div>

                <div className={styles.totalPay}>
                  <span>You'll Pay</span>
                  <span className={styles.totalAmount}>₹ 5,295</span>
                </div>

                <button className={styles.payBtn}>PAY SECURELY</button>

                <div className={styles.terms}>
                  <input type="checkbox" defaultChecked /> I agree to the{" "}
                  <a href="#">Terms & Conditions</a> & confirm that my vehicle has a
                  valid PUC certificate.
                </div>

                <div className={styles.nextStep}>
                  <span className={styles.stepTag}>Next step:</span>
                  <p>
                    After payment, we'll ask you to fill a few details and complete
                    your KYC to <b>deliver your policy instantly</b> to your inbox.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CommercialVehicle6;
