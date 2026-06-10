

import { useRouter } from "next/router";
import React from 'react';
import styles from '@/styles/contact/helpsection.module.css';

const HelpSection = () => {
  const router =useRouter();
  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <h2 className={styles.heading}>Here's how to receive help</h2>

        <div className={styles.step}>
          <div className={styles.level}>Level - 1</div>
          <div>
            <p className={styles.boldText}>Login to My Account to raise a Service Request</p>
            <p>If you have any query regarding your policies, kindly log in to My Account to raise a Service Request.</p>
            <button className={styles.loginBtn}  onClick={() => {
                router.push("/login");
              }}>LOGIN</button>
          </div>
        </div>

        <div className={styles.step}>
          <div className={styles.level}>Level - 2</div>
          <p className={styles.boldText}>Reach out to our Head of Customer Services</p>
        </div>

        <div className={styles.step}>
          <div className={styles.level}>Level - 3</div>
          <p className={styles.boldText}>Reach out to our Chief Grievance Officer</p>
        </div>

        <p className={styles.footerText}>
          If you have followed all the above three steps meant to address your concern or complaint to your satisfaction, and are still unsatisfied,
          you may approach the IRDA for Redressal at <a href="https://www.irdai.gov.in">https://www.irdai.gov.in</a>
        </p>
      </div>

      <div className={styles.rightSection}>
        <div className={`${styles.card} ${styles.blueCard}`}>
          <p className={styles.cardTitle}>Helpline for buying a new policy</p>
          <p className={styles.helpline}>1800-208-8787</p>
          <p className={styles.time}>10 AM to 7 PM</p>
          <p>NRI helpline for buying a new policy</p>
          <p className={styles.nri}>+91-8146777455</p>
        </div>

        <div className={`${styles.card} ${styles.cyanCard}`}>
          <p className={styles.cardTitle}>Helpline for existing policy</p>
          <p className={styles.helpline}>1800-258-5970</p>
          <p className={styles.time}>10 AM to 7 PM (use registered number)</p>
          <p>NRI helpline for existing policy</p>
          <p className={styles.nri}>+91-8146777455</p>
        </div>

        <div className={`${styles.card} ${styles.yellowCard}`}>
          <p className={styles.cardTitle}>Helpline for claim</p>
          <p className={styles.helpline}>1800-258-5881</p>
          <p>NRI helpline for claim</p>
          <p className={styles.nri}>+91-8146777455</p>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
