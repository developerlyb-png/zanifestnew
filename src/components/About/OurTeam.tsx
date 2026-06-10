import React from "react";
import Image from "next/image";
import styles from "@/styles/pages/aboutcompany.module.css"; // ✅ SAME CSS

import teamImg from "@/assets/pageImages/team.jpg";
import agentimg from "@/assets/pageImages/agent.jpg";

const AboutDirector = () => {
  return (
    <>
      {/* ===== Section 1 ===== */}
      <section className={styles.originSection}>
        {/* IMAGE */}
        <div className={styles.imagesContainer}>
          <div className={styles.decorativeShape} />

          <Image
            src={teamImg}
            alt="Founder Leadership"
            fill
            priority
            className={styles.mainImage}
          />

          <div className={styles.smallImageWrapper}>
            <Image
              src={agentimg}
              alt="Corporate Experience"
              fill
              priority
              className={styles.smallImage}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className={styles.content}>
          <p className={styles.subtitle}>About the Founder</p>
          <h2 className={styles.title}>Mandeep Rathee</h2>
          <p className={styles.description}>
            I am Mandeep Rathee, Founder and CEO of Zanifest Insurance Broker
            Pvt. Limited. I have worked with leading corporates for almost
            two decades, starting my journey as a Management Trainee at
            Red Bull Energy Drink in 2005.
            <br /><br />
            Over the years, my professional journey took me through reputed
            organizations such as Bharti AXA, HDFC ERGO, and finally ICICI
            Lombard General Insurance, where I spent nearly 18 years in the
            general insurance space.
          </p>
        </div>
      </section>

      {/* ===== Section 2 ===== */}
      <section className={styles.originSection}>
        {/* IMAGE */}
        <div className={styles.imagesContainer}>
          <div className={styles.decorativeShape} />

          <Image
            src={teamImg}
            alt="Insurance Leadership"
            fill
            priority
            className={styles.mainImage}
          />

          <div className={styles.smallImageWrapper}>
            <Image
              src={agentimg}
              alt="Strategic Vision"
              fill
              priority
              className={styles.smallImage}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className={styles.content}>
          <p className={styles.subtitle}>Professional Journey</p>
          <h2 className={styles.title}>Experience & Vision</h2>
          <p className={styles.description}>
            In my last assignment, I worked as Deputy Vice President at
            ICICI Lombard, managing the Health Insurance business for the
            Rest of North India.
            <br /><br />
            Over the last two decades, I have handled diverse roles —
            from sampling, trade deals, and distribution management to
            understanding insurance at its core.
            <br /><br />
            Witnessing the insurance industry so closely made me realize
            that I could genuinely help people choose the right insurance
            plans for their businesses and loved ones — leading to the
            foundation of Zanifest.
          </p>
        </div>
      </section>
    </>
  );
};

export default AboutDirector;
