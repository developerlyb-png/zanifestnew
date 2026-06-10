import React from 'react';
import styles from '@/styles/contact/contactmain.module.css'; // ✅ Import your CSS module
import AccountCard from './Accountcard';
import Contactuscard from './Contactuscard';
import FAQSection from '../home/FAQSection';

const Contactmain = () => {
  return (
    <div>
      <div className={styles.banner}>
        <div className={styles.bannerContainer}>
          <div className={styles.breadcrumb}>
            <span>Home &gt; </span>
<a
  href="https://wa.me/919876543210"
  target="_blank"
  rel="noopener noreferrer"
  className={styles.contactLink}
>
  Contact Us
</a>
          </div>
          <h2 className={styles.heading}>
            At Zanifest, it is our constant endeavour to provide great customer experience.
          </h2>
          <p className={styles.subtext}>
            In case you require assistance, we have created multiple ways to reach out to us. <br />
            We commit to resolving your queries to your satisfaction.
          </p>
        </div>
      </div>

      <div className={styles.cardWrapper}>
        <AccountCard/>
        <Contactuscard/>
      
      </div>
    </div>
      
  );
};

export default Contactmain;
