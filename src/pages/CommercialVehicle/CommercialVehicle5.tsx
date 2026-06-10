"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/CommercialVehicle5.module.css";

import { FiPhoneCall } from "react-icons/fi";
import { FaCircle, FaFilter, FaPlus } from "react-icons/fa";
import { RiArrowRightWideLine } from "react-icons/ri";
import Image from "next/image";
import agent from "@/assets/health/manicon.webp";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import shriram from "@/assets/CommercialVehicle/shriram.png";
import icic from "@/assets/CommercialVehicle/ICICIlombard.png";
import { IoIosCloseCircle } from "react-icons/io";
import { useRouter } from "next/navigation"; // ✅ Router import


const CommercialVehicle5: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter(); // ✅ Router init

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  // ✅ Function to navigate
  const goToNextPage = () => {
    router.push("CommercialVehicle6");
  };

  return (
    <>
      <Navbar />

      <div className={styles.container}>
        {/* 🔹 Sidebar Backdrop (only in mobile) */}
        {isMobile && sidebarOpen && (
          <div className={styles.backdrop} onClick={closeSidebar}></div>
        )}

        <div className={styles.wrapper}>
          {/* ===== LEFT COLUMN (Sidebar) ===== */}
          <div
            className={`${styles.sidebarWrapper} ${
              isMobile
                ? sidebarOpen
                  ? styles.sidebarOpen
                  : styles.sidebarClosed
                : ""
            }`}
          >
            <div className={styles.sidebar}>
              <h3 className={styles.sidebarTitle}>Vehicle Info</h3>
              <div className={styles.vehicleDetails}>
                <div className={styles.skoda}>
                  <div>
                    <h3>SKODA SLAVIA</h3>
                    <p>DL10CV4556 | 2023 | Petrol</p>
                  </div>
                  <div>
                    <p>
                      <span className={styles.editCar}>Edit Car</span>
                    </p>
                  </div>
                </div>
                <hr />
                <div className={styles.detailRow}>
                  IDV Cover (Insured Value)
                  <span className={styles.selectIdv}>Select IDV</span>
                  <FaCircle className={styles.circle} />
                </div>
                <div className={styles.detailRow}>
                  <p>No Claim Bonus (NCB)</p>
                  <p>
                    25% <RiArrowRightWideLine className={styles.rightArrow} />
                  </p>
                </div>
                <div className={styles.detailRow}>
                  <p>OD Expiry Date</p>
                  <p>
                    13-Jun-2025{" "}
                    <RiArrowRightWideLine className={styles.rightArrow} />
                  </p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className={styles.sidebar1}>
              <h3 className={styles.sidebarTitle}>Filters</h3>
              <div className={styles.filters}>
                <h4>
                  <FaFilter className={styles.icon} /> Sort & Filter
                </h4>
                <div className={styles.filterSection1}>
                  <h5>Addons</h5>
                  <label>
                    <input type="checkbox" /> Zero Depreciation
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
                  <p className={styles.seeAll}>See all ▼</p>
                </div>

                <div className={styles.filterSection}>
                  <h5>Sort by</h5>
                  <FaPlus className={styles.plusIcon} />
                </div>
                <div className={styles.filterSection}>
                  <h5>Deductibles</h5>
                  <FaPlus className={styles.plusIcon} />
                </div>
                <div className={styles.filterSection}>
                  <h5>Accessories cover</h5>
                  <FaPlus className={styles.plusIcon} />
                </div>
              </div>
            </div>
          </div>

          {/* ===== MIDDLE COLUMN ===== */}
          <div className={styles.middle}>
            {/* 🔹 Mobile Header with Toggle */}
            {isMobile && (
              <div className={styles.mobileHeader}>
                <button className={styles.sidebarToggle} onClick={toggleSidebar}>
                  {sidebarOpen ? <IoIosCloseCircle /> : <FaFilter />}
                </button>
              </div>
            )}

            <h2 className={styles.heading}>2 Third Party plans</h2>
            <p className={styles.subtext}>
              cover damages caused to third party only and not your vehicle
            </p>

            {/* Third Party Cards */}
            <div className={styles.cardGroup}>
              <div className={styles.card}>
                <div className={styles.cardContent}>
                  <div className={styles.logoSection}>
                    <Image
                      src={icic}
                      alt="ICICI Lombard"
                      className={styles.logo}
                      height={70}
                      width={90}
                    />
                    <div>
                      <p className={styles.title}>Third Party</p>
                      <p className={styles.link}>Buy Without Inspection</p>
                    </div>
                  </div>
                  {/* ✅ Navigate on click */}
                  <button className={styles.button} onClick={goToNextPage}>
                    ₹4,487 →
                  </button>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardContent}>
                  <div className={styles.logoSection}>
                    <Image
                      src={shriram}
                      alt="Shriram"
                      className={styles.logo}
                      height={90}
                      width={100}
                    />
                    <div>
                      <p className={styles.title}>Third Party</p>
                      <p className={styles.link}>Buy Without Inspection</p>
                    </div>
                  </div>
                  <button className={styles.button} onClick={goToNextPage}>
                    ₹4,487 →
                  </button>
                </div>
              </div>
            </div>

            {/* Package Plans */}
            <h2 className={styles.heading}>2 Package plans</h2>
            <p className={styles.subtext}>
              cover damages caused to your vehicle as well as third party
            </p>

            <div className={styles.cardGroup}>
              <div className={styles.packageCard}>
                <div className={styles.tagRow}>
                  <span className={styles.tagWarning}>
                    Requires Self-Video Inspection
                  </span>
                </div>
                <div className={styles.packageMain}>
                  <Image src={icic} alt="ICICI Lombard" height={90} width={100} />
                  <div className={styles.packageInfo}>
                    <p>
                      IDV Cover <br />
                      <span>₹ 29,980</span>
                    </p>
                    <p>
                      Claims Settled <br />
                      <span>99.7%</span>
                    </p>
                  </div>
                  <button className={styles.priceBtn} onClick={goToNextPage}>
                    ₹4,497 →
                  </button>
                </div>
                <div className={styles.extraInfo}>
                  <span>60% Advance Payment</span>
                  <span>Spot Claims Upto Rs. 3,00,000</span>
                </div>
                <div className={styles.packageFooter}>
                  <span></span>
                  <span>
                    <a href="#">3 Cashless garages</a> |{" "}
                    <a href="#">View Coverage</a>
                  </span>
                </div>
              </div>

              <div className={styles.packageCard}>
                <div className={styles.tagRow}>
                  <span className={styles.tagSuccess}>Buy Without Inspection</span>
                </div>
                <div className={styles.packageMain}>
                  <Image src={shriram} alt="Shriram" height={90} width={100} />
                  <div className={styles.packageInfo}>
                    <p>
                      IDV Cover <br />
                      <span>₹ 60,272</span>
                    </p>
                    <p>
                      Claims Settled <br />
                      <span>96%</span>
                    </p>
                  </div>
                  <button className={styles.priceBtn} onClick={goToNextPage}>
                    ₹4,891 →
                  </button>
                </div>
                <div className={styles.packageFooter}>
                  <span></span>
                  <span>
                    <a href="#">3 Cashless garages</a> |{" "}
                    <a href="#">View Coverage</a>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className={styles.right}>
            <div className={styles.benefitsBox}>
              <h4>Exclusive Benefits</h4>
              <ul>
                <li>₹440 Crores settled in claims</li>
                <li>Average claim settlement ratio is 98%</li>
                <li>24*7 claim support, even on holidays</li>
                <li>Priority Repairs for our customer</li>
                <li>Get assigned a dedicated manager</li>
              </ul>
              <div className={styles.agent}>
                <Image src={agent} alt="agent" />
                <div>
                  <p>Amit Sharma</p>
                  <span>98*****240</span>
                </div>
              </div>
            </div>

            <div className={styles.callBox}>
              <div className={styles.callContent}>
                <div className={styles.callText}>
                  <h4>Your best price could be just a call away</h4>
                  <p>Talk to our experts to avail it</p>
                </div>
                <div className={styles.callIcon}>
                  <Image src={agent} alt="Call Icon" />
                </div>
              </div>
              <button className={styles.callBtn}>
                <FiPhoneCall /> Get a callback
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CommercialVehicle5;
