
import React from 'react'
import { FiPhoneCall } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { BsChatDots } from 'react-icons/bs';
import styles from '@/styles/contact/contactus.module.css';
import { MdEmail } from 'react-icons/md';


const Contactuscard = () => {
  return (
    <div>
          <div className={styles.card}>
      <h3 className={styles.heading}>Need help?</h3>
      <p className={styles.subtext}>Choose how you like to connect with us</p>

      <div className={styles.optionsWrapper}>
        <div className={styles.option}>
          <div className={styles.optionLeft}>
            <FiPhoneCall className={styles.iconYellow} />
            <span className={styles.label}>Request a call back</span>
          </div>
          <span>&gt;</span>
        </div>

        <div className={styles.option}>
          <div className={styles.optionLeft}>
            <BsChatDots className={styles.iconPurple} />
            <span className={styles.label}>Chat with us</span>
          </div>
          <span>&gt;</span>
        </div>

        <div className={styles.whatsapp}>
          <FaWhatsapp className={styles.iconGreen} />
          <div>
            <p>Connect on Whatsapp at</p>
            <p className={styles.whatsappNumber}>+91 8146777455</p>
          </div>
        </div>
          <div className={styles.whatsapp}>
          {/* Emails (Compact – no extra height) */}
        <div className={styles.emailBlock}>
          <MdEmail className={styles.iconBlue} />
          <div>
            <p className={styles.emailLabel}>Customer Support</p>
            <p className={styles.emailText}>support@zanifestinsurance.com</p>
          </div>
        </div>

        <div className={styles.emailBlock}>
          <MdEmail className={styles.iconBlue} />
          <div>
            <p className={styles.emailLabel}>Official Communication</p>
            <p className={styles.emailText}>mandeep.rathee@zanifestinsurance.com</p>
          </div>
        </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default Contactuscard