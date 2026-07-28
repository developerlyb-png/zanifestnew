"use client";
import React from "react";
import styles from "@/styles/pages/Policydeliveryshippingpolicy.module.css";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";

const PolicyDeliveryShippingPolicy: React.FC = () => {
  return (
    <>
      <Navbar />

      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <h1 className={styles.title}>Policy Delivery & Shipping Policy</h1>
            <p className={styles.subtitle}>
              Zanifest Insurance Broker Private Limited
            </p>
          </div>
        </header>

        <section className={styles.container}>
          <article className={styles.card}>
            <h2>Digital Delivery (Soft Copy)</h2>
            <p>
              For any insurance product purchased through the Zanifest
              website (www.zanifest.com), a digital soft copy of the policy
              document will be emailed to the registered email address
              provided at the time of purchase. The soft copy will be emailed
              by Zanifest, the respective Insurance Company, or both, in
              accordance with applicable IRDAI norms.
            </p>

            <h2>Physical Delivery (Hard Copy)</h2>
            <p>
              Where applicable under regulatory norms or requested by the
              customer, the issuing Insurance Company will deliver a physical
              hard copy of the policy documents to the registered address
              within <strong>2 to 3 weeks</strong> of purchasing the policy
              or within timeframes mandated by applicable regulations.
            </p>

            <div className={styles.infoBox}>
              <p>
                <span className={styles.boxLabel}>
                  Customer Support &amp; Assistance:
                </span>
              </p>
              <p>
                For delivery status, re-issuance, or queries, write to us at{" "}
                <a
                  href="mailto:support@zanifestinsurance.com"
                  className={`${styles.link} ${styles.mono}`}
                >
                  support@zanifestinsurance.com
                </a>{" "}
                or call <span className={styles.mono}>01762-496934</span>.
              </p>
            </div>

            <div className={styles.letterheadNote}>
              Zanifest Insurance Broker Private Limited | Registered with
              IRDAI under License No. 1119 (Code: IRDAI/INT/BRK/DB1242/2025)
            </div>

            <footer className={styles.footerRow}>
              <button
                className={styles.cta}
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
              >
                Back to top
              </button>

              <div className={styles.smallNote}>
                Last updated:{" "}
                <time dateTime={new Date().toISOString()}>
                  {new Date().toLocaleDateString()}
                </time>
              </div>
            </footer>
          </article>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default PolicyDeliveryShippingPolicy;
