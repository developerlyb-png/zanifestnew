// src/pages/carinsurance3.tsx
import { useState, useEffect } from "react";
import styles from "@/styles/pages/carinsurance3.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { FaFilter, FaPlus, FaVideo, FaTrophy, FaCircle, FaBars, FaTimes } from "react-icons/fa";
import { RiArrowRightWideLine } from "react-icons/ri";
import UserDetails from "@/components/ui/UserDetails";
import {useRouter} from 'next/router';
import { IoIosArrowBack } from "react-icons/io";
import Image from "next/image";
import img from "@/assets/images.jpeg";

const CarInsurance3 = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router =useRouter();
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

  return (
    <div>
      <UserDetails />
      <Navbar />

      {isMobile && (
        <div className={styles.mobileHeader}>
          <button className={styles.sidebarToggle} onClick={toggleSidebar}>
            {sidebarOpen ? <FaTimes /> : <FaFilter />
}
          </button>
        </div>
      )}

      <div className={styles.container}>
        {isMobile && sidebarOpen && (
          <div className={styles.backdrop} onClick={closeSidebar}></div>
        )}

        <div
          className={`${styles.sidebarWrapper} ${
            isMobile ? (sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed) : ""
          }`}
           >
          {/* Close button inside sidebar */}
          {isMobile && (
            <div className={styles.closeSidebar}>
              <button onClick={closeSidebar} className={styles.closeButton}>
                <FaTimes />
              </button>
            </div>
          )}

          {/* Sidebar 1 - Vehicle Info */}
          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Vehicle Info</h3>
            <div className={styles.vehicleDetails}>
              <div className={styles.skoda}>
                <div>
                  <h3>SKODA SLAVIA</h3>
                  <p>DL10CV4556 | 2023 | Petrol</p>
                </div>
                <div>
                  <p><span className={styles.editCar}>Edit Car</span></p>
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
                <p>25% <RiArrowRightWideLine className={styles.rightArrow} /></p>
              </div>
              <div className={styles.detailRow}>
                <p>OD Expiry Date</p>
                <p>13-Jun-2025 <RiArrowRightWideLine className={styles.rightArrow} /></p>
              </div>
            </div>
          </div>

          {/* Sidebar 2 - Filters */}
          <div className={styles.sidebar1}>
            <h3 className={styles.sidebarTitle}>Filters</h3>
            <div className={styles.filters}>
              <h4><FaFilter className={styles.icon} /> Sort & Filter</h4>
              <div className={styles.filterSection1}>
                <h5>Addons</h5>
                <label><input type="checkbox" /> Zero Depreciation</label>
                <label><input type="checkbox" /> 24x7 Roadside Assistance</label>
                <label><input type="checkbox" /> Engine Protection Cover</label>
                <label><input type="checkbox" /> Consumables</label>
                <label><input type="checkbox" /> Key & Lock Replacement</label>
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
 {/* <button
    className={styles.backBtn}
    onClick={() => router.push("./carinsurance5")} // or use router.back() for dynamic back
  >
    <IoIosArrowBack className={styles.arrowBack} />
  </button> */}
        {/* Main Content */}
        <div className={styles.mainContent}>
          <h2>13 Own Damage plans</h2>
          <p>Require video of car after payment. Cover damages to your car only.</p>

          {[1, 2, 3].map((_, idx) => (
            <div key={idx} className={styles.planCard}>
              <div className={styles.planHeader}>
                <FaTrophy className={styles.trophy} />
                Cashless Claim Guarantee
              </div>
              <div className={styles.planDetails}>
                <Image src={img} alt="TATA AIG" className={styles.logo} />
                <div>
                  <div style={{ color: "#5a5959" }}>
                    IDV Cover <strong>₹10,74,428</strong>
                  </div>
                </div>
                <div className={styles.actions}>
                  <div className={styles.price} onClick={()=>{router.push('/cart/carinsurancecart')}}>₹2,520 →</div>
                </div>
              </div>
              <div className={styles.inspectionNote}>
                <FaVideo className={styles.videoIcon} /> Car video inspection required
              </div>
              <div className={styles.cashless}>
                <div className={styles.garages}>129 Cashless Garages</div>
                <div className={styles.coverage}><a href="#">View Coverage</a></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CarInsurance3;
