"use client";
import React from "react";
import styles from "@/styles/pages/Home/homeinsurance3.module.css";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";


type Policy = {
  id: string;
  logo: StaticImageData;   
  brandAlt: string;
  product: string;
  term: string;
  featuresCount: number;
  addonsText: string;
  pricePerMonth: string;
  oneTimeText: string;
};

import chola from "@/assets/home/chola ms.png";
import hdfc from "@/assets/pageImages/hdfc.png";
import sbi from "@/assets/pageImages/sbi.png";
import reliance from "@/assets/pageImages/reliance.png";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const policies: Policy[] = [
  {
    id: "chola",
    logo: chola,
    brandAlt: "Chola",
    product: "Bharat Griha Raksha",
    term: "10 years",
    featuresCount: 23,
    addonsText: "Free Addons Available",
    pricePerMonth: "₹ 69/month",
    oneTimeText: "One Time Payment for 10 years: ₹ 8,260",
  },
  {
    id: "hdfc",
    logo: hdfc,
    brandAlt: "HDFC",
    product: "Bharat Griha Raksha",
    term: "10 years",
    featuresCount: 23,
    addonsText: "3 Addons Available",
    pricePerMonth: "₹ 71/month",
    oneTimeText: "One Time Payment for 10 years: ₹ 8,496",
  },
  {
    id: "sbi",
    logo: sbi,
    brandAlt: "SBI",
    product: "Bharat Griha Raksha",
    term: "10 years",
    featuresCount: 21,
    addonsText: "No Addon Available",
    pricePerMonth: "₹ 73/month",
    oneTimeText: "One Time Payment for 10 years: ₹ 8,732",
  },
  {
    id: "reliance",
    logo: reliance,
    brandAlt: "Reliance",
    product: "Bharat Griha Raksha",
    term: "10 years",
    featuresCount: 20,
    addonsText: "1 Addon Available",
    pricePerMonth: "₹ 81/month",
    oneTimeText: "One Time Payment for 10 years: ₹ 9,753",
  },
];

const Homeinsurance3: React.FC = () => {
    const router = useRouter();
  
  return (
    <>
    <Navbar/>
    <div className={styles.container}>
    <aside className={styles.sidebar}>
  <div className={styles.summaryBox}>
    <h3 className={styles.title}>Summary</h3>

    {/* Covered Section */}
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h4>Covered</h4>
      </div>
      <p>
        House(₹33.33 Lakhs)
      </p>
      <p>
        Household Items(₹16.67 Lakhs)
        <a className={styles.edit}>Edit</a>
      </p>
    </div>

    {/* Location Section */}
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h4>Location</h4>
        <a className={styles.edit}>Edit</a>
      </div>
      <p>Kutch</p>
    </div>
  </div>
</aside>


      {/* ===== RIGHT POLICY LIST ===== */}
      <main className={styles.mainContent}>
        {/* Filters Row */}
        <div className={styles.filters}>
          <select aria-label="Policy Term">
            <option>Policy Term: 10 years</option>
          </select>
          <select aria-label="Construction Year">
            <option>Construction Year: 2020-25</option>
          </select>
          <label className={styles.checkbox}>
            <input type="checkbox" /> Save upto 25%
          </label>
        </div>

        {/* Policy Cards */}
        <div className={styles.policyList}>
          {policies.map((p) => (
            <div className={styles.policyCard} key={p.id}>
              {/* Top row */}
              <div className={styles.cardTop}>
                <div className={styles.brand}>
                  <Image src={p.logo} alt={p.brandAlt} width={80} height={40} />
                  <h3>{p.product}</h3>
                </div>

                <div className={styles.term}>
                  <span className={styles.muted}>Policy Term</span>
                  <strong>{p.term}</strong>
                </div>

                <div className={styles.priceWrap}>
                  <span className={styles.pricePill}            onClick={() => router.push("Homeinsurance4")}
>{p.pricePerMonth}</span>
                  <div className={styles.oneTime}>{p.oneTimeText}</div>
                </div>
              </div>

              {/* Bottom row */}
              <div className={styles.cardBottom}>
                <button className={styles.infoBlock} type="button">
                  <span className={`${styles.icon} ${styles.star}`} />
                  <div className={styles.infoText}>
                    <span className={styles.label}>Features</span>
                    <strong>{p.featuresCount} Included</strong>
                  </div>
                  <span className={styles.chev}>›</span>
                </button>

                <button className={styles.infoBlock} type="button">
                  <span className={`${styles.icon} ${styles.addon}`} />
                  <div className={styles.infoText}>
                    <span className={styles.label}>Addons</span>
                    <strong>{p.addonsText}</strong>
                  </div>
                  <span className={styles.chev}>›</span>
                </button>

                <label className={`${styles.infoBlock} ${styles.compareBlock}`}>
                  <input type="checkbox" />
                  <span>Add to Compare</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
    <Footer/>
    </>
  );
};

export default Homeinsurance3;
