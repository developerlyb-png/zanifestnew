"use client";

import React from "react";
import styles from "@/styles/pages/marine/marine6.module.css";
import Image, { StaticImageData } from "next/image";

import chola from "@/assets/home/chola ms.png";
import tata from "@/assets/images.jpeg";
import icici from "@/assets/CommercialVehicle/ICICIlombard.png";
import agent from "@/assets/health/manicon.webp";
import { useRouter } from "next/navigation";


// Icons
import {
  FaArrowLeft,
  FaPhoneAlt,
  FaBolt,
  FaCheck,
  FaArrowRight,
  FaCheckCircle,
} from "react-icons/fa";
import { MdOutlineSchedule } from "react-icons/md";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

type LogoType = StaticImageData | string;

type PolicyCardProps = {
  logo: LogoType;
  title: string;
  amount: string;
  price: string;
  coverages: string[];
  extraCoverages: number;
};

const policies: PolicyCardProps[] = [
  {
    logo: tata,
    title: "Basic Cover",
    amount: "₹ 54,45,556",
    price: "₹ 1,928",
    coverages: ["Collision", "Fire, lightening or explosion", "Breakage of bridge"],
    extraCoverages: 3,
  },
  {
    logo: icici,
    title: "Basic Cover",
    amount: "₹ 54,45,556",
    price: "₹ 1,929",
    coverages: ["Collision", "Fire, lightening or explosion", "Breakage of bridge"],
    extraCoverages: 3,
  },
];

const PolicyCard: React.FC<PolicyCardProps> = ({
  logo,
  title,
  amount,
  price,
  coverages,
  extraCoverages,
}) => {
  return (
   
    <div className={styles.policyCard}>
      {/* Badge */}
      <div className={styles.badgeRow}>
        <span className={styles.badge}>
          <FaBolt className={styles.badgeIcon} />
          Instant Policy
        </span>
      </div>

      {/* Main row */}
      <div className={styles.row}>
        <div className={styles.logoCol}>
          {typeof logo === "string" ? (
            <img src={logo} alt="insurer" className={styles.logoImg} />
          ) : (
            <Image src={logo} alt="insurer" className={styles.logoImg} />
          )}
        </div>

        <div className={styles.planCol}>
          <div className={styles.planTitle}>{title}</div>
        </div>

        <div className={styles.amountCol}>
          <div className={styles.amountLabel}>Covered amount</div>
          <div className={styles.amountValue}>{amount}</div>
        </div>

        <div className={styles.priceCol}>
          <button className={styles.priceBtn}>
            {price} <FaArrowRight />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className={styles.hr} />

      {/* Coverages */}
      <div className={styles.covWrap}>
        <div className={styles.covTitle}>Top coverages</div>
        <div className={styles.pillRow}>
          {coverages.map((c, i) => (
            <span key={i} className={styles.pill}>
              <FaCheck className={styles.tick} />
              {c}
            </span>
          ))}
          <span className={`${styles.pill} ${styles.pillGreen}`}>
            +{extraCoverages} risks covered{" "}
            <FaArrowRight className={styles.pillArrow} />
          </span>
        </div>
      </div>
    </div>
  );
};

const Marine6: React.FC = () => {
    const router = useRouter(); 
  
  return (
     <>
    <Navbar/>
    <div className={styles.wrapper}>
      {/* Back */}
      <button className={styles.back}>
        <FaArrowLeft size={16}   onClick={() => router.push("Marine5")}/>
        Back
      </button>

      <div className={styles.container}>
        {/* Left */}
        <div className={styles.left}>
          {/* Success Banner + Selected Plan */}
          <div className={styles.successWrap}>
            <div className={styles.ribbon}>
              <span className={styles.ribbonIcon}>
                <FaCheckCircle />
              </span>
              <p className={styles.ribbonText}>
                Thanks for choosing <strong>ZANIFEST</strong> for your Marine
                Insurance. We are finalizing the chosen quote with the insurer.
                Our relationship manager will call you to guide you along.
              </p>
            </div>

            <div className={styles.selectedCard}>
              <div className={styles.selRow}>
                <div className={styles.selLogoBox}>
                  <Image
                    src={chola}
                    alt="Chola MS"
                    className={styles.selLogo}
                  />
                </div>

                <div className={styles.selMid}>
                  <div className={styles.metaLabel}>Plan name</div>
                  <div className={styles.metaValue}>All Risk Cover</div>
                </div>

                <div className={styles.selRight}>
                  <div className={styles.metaLabel}>Sum Insured</div>
                  <div className={styles.metaValue}>{`₹ 54,45,556`}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section title */}
          <h4 className={styles.subTitle}>
            Here are some other similar plans, you can buy instantly
          </h4>

          {/* ✅ Render policy cards */}
          {policies.map((policy, index) => (
            <PolicyCard key={index} {...policy} />
          ))}
        </div>

        {/* Right */}
        <aside className={styles.right}>
          <div className={styles.helpBox}>
            <Image
              src={agent}
              alt="advisor"
              width={88}
              height={88}
              className={styles.agent}
            />
            <h3 className={styles.helpTitle}>We’re glad to help you!</h3>
            <p className={styles.helpText}>
              Our advisor will call you at your preferred time for your Marine
              Insurance.
            </p>

            <button className={styles.scheduleBtn}>
              <MdOutlineSchedule size={18} />
              Schedule callback
            </button>

            <button className={styles.callBtn}>
              <FaPhoneAlt size={16} />
              Call Us
            </button>
          </div>
        </aside>
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default Marine6;
