"use client";
import React, { useState } from "react";
import HomeSection from "@/components/superadminsidebar/homesection"; 
import styles from "@/styles/pages/Homesection.module.css";
import AllInsuranceCAdmin from "./AllInsuranceAdmin";
import FAQAdmin from "./FAQAdmin";
import DemoAdmin from "./DemoAdmin";
import BestServicesAdmin from "./BestServicesAdmin";
// import HowWorksAdmin from "./HowWorksAdmin";
import FeedbackAdmin from "./feedbackadmin";
import PartnerAdmin from "./partneradmin";
import AdminInsurancePage from "./carinsuranceadmin";
import HowWorksAdmin from "./HowWorksAdmin";




const MainPage = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const renderBackButton = () => (
    <button
      className={styles.backButton}
      onClick={() => setActiveSection(null)}
    >
      ← Back
    </button>
  );

  return (
    <div className={`${styles.container} ${styles.homeDashboard}`}>
      {!activeSection ? (
        <>
          <h1 className={styles.heading}>Home Section</h1>

          {/* Options List */}
          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("carousel")}
          >
            Carousel Images
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("insurance")}
          >
            Click to buy an insurance
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("why")}
          >
            Why is ZANIFEST India's go-to for insurance?
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("best")}
          >
            Best Service
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("partner")}
          >
            Insurance Partner
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("services")}
          >
            We're Giving all the Insurance Services to you
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("how")}
          >
            How it Works Section
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("testimonials")}
          >
            What Our Customers Are Saying?
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("faq")}
          >
            Frequently Asked Questions
          </div>
        </>
      ) : (
        <>
          {renderBackButton()}

          {/* Keep all Home section editors on the same design system. */}
          <div className={styles.sectionEditor}>
            {activeSection === "carousel" && <HomeSection />}
            {activeSection === "insurance" && <AdminInsurancePage />}
            {activeSection === "why" && <DemoAdmin />}
            {activeSection === "best" && <BestServicesAdmin />}
            {activeSection === "partner" && <PartnerAdmin />}
            {activeSection === "services" && <AllInsuranceCAdmin />}
            {activeSection === "how" && <HowWorksAdmin />}
            {activeSection === "testimonials" && <FeedbackAdmin />}
            {activeSection === "faq" && <FAQAdmin />}
          </div>
        </>
      )}
    </div>
  );
};

export default MainPage;
