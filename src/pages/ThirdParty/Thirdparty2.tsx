"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/Thirdparty/thirdparty2.module.css";
import { FiCheckCircle, FiFilter, FiX } from "react-icons/fi";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Images
import digit from "@/assets/pageImages/digit.png";
import liberty from "@/assets/pageImages/liberty.png";
import zurich from "@/assets/pageImages/zurich kotak.png";
import agent from "@/assets/health/manicon.webp";

const Thirdparty2: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  return (
    <div>
      <Navbar />
      <div className={styles.wrapper}>
        {/* ===== Mobile Filter Toggle Button ===== */}
        <button
          className={styles.mobileFilterBtn}
          onClick={() => setShowFilters(true)}
        >
          <FiFilter size={18} className={styles.filtericons} />
          {/* Filters */}
        </button>

        {/* ===== Left Sidebar (with mobile toggle) ===== */}
        <aside
          className={`${styles.sidebar} ${
            showFilters ? styles.sidebarOpen : ""
          }`}
        >
          <div className={styles.sidebarHeader}>
            <h4>Filters</h4>
            <button
              className={styles.closeBtn}
              onClick={() => setShowFilters(false)}
            >
              <FiX size={20} />
            </button>
          </div>

          <div className={styles.carInfo}>
            <h3>TATA ALTROZ</h3>
            <p>DL4CAD4444 | 2020 | Petrol</p>
            <a href="#">Edit Car</a>
            <div className={styles.carDetails}>
              <p>
                IDV Cover (Insured Value): <b>Select IDV</b>
              </p>
              <p>
                No Claim Bonus (NCB): <b>50%</b>
              </p>
              <p>
                Policy Expiry Date: <b>5-Aug-2025</b>
              </p>
            </div>
          </div>

          <div className={styles.filterBox}>
            <h4>Sort & Filter</h4>

            <div className={styles.filterSection}>
              <h5>Plan type</h5>
              <label>
                <input type="checkbox" /> Comprehensive/Package plans
              </label>
              <label>
                <input type="checkbox" /> Third Party plans
              </label>
            </div>

            <div className={styles.filterSection}>
              <h5>Addons</h5>
              <label>
                <input type="checkbox" /> Zero Depreciation{" "}
                <span className={styles.mustBuy}>Must Buy</span>
              </label>
              <label>
                <input type="checkbox" /> 24x7 Roadside Assistance
              </label>
              <label>
                <input type="checkbox" /> Engine Protection Cover
              </label>
              <label>
                <input type="checkbox" /> Consumables
              </label>
              <label>
                <input type="checkbox" /> Key & Lock Replacement
              </label>
              <a href="#">See all</a>
            </div>

            <div className={styles.filterSection}>
              <h5>Deductibles</h5>
            </div>
            <div className={styles.filterSection}>
              <h5>Accident covers</h5>
            </div>
            <div className={styles.filterSection}>
              <h5>Accessories cover</h5>
            </div>
          </div>
        </aside>

        {/* ===== Main Content ===== */}
        <main className={styles.mainContent}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${styles.active}`}>
              Complete Protection
            </button>
            <button className={styles.tab}>Drive Less?</button>
            <button className={styles.tab}>Discount plans</button>
          </div>

          {/* Third Party Plans */}
          <h3 className={styles.sectionTitle}>
            16 Third Party plans{" "}
            <span className={styles.priceTag}>@ ₹3416</span>
          </h3>
          <p className={styles.sectionSub}>Cover losses to third party only</p>

          <div className={styles.planCard}>
            <div className={styles.planLeft}>
              <Image className={styles.img} src={digit} alt="Digit Logo" />
              <div className={styles.planText}>
                <p
                  className={styles.planType}
                  
                >
                  Third Party
                </p>
                <p className={styles.greenText}>Buy without inspection!</p>
              </div>
            </div>
            <div className={styles.planRight}>
              <p className={styles.planPrice}onClick={() => router.push("Thirdparty3")}>₹3,416</p>
              <button className={styles.compareBtn}>Add to Compare</button>
            </div>
          </div>

          <div className={styles.planCard}>
            <div className={styles.planLeft}>
              <Image
                className={styles.img}
                src={zurich}
                alt="Zurich Kotak Logo"
              />
              <div className={styles.planText}>
                <p className={styles.planType}>Third Party</p>
                <p className={styles.greenText}>Buy without inspection!</p>
              </div>
            </div>
            <div className={styles.planRight}>
              <p
                className={styles.planPrice}
                onClick={() => router.push("Thirdparty3")}
              >
                ₹3,416
              </p>
              <button className={styles.compareBtn}>Add to Compare</button>
            </div>
          </div>

          <button className={styles.showMore}>Show 20 more plans</button>

          {/* Comprehensive Plans */}
          <h3 className={styles.sectionTitle}>14 Comprehensive plans</h3>
          <p className={styles.sectionSub}>
            Require video of car after payment. Cover damages to both your car &
            third party.
          </p>

          <div className={styles.planCard}>
            <div className={styles.planLeft}>
              <Image className={styles.img} src={liberty} alt="Liberty Logo" />
              <div className={styles.planText}>
                <p className={styles.planType}>IDV Cover: ₹3,05,964</p>
                <p className={styles.orangeText}>
                  Car video inspection required
                </p>
              </div>
            </div>
            <div className={styles.planRight}>
              <p
                className={styles.planPrice}
                onClick={() => router.push("Thirdparty3")}
              >
                ₹3,943
              </p>
              <button className={styles.compareBtn}>View Coverage</button>
            </div>
          </div>
        </main>

        {/* ===== Right Sidebar ===== */}
        <aside className={styles.rightSidebar}>
          <div className={styles.benefitsBox}>
            <h4>Exclusive Benefits</h4>
            <ul>
              <li>
                <FiCheckCircle /> 24x7 claim support, even on holidays
              </li>
              <li>
                <FiCheckCircle /> Get a dedicated claims manager
              </li>
              <li>
                <FiCheckCircle /> Ensure you get highest claim payout
              </li>
              <li>
                <FiCheckCircle /> 1000+ Network Garages across India
              </li>
              <li>
                <FiCheckCircle /> Quick repair within 5 days
              </li>
              <li>
                <FiCheckCircle /> Car pick-up and drop on all 365 days
              </li>
            </ul>
            <div className={styles.agentBox}>
              <Image
                src={agent}
                alt="Agent Icon"
                width={40}
                height={40}
                className={styles.agentImg}
              />
              <p>
                <b>Amit Sharma</b>, 98*****240
              </p>
            </div>
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  );
};

export default Thirdparty2;
