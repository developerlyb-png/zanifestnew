"use client";
import React from "react";
import styles from "@/styles/pages/Eiainformationpolicy.module.css";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";

const EIAInformationPolicy: React.FC = () => {
  return (
    <>
      <Navbar />

      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <h1 className={styles.title}>
              E-Insurance Account (EIA) Information Policy
            </h1>
            <p className={styles.subtitle}>
              Zanifest Insurance Broker Private Limited
            </p>
          </div>
        </header>

        <section className={styles.container}>
          <article className={styles.card}>
            <h2>What is an E-Insurance Account?</h2>
            <p>
              An e-Insurance Account (eIA) or Electronic Insurance Account
              acts like a demat depository for your insurance policies. It
              enables you to maintain all life, general, motor, and health
              insurance documents across various insurers in one centralized
              online portal with 24/7 global access, zero risk of loss or
              physical damage, and complete paperless convenience.
            </p>

            <h2>Approved Insurance Repositories</h2>
            <p>
              You can open an eIA with any of the four IRDAI-registered
              Insurance Repositories:
            </p>
            <ul>
              <li>CDSL Insurance Repository Limited</li>
              <li>NSDL National Insurance Repository (NIR)</li>
              <li>CAMS Repository Services Limited</li>
              <li>Karvy Insurance Repository Limited</li>
            </ul>

            <h2>Procedure to Open an eIA</h2>
            <ol>
              <li>
                Download the eIA opening form from your preferred Insurance
                Repository or Zanifest.
              </li>
              <li>
                Fill in details and attach self-attested KYC documents (PAN,
                Address Proof, DOB Proof).
              </li>
              <li>
                Provide bank details along with a cancelled cheque and a
                recent passport-sized photograph.
              </li>
              <li>
                Submit the form to your repository or insurance provider.
                (KYC resubmission is not required when buying new policies
                once your eIA is active).
              </li>
            </ol>

            <h2>Authorized Representative</h2>
            <p>
              An Authorized Representative (above 21 days of age) must be
              appointed by the account holder. In the absence or demise of
              the policyholder, this person can access the eIA portfolio to
              ensure seamless claim processing for the family.
            </p>

            <h2>Key Benefits &amp; Features</h2>
            <ul>
              <li>
                <strong>Single Consolidated View:</strong> Track all
                policies across multiple insurers in one screen.
              </li>
              <li>
                <strong>No Resubmission of KYC:</strong> Purchase future
                policies simply by referencing your unique eIA number.
              </li>
              <li>
                <strong>Automated Alerts:</strong> Receive timely renewal
                reminders to prevent policy lapse.
              </li>
              <li>
                <strong>Easy Updates:</strong> Update contact details or
                address once, and it updates across all linked policies.
              </li>
              <li>
                <strong>Convert Old Policies:</strong> Existing physical
                policies can be converted into e-policies at zero cost.
              </li>
            </ul>

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

export default EIAInformationPolicy;
