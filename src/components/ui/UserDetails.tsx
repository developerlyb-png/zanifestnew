import React from "react";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FiFacebook, FiLinkedin } from "react-icons/fi";

import styles from "@/styles/components/ui/UserDetails.module.css";

function UserDetails() {
  return (
    <div className={styles.cont}>
      
      <div className={styles.detailsSection}>
        <div className={styles.detailItem}>
          <MdEmail />

          <a
            href="mailto:support@zanifestinsurance.com"
            className={styles.emailLink}
          >
            support@zanifestinsurance.com
          </a>
        </div>
      </div>

      <div className={styles.logosCont}>
        
        {/* Instagram */}
        <a
          href="https://www.instagram.com/zanifestinsurance?igsh=MXgybG9tNWJ3Yzhhbg%3D%3D"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram className={styles.socialIcon} />
        </a>

        {/* YouTube */}
        <a
          href="https://www.youtube.com/@zanifestinsurance?si=qeoR8nGF2vM9qSLu"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaYoutube className={styles.socialIcon} />
        </a>

        {/* Facebook */}
        <a
          href="https://www.facebook.com/people/Zanifest-Insurance/61587951775182/?rdid=ugTU8cAvrghxwvyw&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F18a9DHo2th%2F"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FiFacebook className={styles.socialIcon} />
        </a>

        {/* LinkedIn */}
        <a
          href="https://www.linkedin.com/in/mandeep-rathee-a5665010?utm_source=share_via&utm_content=profile&utm_medium=member_android"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FiLinkedin className={styles.socialIcon} />
        </a>

      </div>
    </div>
  );
}

export default UserDetails;