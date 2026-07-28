"use client";
import React from "react";
import styles from "@/styles/pages/Grievanceredressalpolicy.module.css";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";

const GrievanceRedressalPolicy: React.FC = () => {
  return (
    <>
      <Navbar />

      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <h1 className={styles.title}>Grievance Redressal Policy</h1>
            <p className={styles.subtitle}>
              Zanifest Insurance Broker Private Limited
            </p>
          </div>
        </header>

        <section className={styles.container}>
          <article className={styles.card}>
            <h2>Introduction</h2>
            <p>
              Zanifest Insurance Broker Private Limited (hereinafter referred
              to as &ldquo;The Company / Zanifest&rdquo;) believes that
              excellence in customer service is the most important tool for
              sustained business growth. Therefore, the company follows a
              philosophy of providing resolution of the customers&apos;
              complaint/grievance in a manner that effectively resolves the
              complaint to customer&apos;s satisfaction.
            </p>

            <h2>Objective</h2>
            <p>
              The objective of this policy is to provide an efficient and
              effective grievance redressal mechanism to policyholders,
              nominees, and other persons claiming under policies, formulated
              taking into account the following:
            </p>
            <ul>
              <li>Complaints raised by customers are dealt with courtesy and on time.</li>
              <li>Customers are treated fairly at all times.</li>
              <li>Complete transparency is maintained with the customers.</li>
              <li>All complaints are dealt with efficiently and fairly.</li>
              <li>
                Customers are fully informed of avenues to escalate their
                complaints / grievances within the organization.
              </li>
              <li>
                Customers are informed of their rights to alternative remedies
                if they are not fully satisfied with the response of the
                Company to their complaints.
              </li>
              <li>
                Recognize that our quality and business goals go hand in
                hand, driving continual improvement of the customer complaint
                handling process through available business process tools and
                information technology.
              </li>
            </ul>

            <h2>Scope</h2>
            <p>
              The policy shall cover all complaints/grievances received from
              the policyholder, nominee, beneficiary, or authorized person
              (with written consent of the policy owner). The company will
              not accept any complaint from third-party agencies on behalf of
              the customer unless supported by written consent from the
              policyholder.
            </p>
            <p>
              Grievances received from consumer forums, the insurance
              ombudsman office, or courts will be dealt with separately by
              the legal team.
            </p>
            <p>Inquiries or requests are not covered under this policy.</p>

            <h2>Definitions</h2>
            <p>
              <strong>&ldquo;Complainant&rdquo;</strong> means a policyholder,
              prospect, or beneficiary of an insurance policy who has filed a
              complaint or grievance against the insurer or the company.
            </p>
            <p>
              <strong>&ldquo;Complaints&rdquo; or &ldquo;Grievance&rdquo;</strong>{" "}
              means a written expression (including electronic mail or
              electronic scripts) of dissatisfaction by a complainant with the
              insurer, company, or other regulated entities about an action,
              lack of action, or deficiency of service.
            </p>

            <div className={styles.noteBox}>
              <p>
                <strong>Explanation:</strong> An <em>Inquiry</em> (requesting
                information about the company or services) or a{" "}
                <em>Request</em> (soliciting a service change or policy
                modification) does not fall under the definition of a
                complaint or grievance.
              </p>
            </div>

            <h2>Complaint Redressal Process</h2>
            <p>
              If you have a grievance that you wish to redress, you may
              contact us with the details of your grievance through any of
              the following channels:
            </p>

            <h3 className={styles.subheading}>Step 1: Channels for Communication</h3>
            <div className={styles.infoBox}>
              <p>
                <span className={styles.boxLabel}>Email:</span>{" "}
                <a
                  href="mailto:support@zanifestinsurance.com"
                  className={`${styles.link} ${styles.mono}`}
                >
                  support@zanifestinsurance.com
                </a>
              </p>
              <p>
                <span className={styles.boxLabel}>Phone:</span>{" "}
                <span className={styles.mono}>01762-496934</span>
              </p>
              <p>
                <span className={styles.boxLabel}>Postal Address:</span>{" "}
                Grievance Redressal Officer, Zanifest Insurance Broker Private
                Limited, SCF No. 8, First Floor, Old Ambala Road, Gazipur,
                Zirakpur, Mohali, Punjab — 140603
              </p>
              <p>
                <span className={styles.boxLabel}>Website:</span>{" "}
                <a
                  href="https://zanifestinsurance.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.link} ${styles.mono}`}
                >
                  https://zanifestinsurance.com
                </a>
              </p>
            </div>

            <h3 className={styles.subheading}>Step 2: Process for Addressing Queries</h3>
            <ol>
              <li>
                All grievances will be issued an acknowledgment receipt
                within <strong>24 working hours</strong> of receipt.
              </li>
              <li>
                Written letters or postal queries will be responded to within{" "}
                <strong>14 days</strong> from receipt.
              </li>
              <li>
                Walk-in customer grievances will be acknowledged immediately,
                and an entry logged in our grievance register.
              </li>
              <li>
                Based on the nature of the grievance, Zanifest will exercise
                all efforts to resolve the issue within <strong>14 days</strong>{" "}
                of receipt.
              </li>
              <li>
                Upon resolution, a formal closure communication will be sent
                to the customer along with a request for rating the service.
              </li>
            </ol>

            <h3 className={styles.subheading}>Step 3: Escalation Matrix</h3>
            <div className={styles.infoBox}>
              <p>
                <span className={styles.boxLabel}>Level 1:</span> If you do
                not receive a response within 14 working days, or are
                dissatisfied with the response, you may escalate the matter
                to the Grievance Redressal Officer at{" "}
                <a
                  href="mailto:support@zanifestinsurance.com"
                  className={`${styles.link} ${styles.mono}`}
                >
                  support@zanifestinsurance.com
                </a>
                .
              </p>
              <p>
                <span className={styles.boxLabel}>Level 2:</span> If still
                not satisfied after Level 1, please escalate the matter to
                the Principal Officer at{" "}
                <a
                  href="mailto:mandeep.rathee@zanifestinsurance.com"
                  className={`${styles.link} ${styles.mono}`}
                >
                  mandeep.rathee@zanifestinsurance.com
                </a>
                .
              </p>
              <p>
                <span className={styles.boxLabel}>Level 3:</span> If your
                grievance remains unresolved after Level 1 and Level 2, you
                may approach the IRDAI Bima Bharosa Portal at{" "}
                <a
                  href="https://www.bimabharosa.irdai.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.link} ${styles.mono}`}
                >
                  https://www.bimabharosa.irdai.gov.in
                </a>{" "}
                or the Insurance Ombudsman at{" "}
                <a
                  href="https://cioins.co.in/Complaint/Online"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.link} ${styles.mono}`}
                >
                  https://cioins.co.in/Complaint/Online
                </a>{" "}
                (maximum dispute limit entertained by the Ombudsman is up to
                ₹30 Lakhs).
              </p>
            </div>

            <h3 className={styles.subheading}>Step 4: Resolution Criteria</h3>
            <p>
              As per IRDAI guidelines, a grievance shall be considered
              disposed of and resolved when:
            </p>
            <ul>
              <li>Zanifest has fully acceded to the request of the complainant; or</li>
              <li>
                The complainant has indicated acceptance of the
                Company&apos;s response in writing; or
              </li>
              <li>
                The complainant has not responded to the Company within <strong> 8
                weeks </strong> of the written response.
              </li>
            </ul>

            <h2>Review</h2>
            <p>
              This policy will be reviewed periodically as and when required
              in accordance with regulatory guidelines.
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

export default GrievanceRedressalPolicy;
