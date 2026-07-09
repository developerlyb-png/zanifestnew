// src/pages/carinsurance/carinsurance3.tsx
import { useState, useEffect } from "react";
import styles from "@/styles/pages/carinsurance3.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import {
  FaFilter,
  FaPlus,
  FaVideo,
  FaTrophy,
  FaCircle,
  FaTimes,
} from "react-icons/fa";
import { RiArrowRightWideLine } from "react-icons/ri";
import UserDetails from "@/components/ui/UserDetails";
import { useRouter } from "next/router";
import Image from "next/image";
import zunoLogo from "@/assets/images.jpeg"; // TODO: replace with a Zuno logo asset

const CarInsurance3 = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real quote data
  const [plan, setPlan] = useState<any>(null);
  const [quoteInput, setQuoteInput] = useState<any>(null);

  const router = useRouter();

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

  // Load the real Zuno quote saved by the View Prices step
  useEffect(() => {
    try {
      const p = localStorage.getItem("selectedQuote");
      const q = localStorage.getItem("carQuoteInput");
      if (p && p !== "undefined") setPlan(JSON.parse(p));
      if (q && q !== "undefined") setQuoteInput(JSON.parse(q));
    } catch (e) {
      console.log("PLAN LOAD ERROR", e);
    }
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const inr = (n: any) =>
    n == null ? "--" : "₹" + Math.round(Number(n)).toLocaleString("en-IN");

  return (
    <div>
      <UserDetails />
      <Navbar />

      {isMobile && (
        <div className={styles.mobileHeader}>
          <button className={styles.sidebarToggle} onClick={toggleSidebar}>
            {sidebarOpen ? <FaTimes /> : <FaFilter />}
          </button>
        </div>
      )}

      <div className={styles.container}>
        {isMobile && sidebarOpen && (
          <div className={styles.backdrop} onClick={closeSidebar}></div>
        )}

        <div
          className={`${styles.sidebarWrapper} ${
            isMobile
              ? sidebarOpen
                ? styles.sidebarOpen
                : styles.sidebarClosed
              : ""
          }`}
        >
          {isMobile && (
            <div className={styles.closeSidebar}>
              <button onClick={closeSidebar} className={styles.closeButton}>
                <FaTimes />
              </button>
            </div>
          )}

          {/* Sidebar 1 - Vehicle Info (REAL DATA) */}
          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Vehicle Info</h3>
            <div className={styles.vehicleDetails}>
              <div className={styles.skoda}>
                <div>
                  <h3>
                    {quoteInput
                      ? `${quoteInput.make} ${quoteInput.model}`
                      : "Your Vehicle"}
                  </h3>
                  <p>
                    {quoteInput
                      ? `${quoteInput.variant || ""}`
                      : ""}
                  </p>
                  <p>
                    {quoteInput
                      ? `${quoteInput.registrationDate?.slice(0, 4) || ""} | ${
                          quoteInput.fuelType || ""
                        }`
                      : ""}
                  </p>
                </div>
                <div>
                  <p>
                    <span
                      className={styles.editCar}
                      onClick={() => router.push("/carinsurance")}
                    >
                      Edit Car
                    </span>
                  </p>
                </div>
              </div>
              <hr />
              <div className={styles.detailRow}>
                IDV Cover (Insured Value)
                <span className={styles.selectIdv}>{inr(plan?.idv)}</span>
                <FaCircle className={styles.circle} />
              </div>
              <div className={styles.detailRow}>
                <p>RTO</p>
                <p>
                  {quoteInput?.rtoLocationName || "--"}{" "}
                  <RiArrowRightWideLine className={styles.rightArrow} />
                </p>
              </div>
              <div className={styles.detailRow}>
                <p>Policy Type</p>
                <p>
                  Own Damage{" "}
                  <RiArrowRightWideLine className={styles.rightArrow} />
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar 2 - Filters (kept; addons wire up at fullQuote stage) */}
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

        {/* Main Content — REAL ZUNO PLAN */}
        <div className={styles.mainContent}>
          {plan ? (
            <>
              <h2>1 plan available</h2>
              <p>Covers damages to your car. Premium includes GST.</p>

              <div className={styles.planCard}>
                <div className={styles.planHeader}>
                  <FaTrophy className={styles.trophy} />
                  Zuno General Insurance
                </div>
                <div className={styles.planDetails}>
                  <Image
                    src={zunoLogo}
                    alt="Zuno General Insurance"
                    className={styles.logo}
                  />
                  <div>
                    <div style={{ color: "#5a5959" }}>
                      IDV Cover <strong>{inr(plan.idv)}</strong>
                    </div>
                    <div style={{ color: "#5a5959", fontSize: "0.85em" }}>
                      Net {inr(plan.netPremium)} + GST {inr(plan.gst)}
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <div
                      className={styles.price}
                      onClick={() => {
                        router.push("/cart/carinsurancecart");
                      }}
                    >
                      {inr(plan.grossPremium)} →
                    </div>
                  </div>
                </div>
                <div className={styles.inspectionNote}>
                  <FaVideo className={styles.videoIcon} /> Car video inspection
                  may be required
                </div>
                <div className={styles.cashless}>
                  <div className={styles.garages}>Zuno Cashless Garages</div>
                  <div className={styles.coverage}>
                    <a href="#">View Coverage</a>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2>No quote found</h2>
              <p>
                Please go back and search your vehicle to get a quote.
              </p>
              <button
                className={styles.price}
                onClick={() => router.push("/carinsurance")}
              >
                Search vehicle
              </button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CarInsurance3;