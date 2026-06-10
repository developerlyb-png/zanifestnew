"use client";

import Image, { StaticImageData } from "next/image";
import React, { useState } from "react";
import {
  FiChevronDown,
  FiClock,
  FiChevronRight,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { FaFilter } from "react-icons/fa6";
import { useRouter } from "next/navigation"; // ✅ Added router for navigation
import styles from "@/styles/pages/Travel/travel4.module.css";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
// Local image assets
import tataLogo from "@/assets/travel/tataaig.jpeg";
import relianceLogo from "@/assets/travel/tataaig.jpeg";
import iciciLogo from "@/assets/travel/tataaig.jpeg";
import bajajLogo from "@/assets/travel/tataaig.jpeg";

/* ---------- Types ---------- */
type PlanCardProps = {
  logo: StaticImageData;
  brand: string;
  plan: string;
  med: string;
  passport: string;
  baggage: string;
  price: string;
  lastBought: string;
  showMoreLink?: boolean;
};

/* ---------- Card ---------- */
const PlanCard: React.FC<PlanCardProps> = ({
  logo,
  brand,
  plan,
  med,
  passport,
  baggage,
  price,
  lastBought,
  showMoreLink = false,
}) => {
  const router = useRouter(); // ✅ Router inside component

  return (
    <div className={styles.planCard}>
      {/* Left: logo + optional "1 more plan" */}
      <div className={styles.cardColLogo}>
        <div className={styles.logoWrap}>
          <Image src={logo} alt={`${brand} logo`} className={styles.logoImg} />
        </div>
        {showMoreLink && (
          <button
            type="button"
            className={styles.morePlans}
             // ✅ Navigation
          >
            1 more plan <FiChevronDown />
          </button>
        )}
      </div>

      {/* Middle: name + features split into rows */}
      <div className={styles.cardColInfo}>
        <h3 className={styles.brand}>{brand}</h3>

        {/* Row 1: Plan + Med + Passport */}
        <div className={styles.infoRow}>
          <p className={styles.planName}>{plan}</p>
          <div className={styles.feature}>
            <span className={styles.featureLabel}>Medical Expenses</span>
            <span className={styles.featureValue}>{med}</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureLabel}>Loss of Passport</span>
            <span className={styles.featureValue}>{passport}</span>
          </div>
        </div>

        {/* Row 2: Baggage + Compare + View all */}
        <div className={styles.infoRow}>
          <div className={styles.feature}>
            <span className={styles.featureLabel}>Baggage Loss</span>
            <span className={styles.featureValue}>{baggage}</span>
          </div>

          <div className={styles.actions}>
            <label className={styles.compareCheck}>
              <input type="checkbox" />
              <span>Compare</span>
            </label>

            <button className={styles.viewFeatures} type="button">
              View all features <FiChevronRight />
            </button>
          </div>
        </div>

        <div className={styles.lastBoughtPill}>
          <FiClock className={styles.pillIcon} />
          Last policy bought {lastBought}
        </div>
      </div>

      {/* Right: price + CTA */}
      <div className={styles.cardColPrice}>
        <span className={styles.priceCaption}>Premium (GST included)</span>
        <div className={styles.price}>{price}</div>
        <button
          className={styles.cta}
          type="button"
          onClick={() => router.push("travel5")} // ✅ Navigation
        >
          Proceed
        </button>
      </div>
    </div>
  );
};

