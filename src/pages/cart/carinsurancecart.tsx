import React, { useState } from 'react';
import styles from "@/styles/pages/cart/carinsurancecart.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { FaArrowLeftLong } from "react-icons/fa6";
import UserDetails from "@/components/ui/UserDetails";
import { FaRegFileVideo } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import { useRouter } from 'next/router';

const carinsurancecart = () => {
  const [owner, setOwner] = useState('individual');
  const [hasCng, setHasCng] = useState('no');
  const [isChecked, setIsChecked] = useState(false);

  const router = useRouter();

  return (
    <div>
             <UserDetails />
      <Navbar />
    
    <div className={styles.container}>
            {/* <button
    className={styles.backBtn}
    onClick={() => router.push("./carinsurance/carinsurancecar3")} 
  >
    <IoIosArrowBack className={styles.arrowBack} />
  </button> */}
        <div className={styles.summary}>
   
      <h3 className={styles.pageTitle}>Summary</h3>
</div>
      <div className={styles.main}>
        <div className={styles.left}>
          <div className={styles.card}>
             <h4 className={styles.sectionTitle}>Confirm & Pay</h4>
            <div className={styles.optionGroup}>
              <p>Car is owned by</p>
              <label>
                <input
                  type="radio"
                  checked={owner === 'company'}
                  onChange={() => setOwner('company')}
                />
                A Company
              </label>
              <label>
                <input
                  type="radio"
                  checked={owner === 'individual'}
                  onChange={() => setOwner('individual')}
                />
                An Individual
              </label>
              <p className={styles.note}>
                <FaRegFileVideo />
Car video inspection required. Details will be shared after payment.
              </p>
            </div>

            <div className={styles.optionGroup}>
              <p>Car has external CNG/LPG kit?</p>
              <label>
                <input
                  type="radio"
                  checked={hasCng === 'yes'}
                  onChange={() => setHasCng('yes')}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  checked={hasCng === 'no'}
                  onChange={() => setHasCng('no')}
                />
                No
              </label>
            </div>
          </div>

          <div className={styles.card1}>
            <h3>Car Details</h3>
            <p className={styles.carTitle}>
              SKODA SLAVIA Style Matte 1.0 TSI AT (999cc)
            </p>
            <p className={styles.carSubText}>Petrol - 2023 - DL10CV4566</p>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.summaryCard}>
            <h2 className={styles.heading}>Plan Summary</h2>
            <div className={styles.row}>
              <span>IDV Cover</span>
              <span>₹8,84,240</span>
            </div>
            <div className={styles.row}>
              <span>NCB%</span>
              <span>0%</span>
            </div>
            <button className={styles.viewBtn}>View Inclusions</button>
            <hr />
            <div className={styles.row}>
              <span>Premium Amount</span>
              <span>₹5,530</span>
            </div>
            <div className={styles.row}>
              <span>GST @18%</span>
              <span>+ ₹995</span>
            </div>
            <div className={styles.checkboxRow}>
              <input type="checkbox" defaultChecked />
              <label>
                <strong>Mandatory</strong> Personal Accident cover (₹15 lakhs) by Reliance
              </label>
              <span className={styles.price}>+ ₹234</span>
            </div>
            <div className={styles.totalBox}>
              <p className={styles.youPay}>You'll Pay</p>
              <p className={styles.priceBig}>₹6,525</p>
            </div>
            <button className={styles.payBtn}>PAY SECURELY →</button>
            <div className={styles.terms}>
              <label>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => setIsChecked(!isChecked)}
                />
                I agree to the <span>terms & conditions</span>...
              </label>
            </div>
            <div className={styles.nextStep}>
              <strong>Next step</strong>
              <p>
                After payment, we'll ask you to fill a few details and complete your KYC...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </div>
  );
};

export default carinsurancecart;
