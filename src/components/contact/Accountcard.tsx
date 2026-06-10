
import styles from '@/styles/contact/accountcard.module.css';
import Image from 'next/image';
import { FaStar } from 'react-icons/fa';
import contactimg from "@/assets/pageImages/contacticons.png"
import { useRouter } from "next/router";

const features = [
  'Download policy', 
  'Raise a query',
  'Share feedback',
  'Track policy status',
  'Request a callback',
  'View policy details & more',
];

export default function AccountCard() {
    const router = useRouter();
  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardContent}>
        <div className={styles.imageWrapper}>
          <Image
            src={contactimg} 
            alt="Family Illustration"
            width={240}
            height={240}
          />
        </div>

        <div className={styles.textSection}>
          <h2 className={styles.title}>My account</h2>
          <p className={styles.subtitle}>Fastest One-stop Servicing Gateway</p>

          <div className={styles.featureGrid}>
            {features.map((feature, i) => (
              <div key={i} className={styles.featureItem}>
                <FaStar className={styles.starIcon} />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <button className={styles.loginButton} onClick={() => {
                router.push("/login");
              }}
           >Login to my account</button>
        </div>
      </div>
    </div>
  );
}