/* ---------- Page ---------- */
const PlansPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        {/* ===== Mobile Toggle Button ===== */}
        <button
          className={styles.mobileToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)} >
          {sidebarOpen ? <FiX/> : <FaFilter />}
        </button>

        {/* ===== Left side ===== */}
        <aside
          className={`${styles.sidebar} ${
            sidebarOpen ? styles.sidebarOpen : ""
          }`}
        >
          <div className={styles.sortCard}>
            <div className={styles.sortHeader}>
              <span>Sort by</span>
              <FiChevronDown className={styles.arrow} />
            </div>
          </div>

          <div className={styles.filtersCard}>
            <div className={styles.filtersHeader}>Filters</div>

            {/* Plan Type */}
            <div className={styles.filterBlock}>
              <button className={styles.blockHeader} type="button">
                <span>Plan Type</span>
                <FiChevronDown className={styles.arrow} />
              </button>

              <div className={styles.blockBody}>
                <label
                  className={[styles.radio, styles.radioActive].join(" ")}
                >
                  <input type="radio" name="planType" defaultChecked />
                  <span className={styles.radioDot} />
                  Single trip plans
                </label>
                <label className={styles.radio}>
                  <input type="radio" name="planType" />
                  <span className={styles.radioDot} />
                  Frequent flyer plans
                </label>
                <label className={styles.radio}>
                  <input type="radio" name="planType" />
                  <span className={styles.radioDot} />
                  Student plans
                </label>
              </div>
            </div>

            {/* Collapsed blocks */}
            {[
              "Sum Insured",
              "Insurer",
              "Visa Type",
              "Coverages",
              "Purpose of Travel",
            ].map((title) => (
              <div className={styles.filterBlock} key={title}>
                <button className={styles.blockHeader} type="button">
                  <span>{title}</span>
                  <FiChevronDown className={styles.arrow} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* ===== Right side ===== */}
        <main className={styles.content}>
          <h1 className={styles.title}>Showing 21 plans for 1 member</h1>

          <PlanCard
            logo={tataLogo}
            brand="Tata AIG"
            plan="International Plus Gold"
            med="$250,000"
            passport="$250"
            baggage="$300"
            price="₹2,677"
            lastBought="20 hours ago"
            showMoreLink
          />

          <PlanCard
            logo={relianceLogo}
            brand="Reliance"
            plan="Travel Care Individual"
            med="$250,000"
            passport="$300"
            baggage="$1,200"
            price="₹2,061"
            lastBought="48 minutes ago"
          />

          {/* Frequently Compared rail */}
          <section className={styles.frequentWrap}>
            <h2 className={styles.frequentTitle}>Frequently Compared</h2>

            <div className={styles.compareRow}>
              {/* Comparison Group 1 */}
              <div className={styles.compareGroup}>
                <div className={styles.compareCard}>
                  {/* Left Card */}
                  <div
                    className={[
                      styles.railItem,
                      styles.railItemBlueTop,
                    ].join(" ")}
                  >
                    <div className={styles.railLogo}>
                      <Image src={tataLogo} alt="Tata AIG" />
                    </div>
                    <div className={styles.railBrand}>Tata AIG</div>
                    <div className={styles.railPlan}>
                      International Plus Gold
                    </div>
                    <div className={styles.railMeta}>
                      <span>Medical Expenses</span>
                      <b>
                        <br />$250,000
                      </b>
                    </div>
                  </div>

                  <div className={styles.vsBadgeInner}>VS</div>

                  {/* Right Card */}
                  <div
                    className={[
                      styles.railItem,
                      styles.railItemActive,
                    ].join(" ")}
                  >
                    <div className={styles.railLogo}>
                      <Image src={iciciLogo} alt="ICICI" />
                    </div>
                    <div className={styles.railBrand}>ICICI Lombard</div>
                    <div className={styles.railPlan}>Trip Secure Plus</div>
                    <div className={styles.railMeta}>
                      <span>Medical Expenses</span>
                      <b>
                        <br />$250,000
                      </b>
                    </div>
                  </div>
                </div>
                <button className={styles.railCompareBtnFull}>Compare</button>
              </div>

              {/* Comparison Group 2 */}
              <div className={styles.compareGroup}>
                <div className={styles.compareCard}>
                  {/* Left Card */}
                  <div
                    className={[
                      styles.railItem,
                      styles.railItemBlueTop,
                    ].join(" ")}
                  >
                    <div className={styles.railLogo}>
                      <Image src={relianceLogo} alt="Reliance" />
                    </div>
                    <div className={styles.railBrand}>Reliance</div>
                    <div className={styles.railPlan}>Value Care</div>
                    <div className={styles.railMeta}>
                      <span>Medical Expenses </span>
                      <b>
                        {" "}
                        <br />$250,000
                      </b>
                    </div>
                  </div>

                  <div className={styles.vsBadgeInner}>VS</div>

                  {/* Right Card */}
                  <div
                    className={[
                      styles.railItem,
                      styles.railItemActive,
                    ].join(" ")}
                  >
                    <div className={styles.railLogo}>
                      <Image src={bajajLogo} alt="Bajaj Allianz" />
                    </div>
                    <div className={styles.railBrand}>Bajaj Allianz</div>
                    <div className={styles.railPlan}>
                      Travel Ace Lite - Gold
                    </div>
                    <div className={styles.railMeta}>
                      <span>Medical Expenses</span>
                      <b>
                        <br />$250,000
                      </b>
                    </div>
                  </div>
                </div>
                <button className={styles.railCompareBtnFull}>Compare</button>
              </div>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default PlansPage;
