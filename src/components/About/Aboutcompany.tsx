import React from "react";
import Image from "next/image";
import styles from "@/styles/pages/aboutcompany.module.css";

import teamImg from "@/assets/pageImages/team.jpg";
import agentimg from "@/assets/pageImages/agent.jpg";

const Aboutcompany = () => {
  return (
    <>
      {/* ===== Section 1 ===== */}
      <section className={styles.originSection}>
        {/* IMAGE */}
        <div className={styles.imagesContainer}>
          <div className={styles.decorativeShape} />

          <Image
            src={teamImg}
            alt="Zanifest Team"
            fill
            priority
            className={styles.mainImage}
          />

          <div className={styles.smallImageWrapper}>
            <Image
              src={agentimg}
              alt="Zanifest Advisors"
              fill
              priority
              className={styles.smallImage}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className={styles.content}>
          <p className={styles.subtitle}>Our Purpose</p>
          <h2 className={styles.title}>Why Zanifest Exists</h2>
          <p className={styles.description}>
            Zanifest Insurance Broking is born to realize the dream of helping
            people by mitigating their risks and providing honest and most
            effective insurance solutions.
            <br /><br />
            Over the years, we discovered serious challenges in the insurance
            ecosystem. There is widespread mis-selling, service delays, and
            finding credible, trustworthy advice has become extremely difficult.
            Trust issues exist — and rightly so.
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
            alt="Insurance Advisory"
            fill
            priority
            className={styles.mainImage}
          />

          <div className={styles.smallImageWrapper}>
            <Image
              src={agentimg}
              alt="Customer Support"
              fill
              priority
              className={styles.smallImage}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className={styles.content}>
          <p className={styles.subtitle}>Our Approach</p>
          <h2 className={styles.title}>Bridging the Trust Gap</h2>
          <p className={styles.description}>
            There are very few professionals who have seen both sides of the
            insurance industry — as a corporate employee and as a channel
            partner advisor.
            <br /><br />
            Insurance needs compassion, but technology has replaced human touch
            and warmth.
            <br /><br />
            <strong>
              We promise to help our customers choose the best insurance cover.
            </strong>
            <br /><br />
            <strong>!! Vada Suraksha Ka !!</strong>
          </p>
        </div>
      </section>
    </>
  );
};

export default Aboutcompany;
