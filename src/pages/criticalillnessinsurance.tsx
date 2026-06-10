import styles from "@/styles/pages/criticalillnessinsurance.module.css";
import self from "../assets/pageImages/self.webp";
import wife from "../assets/pageImages/Wife.webp";
import son from "../assets/pageImages/son.webp";
import daughterImg from "../assets/pageImages/Daughter.webp";
import father from "../assets/pageImages/Father.webp";
import mother from "../assets/pageImages/Mother.webp";
import doctorAndPatient from "../assets/pageImages/doctor and patient.png";
import UserDetails from "@/components/ui/UserDetails";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function CriticalIllnessInsurance() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <div className={styles.container}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          <h2>Critical Illness Insurance</h2>
          <p>
            Critical illness insurance covers serious lifestyle diseases that
            can be life-threatening and require expensive and long-term medical
            treatment...
          </p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>⏱️</div>
              30 minutes claim support*
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🤝</div>
              Relationship manager for every customer
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📞</div>
              24x7 claims assistance in 30 mins guaranteed*
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📝</div>
              Instant policy issuance, no medical tests*
            </div>
          </div>

          <img
            src={doctorAndPatient.src}
            alt="Doctor and patient"
            className={styles.claimImage}
          />

          <div className={styles.claimStats}>
            <div className={styles.rating}>
              ⭐⭐⭐⭐⭐ <span>5.0</span>
            </div>
            <div className={styles.stats}>
              <div>10.5 crore Registered consumers</div>
              <div>51 Insurance partners</div>
              <div>5.3 crore Policies sold</div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          <h3>Find affordable plans</h3>

          <div className={styles.genderSelect}>
            <label>
              <input type="radio" name="gender" /> Male
            </label>
            <label>
              <input type="radio" name="gender" /> Female
            </label>
          </div>

          <div className={styles.membersGrid}>
            <div className={styles.member}>
              <img src={self.src} alt="Self" className={styles.memberImg} />
              <div>Self</div>
            </div>
            <div className={styles.member}>
              <img src={wife.src} alt="Wife" className={styles.memberImg} />
              <div>Wife</div>
            </div>
            <div className={styles.member}>
              <img src={son.src} alt="Son" className={styles.memberImg} />
              <div>Son</div>
            </div>
            <div className={styles.member}>
              <img
                src={daughterImg.src}
                alt="Daughter"
                className={styles.memberImg}
              />
              <div>Daughter</div>
            </div>
            <div className={styles.member}>
              <img src={father.src} alt="Father" className={styles.memberImg} />
              <div>Father</div>
            </div>
            <div className={styles.member}>
              <img src={mother.src} alt="Mother" className={styles.memberImg} />
              <div>Mother</div>
            </div>
          </div>

          <button className={styles.continueBtn}>Continue</button>
          <p className={styles.terms}>
            By clicking on “Continue”, you agree to our Privacy Policy and Terms
            of Use
          </p>
        </div>
        
      </div>
      <Footer />
    </div>
  );
}
