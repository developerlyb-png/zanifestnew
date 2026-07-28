"use client";
import React from "react";
import styles from "@/styles/pages/Frauddetectionpolicy.module.css";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";

const FraudDetectionPolicy: React.FC = () => {
  return (
    <>
      <Navbar />

      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <h1 className={styles.title}>Fraud Detection Policy</h1>
            <p className={styles.subtitle}>
              Zanifest Insurance Broker Private Limited
            </p>
          </div>
        </header>

        <section className={styles.container}>
          <article className={styles.card}>
            <h2>Introduction</h2>
            <p>
              The Insurance Regulatory and Development Authority of India
              (IRDAI), vide its Guidelines on Insurance e-commerce bearing
              number IRDA/INT/GDL/ECM/055/03/2017 dated 9th March 2017,
              mandates a proactive fraud detection policy for insurance
              e-commerce activities, approved by the Board of Directors of
              the Company. Accordingly, this policy has been formulated
              considering potential risks, including e-commerce fraud, to
              which <strong> Zanifest Insurance Broker Private Limited </strong>(hereinafter
              referred to as &ldquo;the Company&rdquo; or
              &ldquo;Zanifest&rdquo;) may be exposed. This policy provides
              clear guidance with respect to the prevention, detection,
              investigation, and mitigation of fraudulent activities related
              to e-commerce and general operations.
            </p>

            <h2>Objective</h2>
            <p>
              This policy is established to prevent, detect, investigate, and
              mitigate insurance fraud within the Company. It facilitates the
              development of structured processes to manage fraud risks,
              ensure robust organizational controls, and conduct thorough
              investigations. Zanifest is committed to conducting business
              with complete fairness and integrity, adopting a  
               <strong>&ldquo;Zero-Tolerance&rdquo;</strong> approach to fraud.
            </p>

            <h2>Applicability</h2>
            <p>
              This policy applies to any actual or suspected fraud involving
              the Company&apos;s officials, directors, employees,
              shareholders, vendors, contractors, business associates,
              policyholders, assignees, claimants, nominees, and any external
              agencies doing business with the company. Any investigation
              activity will be conducted impartially, regardless of the
              suspected wrongdoer&apos;s length of service or title.
            </p>

            <h2>Classification of Insurance Frauds</h2>
            <p>
              In accordance with IRDAI Circular
              IRDAI/SDD/MISC/CIR/009/01/2013, fraud in insurance is defined as
              an act or omission intended to gain a dishonest or unlawful
              advantage for the party committing the fraud or related
              parties. Categories include:
            </p>
            <ul>
              <li>
                <strong>a. Internal Fraud:</strong> Fraud/misappropriation
                against the Company by a Director, Manager, employee, or
                internal stakeholder (e.g., embezzlement, fraudulent
                financial reporting, cheque forgery, overriding decline
                decisions, inflating expense claims, or illegal data use).
              </li>
              <li>
                <strong>b. Policyholder Fraud:</strong> Fraud against the
                Company during the purchase, execution, or servicing of a
                policy (e.g., staging incidents, claiming fictitious damage,
                fraudulent medical or death claims, unauthorized policy
                surrenders or switches).
              </li>
              <li>
                <strong>c. Third-Party &amp; Online Frauds:</strong> Spurious
                calls, fake/forged policy documents issued by third parties,
                online payment card frauds, merchant non-remittance of
                premium, cyber security attacks, or phishing/data leakage.
              </li>
            </ul>

            <h2>Composition of Fraud Investigation Unit (FIU)</h2>
            <p>
              The Fraud Investigation Unit shall be headed by the Head of
              Claims &amp; Support, who shall, based on the nature of fraud
              under investigation, include employees from different units on
              an ad-hoc basis for immediate support and assistance.
            </p>

            <h2>Identification and Reporting</h2>
            <p>
              All confirmed, attempted, or suspected frauds detected by any
              department or individual must be reported to the functional
              head and Fraud Investigation Unit within 48 hours from
              detection.
            </p>

            <h2>Reporting Mechanism</h2>
            <div className={styles.infoBox}>
              <p>
                <span className={styles.boxLabel}>
                  1. Reporting to Fraud Investigation Unit:
                </span>
              </p>
              <p>
                Email:{" "}
                <a
                  href="mailto:support@zanifestinsurance.com"
                  className={`${styles.link} ${styles.mono}`}
                >
                  support@zanifestinsurance.com
                </a>
                <br />
                Letter: Marked &ldquo;Private and Confidential&rdquo;, Fraud
                Investigation Unit, Zanifest Insurance Broker Private
                Limited, SCF No. 8, First Floor, Old Ambala Road, Gazipur,
                Zirakpur, Mohali, Punjab — 140603
              </p>

              <p>
                <span className={styles.boxLabel}>
                  2. Escalation to Principal Officer:
                </span>
              </p>
              <p>
                Email:{" "}
                <a
                  href="mailto:mandeep.rathee@zanifestinsurance.com"
                  className={`${styles.link} ${styles.mono}`}
                >
                  mandeep.rathee@zanifestinsurance.com
                </a>
                <br />
                Letter: Marked &ldquo;Private and Confidential&rdquo;, The
                Principal Officer, Zanifest Insurance Broker Private Limited,
                SCF No. 8, First Floor, Old Ambala Road, Gazipur, Zirakpur,
                Mohali, Punjab — 140603
              </p>

              <p>
                <span className={styles.boxLabel}>
                  3. Allegations Against Senior Executives:
                </span>
              </p>
              <p>
                Letter: Marked &ldquo;Private and Confidential&rdquo;, The
                Board of Directors, Zanifest Insurance Broker Private
                Limited, SCF No. 8, First Floor, Old Ambala Road, Gazipur,
                Zirakpur, Mohali, Punjab — 140603
              </p>
            </div>

            <h2>Investigation Powers &amp; Awareness</h2>
            <p>
              The FIU and Principal Officer are entrusted with full authority
              to investigate all suspected/actual fraudulent acts, including
              inspecting company records, digital files, desks, storage, and
              premises without prior notice. Employees receive regular
              training on Anti-Money Laundering (AML) and Code of Conduct.
            </p>

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
                Last updated: <time dateTime="2026-07-28">July 28, 2026</time>
              </div>
            </footer>
          </article>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default FraudDetectionPolicy;
