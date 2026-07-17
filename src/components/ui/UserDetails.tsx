import React from "react";
import { FaPhoneAlt, FaInstagram, FaTwitter } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FiFacebook, FiLinkedin } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";

import styles from "@/styles/components/ui/UserDetails.module.css";

function UserDetails() {
  return (
    <div className={styles.cont}>
      <div className={styles.detailsSection}>
        <div className={styles.detailItem}>
          {/* <FaPhoneAlt /> */}
          {/* <h4 className={styles.detailsText}>+91 8146777455</h4> */}
        </div>
        {/* <div className={styles.line}></div> */}
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
        <a href="https://www.instagram.com/zanifestinsurance?igsh=MXgybG9tNWJ3Yzhhbg%3D%3D" target="_blank" rel="noopener noreferrer">
        <FaInstagram className={styles.socialIcon}  />
      </a>
      <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
  <FaXTwitter />
</a>
      <a href="https://www.facebook.com/people/Zanifest-Insurance/61587951775182/?rdid=ugTU8cAvrghxwvyw&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F18a9DHo2th%2F" target="_blank" rel="noopener noreferrer">
        <FiFacebook  />
      </a>
      <a href="https://www.linkedin.com/in/mandeep-rathee-a5665010?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer">
        <FiLinkedin  />
      </a>
      </div>
    </div>
  );
}

export default UserDetails;