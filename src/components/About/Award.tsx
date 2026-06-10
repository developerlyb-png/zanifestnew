"use client";
import React from "react";
import Image from "next/image";
import styles from "@/styles/pages/award.module.css";

import visionImg from "@/assets/pageImages/team.jpg";
import missionImg from "@/assets/pageImages/agent.jpg";

const VisionMission = () => {
  return (
    <section className={styles.wrapper}>
      <div className={styles.container}>

        {/* ===== VISION ===== */}
        <div className={styles.section}>
          <div className={styles.content}>
            <h3 className={styles.heading}>Our Vision</h3>
            <p className={styles.text}>
              Wish to become a trusted insurance provider in the insurance field.
              We want to cover all houses, business premises, projects, vehicles,
              travellers, employees, and individuals to live a sustainable,
              worry-free life — eventually making India reach the top of the
              world happiness index.
            </p>
          </div>

          <div className={styles.imageBox}>
            <Image
              src={visionImg}
              alt="Our Vision"
              fill
              priority
              className={styles.image}
            />
          </div>
        </div>

        {/* ===== MISSION ===== */}
        <div className={styles.section}>
          <div className={styles.content}>
            <h3 className={styles.heading}>Our Mission</h3>
            <p className={styles.text}>
              To become the most honest and transparent insurance provider of
              India. We want to deliver our four core service promises:
            </p>

            <ul className={styles.list}>
              <li>Agility</li>
              <li>Honesty</li>
              <li>Transparency</li>
              <li>Ease</li>
            </ul>

            <p className={styles.text}>
              We wish to be known as an institution of choice for our commitment
              and fair business practices — ensuring Zanifest Insurance Broker
              becomes the most honest and best insurance broker of India.
            </p>
          </div>

          <div className={styles.imageBox}>
            <Image
              src={missionImg}
              alt="Our Mission"
              fill
              priority
              className={styles.image}
            />
          </div>
        </div>

      </div>
    </section>
  );
};

export default VisionMission;
