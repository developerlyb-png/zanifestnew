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
      onClick={() => setActiveSection(null)}
      style={{
        marginBottom: "1rem",
        padding: "0.5rem 1rem",
        backgroundColor: "#f0f0f0",
        border: "1px solid #ccc",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      ← Back
    </button>
  );

  return (
    <div className={styles.container}>
      {!activeSection ? (
        <>
          <h1 className={styles.heading}>Home Section</h1>

          {/* Options List */}
          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("carousel")}
            style={listStyle}
          >
            Carousel Images
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("insurance")}
            style={listStyle}
          >
            Click to buy an insurance
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("why")}
            style={listStyle}
          >
            Why is ZANIFEST India's go-to for insurance?
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("best")}
            style={listStyle}
          >
            Best Service
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("partner")}
            style={listStyle}
          >
            Insurance Partner
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("services")}
            style={listStyle}
          >
            We're Giving all the Insurance Services to you
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("how")}
            style={listStyle}
          >
            How it Works Section
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("testimonials")}
            style={listStyle}
          >
            What Our Customers Are Saying?
          </div>

          <div
            className={styles.listDiv}
            onClick={() => setActiveSection("faq")}
            style={listStyle}
          >
            Frequently Asked Questions
          </div>
        </>
      ) : (
        <>
          {renderBackButton()}

          {/* Render section dynamically */}
          {activeSection === "carousel" && <HomeSection />}
          {activeSection === "insurance" && <AdminInsurancePage/>}
          {activeSection === "why" && <DemoAdmin/>}
          {activeSection === "best" && <BestServicesAdmin/>}
          {activeSection === "partner" && <PartnerAdmin/>}
          {activeSection === "services" && <AllInsuranceCAdmin/>}
          {activeSection === "how" &&  <HowWorksAdmin/>}
          {activeSection === "testimonials" && <FeedbackAdmin/>}
          {activeSection === "faq" && <FAQAdmin/>}
        </>
      )}
    </div>
  );
};

// Common style for list items
const listStyle: React.CSSProperties = {
  padding: "1rem",
  border: "1px solid #ccc",
  borderRadius: "8px",
  cursor: "pointer",
  marginTop: "1rem",
};

export default MainPage;
