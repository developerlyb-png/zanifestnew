import React from "react";
import { FaPhoneAlt, FaInstagram, FaTwitter } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FiFacebook, FiLinkedin } from "react-icons/fi";

import styles from "@/styles/components/ui/UserDetails.module.css";

function UserDetails() {
  return (
    <div className={styles.cont}>
      <div className={styles.detailsSection}>
        <div className={styles.detailItem}>
          <FaPhoneAlt />
          <h4 className={styles.detailsText}>+91 8146777455</h4>
        </div>
        <div className={styles.line}></div>
        <div className={styles.detailItem}>
          <MdEmail />
          <h4 className={styles.detailsText}>support@zanifestinsurance.com </h4>
        </div>
        {/* <button onClick={() => signOut()}>
          Logout
        </button> */}
        {/* <div className={styles.line}></div>
        <div className={styles.detailItem}>
          <FaLocationDot />
          <h4 className={styles.detailsText}>123 street, abc city</h4>
        </div> */}
      </div>
      <div className={styles.logosCont}>
        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
        <FaInstagram className={styles.socialIcon}  />
      </a>
      <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
        <FaTwitter  />
      </a>
      <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
        <FiFacebook  />
      </a>
      <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
        <FiLinkedin  />
      </a>
      </div>
    </div>
  );
}

export default UserDetails;
