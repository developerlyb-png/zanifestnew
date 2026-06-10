"use clent";
import React from "react";
import styles from "@/styles/pages/Refundpolicy.module.css";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";

const Refundpolicy: React.FC = () => {
  return (
     <>
      {/* Navbar */}
      <Navbar />
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>Refund & Cancellation Policy</h1>
          <p className={styles.subtitle}>
            Zanifest Insurance Broker Private Limited
          </p>
        </div>
      </header>

      {/* Content Section */}
      <section className={styles.container}>
        <article className={styles.card}>
          <p className={styles.lead}>
            This Refund & Cancellation Policy explains how cancellations,
            refunds, and payment-related matters are handled for all insurance
            products and services purchased through Zanifest Insurance Broker
            Private Limited ("Zanifest", "Company", "We", "Us"). By using our
            website or services, you agree to the terms stated below.
          </p>

          {/* 1. Nature of Service */}
          <h2>1. Nature of Our Service</h2>
          <p>
            Zanifest acts as a licensed insurance broker, assisting users with
            insurance comparisons, recommendations, purchase support, and
            post-sale servicing. We do not underwrite or issue insurance
            policies. All risk coverage, policy issuance, refund eligibility, and
            cancellations are governed by the respective insurance company’s
            terms.
          </p>

          {/* 2. Cancellation Policies */}
          <h2>2. Cancellation of Insurance Policies</h2>
          <p>
            Policy cancellation is subject to the rules of the insurer whose
            policy you have purchased. Common scenarios include:
          </p>

          <ul>
            <li>Free-look cancellation (most policies offer 15–30 days)</li>
            <li>Cancellation due to incorrect information</li>
            <li>Cancellation before policy issuance</li>
            <li>Cancellation for non-payment of premium</li>
            <li>Cancellation due to underwriting rejection</li>
          </ul>

          <p>
            Zanifest cannot cancel a policy on its own. We only facilitate the
            cancellation request with the insurer.
          </p>

          {/* 3. Refund Eligibility */}
          <h2>3. Refund Eligibility</h2>
          <p>
            Refunds are processed only as per the insurer’s refund rules. Refund
            may be provided when:
          </p>

          <ul>
            <li>The underwriter rejects your application</li>
            <li>You cancel within the free-look period</li>
            <li>You are eligible for a prorated refund</li>
            <li>Duplicate payment or transaction failure</li>
            <li>Premium was charged but policy was not issued</li>
          </ul>

          <p>
            <strong>Refund is not applicable when:</strong>
          </p>

          <ul>
            <li>The insurer explicitly disallows refunds</li>
            <li>The free-look period has expired</li>
            <li>Policy does not offer refunds</li>
            <li>Fraudulent or incorrect information was provided</li>
            <li>Refund request violates IRDAI guidelines</li>
          </ul>

          {/* Footer */}
          <footer className={styles.footerRow}>
            <button
              className={styles.cta}
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
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
    
      {/* Footer */}
      <Footer />
    </>
  );
};

export default Refundpolicy;
