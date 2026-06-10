"use client";
import React from "react";
import styles from "@/styles/pages/Privacypolicy.module.css";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      {/* Navbar */}
      <Navbar />

      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <h1 className={styles.title}>Privacy Policy</h1>
            <p className={styles.subtitle}>
              Zanifest Insurance Broker Private Limited
            </p>
          </div>
        </header>

        {/* Content */}
        <section className={styles.container}>
          <article className={styles.card}>
            <p className={styles.lead}>
              Zanifest Insurance Broker Private Limited (“Zanifest”, “Company”,
              “We”, “Us”) operates the website and digital platforms that help
              users discover, compare, purchase, and manage insurance products.
              This Privacy Policy explains how we collect, use, store, share,
              and safeguard your information when you interact with our website
              or services.
            </p>

            <p>
              By visiting or using our website, you agree to the practices
              described in this Privacy Policy. This Privacy Policy is published
              in accordance with the Information Technology Act, 2000 and the IT
              (Reasonable Security Practices and Procedures and Sensitive
              Personal Information) Rules, 2011 (“SPDI Rules”).
            </p>

            {/* 1. Controllers */}
            <h2>1. Controllers of Personal Information</h2>
            <p>Your personal data is collected and processed by:</p>
            <p>
              <strong>Zanifest Insurance Broker Private Limited</strong> <br />
              Chandigarh <br />
              Email:{" "}
              <a
                href="mailto:support@zanifestinsurance.com"
                className={styles.link}
              >
                support@zanifestinsurance.com
              </a>
            </p>

            {/* 2. Information We Collect */}
            <h2>2. Information We Collect</h2>

            <h3 className={styles.subheading}>a. Information You Provide</h3>
            <ul>
              <li>Full name</li>
              <li>Contact information (email, mobile, WhatsApp)</li>
              <li>Date of birth</li>
              <li>Address / location</li>
              <li>KYC documents (PAN, Aadhaar, ID Proof)</li>
              <li>Uploaded documents for insurance processing</li>
              <li>Financial information for policy issuance</li>
              <li>Medical or health records (if required by insurers)</li>
              <li>Any data submitted while using our services</li>
            </ul>

            <h3 className={styles.subheading}>b. Automatically Collected</h3>
            <ul>
              <li>IP address</li>
              <li>Device, browser type, OS</li>
              <li>Usage patterns & clickstream data</li>
              <li>Pages viewed and interactions</li>
              <li>Cookies & tracking identifiers</li>
            </ul>

            <h3 className={styles.subheading}>c. Payment Information</h3>
            <p>
              Payments made through Razorpay or other gateways may require card
              details, UPI information, or transaction IDs. These are handled as
              per the payment gateway’s security standards.
            </p>

            {/* 3. How We Use Information */}
            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>Provide insurance quotes and recommendations</li>
              <li>Process policy purchases and service requests</li>
              <li>
                Contact you via email/WhatsApp for updates & notifications
              </li>
              <li>Verify identity & complete KYC</li>
              <li>Share information with insurers for policy issuance</li>
              <li>Respond to queries and support requests</li>
              <li>Improve website performance and user experience</li>
              <li>
                Marketing optimization via Google Analytics & Meta Pixel
              </li>
              <li>Meet regulatory and compliance requirements</li>
            </ul>

            {/* 4. Information Sharing */}
            <h2>4. Information Sharing and Disclosure</h2>

            <h3 className={styles.subheading}>
              a. Insurance Companies & Partners
            </h3>
            <p>For quotes, policy issuance, servicing, claims, and compliance.</p>

            <h3 className={styles.subheading}>b. Service Providers</h3>
            <ul>
              <li>Hosting providers</li>
              <li>Razorpay (payment gateway)</li>
              <li>WhatsApp API services</li>
              <li>Analytics & marketing tools (Google, Meta)</li>
              <li>KYC verification providers</li>
            </ul>

            <h3 className={styles.subheading}>c. Legal Requirements</h3>
            <p>
              We may disclose information to courts, government agencies, or
              regulators when required by law.
            </p>

            <h3 className={styles.subheading}>d. Business Transfers</h3>
            <p>
              If Zanifest Insurance is merged or acquired, personal data may be
              transferred as part of the transaction.
            </p>

            {/* 5. Cookies */}
            <h2>5. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies for website functionality, analytics, and
              marketing. Cookies do not store personally identifiable
              information. You may disable cookies, but some features may stop
              working.
            </p>

            {/* 6. Security */}
            <h2>6. Data Storage and Security</h2>
            <p>
              We implement strong technical and organizational safeguards,
              including:
            </p>
            <ul>
              <li>Encrypted data transmission</li>
              <li>Secure cloud hosting</li>
              <li>Strict access controls</li>
              <li>Regular audits and updates</li>
            </ul>

            <p>
              However, no system is entirely secure. You are responsible for
              maintaining the confidentiality of account credentials.
            </p>

            {/* 7. User Rights */}
            <h2>7. User Rights</h2>
            <p>You may request:</p>
            <ul>
              <li>Access to your personal data</li>
              <li>Correction of inaccurate information</li>
              <li>Opt-out of promotions</li>
              <li>Deletion of your data (subject to law)</li>
            </ul>

            <p>
              Email:{" "}
              <a
                href="mailto:support@zanifestinsurance.com"
                className={styles.link}
              >
                support@zanifestinsurance.com
              </a>
            </p>

            {/* 8. Third Party Links */}
            <h2>8. Third-Party Links</h2>
            <p>
              External links may have their own privacy policies. We are not
              responsible for their practices.
            </p>

            {/* 9. Changes */}
            <h2>9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Continued use
              of our services means you accept the updated version.
            </p>

            {/* 10. Grievance Officer */}
            <h2>10. Data Grievance Officer</h2>
            <p>
              Grievance Officer <br />
              Zanifest Insurance Broker Private Limited <br />
              Chandigarh <br />
              Email:{" "}
              <a
                href="mailto:support@zanifestinsurance.com"
                className={styles.link}
              >
                support@zanifestinsurance.com
              </a>
            </p>

            {/* Footer Row */}
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

      {/* Footer */}
      <Footer />
    </>
  );
};

export default PrivacyPolicy;
