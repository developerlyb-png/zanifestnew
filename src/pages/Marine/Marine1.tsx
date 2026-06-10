// marine1.tsx
"use client";

import React, { useState, useEffect } from "react";
import styles from "@/styles/pages/marine/marine.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";

// Assets
import tata from "@/assets/TATAAIGlogo.png";
import orientalinsurance from "@/assets/OrintalInsurance.png";
import sbi from "@/assets/sbi.png";
import hdfc from "@/assets/unitedindia.png";
import marine from "@/assets/marine/marine-prequote-bannerv2.webp";
import singletransit from "@/assets/pageImages/single-transit.svg";
import annualopen from "@/assets/pageImages/annual-open.svg";

// Icons
import {
  FaCheck,
  FaChevronDown,
  FaMobileAlt,
  FaShieldAlt,
  FaUserShield,
  FaWhatsapp,
} from "react-icons/fa";
import { MdArrowBackIos } from "react-icons/md";
import { TbCirclePercentageFilled } from "react-icons/tb";

// Components
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

// Auth Context
import { useAuth } from "@/context/AuthContext";

const Marine: React.FC = () => {
  const { user } = useAuth(); // ✅ get user email
  const router = useRouter();

  const [whatsapp, setWhatsapp] = useState(true);
  const [step, setStep] = useState(1);
  const [mobileNumber, setMobileNumber] = useState("+91 ");
  const [commodity, setCommodity] = useState("");
  const [coverType, setCoverType] = useState("single");
  const [shipmentType, setShipmentType] = useState("inland");
  const [showDropdown, setShowDropdown] = useState(false);

  // Commodity options
  const commodityOptions = [
    "New machinery or equipment for industrial use",
    "Iron & steel rods, metal pipes, tubes",
    "Electronic and white goods",
    "Automobiles",
    "All types of FMCG commodities",
    "Machinery machine tools spares duly packed/lashed",
    "All kinds of food like oils essence flavours and other various packed items",
    "Auto spare parts",
    "Graphite and marble",
  ];

  // Initialize AOS
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // Handle mobile input
  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    const prefix = "+91 ";
    if (!val.startsWith(prefix)) {
      setMobileNumber(prefix);
      return;
    }
    const digits = val.substring(prefix.length).replace(/\D/g, "").slice(0, 10);
    setMobileNumber(prefix + digits);
  };

  // Step 1 → Submit mobile number
  const handleViewPlans = async () => {
    const Number = mobileNumber.replace(/\s+/g, "");
    if (!/^(\+91)?[6-9]\d{9}$/.test(Number)) {
      alert("Invalid phone number");
      return;
    }

    await fetch("/api/p", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: Number, userEmail: user?.email || null }),
    });

    localStorage.setItem("phoneNumber", Number);
    setStep(2);
  };

  // Step 2 → Submit full data
  const handleContinueStep2 = async () => {
    if (!commodity) {
      alert("Please select a commodity type");
      return;
    }

  const payload = {
  phoneNumber: mobileNumber.replace(/\s+/g, ""),
  commodity,
  coverType,
  shipmentType,
  email: user?.email || null,    
};


   await fetch("/api/p", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phoneNumber: Number,
    email: user?.email || null 
  }),
});

    localStorage.setItem("commodity", commodity);
    localStorage.setItem("coverType", coverType);
    localStorage.setItem("shipmentType", shipmentType);
    router.push("./Marine5");
  };

  return (
    <>
      <Navbar />

      <section className={styles.container}>
        {/* LEFT SECTION */}
        <div className={styles.left}>
          <h4 className={styles.subheading}>Marine Insurance</h4>
          <h1 className={styles.heading}>
            <span className={styles.iconWrapper}>
              <TbCirclePercentageFilled />
            </span>
            Compare and Save <span className={styles.highlight}>upto 42%</span>
            <sup className={styles.sup}>++</sup>
          </h1>

          <div className={styles.features}>
            <span>
              <FaCheck className={styles.tick} /> Overturning or Derailement
            </span>
            <span>
              <FaCheck className={styles.tick} /> Breakage of bridge
            </span>
            <span>
              <FaCheck className={styles.tick} /> Collision
            </span>
          </div>

          <div className={styles.row}>
            <div className={styles.illustration}>
              <Image src={marine} alt="Truck and Plane" priority width={400} height={300} />
            </div>

            <div className={styles.partners}>
              <h3>10+ insurance partners</h3>
              <div className={styles.partnerRow}>
                <Image src={hdfc} alt="HDFC Ergo" width={60} height={40} className={styles.partnerLogo} />
                <Image src={orientalinsurance} alt="Oriental Insurance" width={60} height={40} className={styles.partnerLogo} />
                <Image src={tata} alt="Tata AIG" width={60} height={40} className={styles.partnerLogo} />
                <Image src={sbi} alt="SBI General" width={60} height={40} className={styles.partnerLogo} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION (FORM CARD) */}
        <div className={styles.right}>
          <div className={styles.card} data-aos="fade-left">
            {step === 1 && (
              <>
                <div className={styles.header}>
                  <h2>
                    Get <span className={styles.blue}>₹10 Lakh</span> cover starting at
                  </h2>
                  <p className={styles.price}>
                    ₹591<span>/transit<sup>+</sup></span>
                  </p>
                  <span className={styles.step}>Step 1/2</span>
                </div>

                <div className={styles.inputWrapper}>
                  <FaMobileAlt className={styles.inputIcon} />
                  <input
                    type="tel"
                    placeholder="Mobile number"
                    value={mobileNumber}
                    onChange={handleMobileNumberChange}
                    maxLength={14}
                  />
                  <span className={styles.note}>
                    <FaShieldAlt /> We don’t spam
                  </span>
                </div>

                <button className={styles.cta} onClick={handleViewPlans}>
                  View plans <span className={styles.arrow}>›</span>
                </button>

                <div className={styles.badge}>
                  <FaUserShield className={styles.badgeIcon} />
                  <p className={styles.badgetext}>
                    Only certified Zanifest expert will assist you
                  </p>
                </div>

                <div className={styles.whatsappRow}>
                  <div className={styles.wpLeft}>
                    <FaWhatsapp className={styles.wpIcon} />
                    <span>Get Quotes on Whatsapp</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={whatsapp}
                      onChange={() => setWhatsapp(!whatsapp)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <p className={styles.footer}>
                  By clicking on <b>"View plans"</b>, you agree to our{" "}
                  <a href="#">Privacy Policy</a>, <a href="#">Terms of Use</a> &{" "}
                  <a href="#">Disclaimer</a>
                </p>
              </>
            )}

            {step === 2 && (
              <div key="step2" data-aos="fade-left" data-aos-once="true">
                <div className={styles.header}>
                  <MdArrowBackIos size={20} className={styles.arrow} onClick={() => setStep(1)} />
                  <h2>Let's get your goods insured</h2>
                  <span className={styles.step}>Step 2/2</span>
                </div>

                {/* Commodity Type */}
                <label className={styles.label}>What type of goods are you sending?</label>
                <div className={styles.dropdownWrapper}>
                  <div className={styles.dropdownInput} onClick={() => setShowDropdown(!showDropdown)}>
                    <input type="text" placeholder="Commodity type" value={commodity} readOnly className={styles.commodityInput} />
                    <FaChevronDown className={`${styles.dropdownIcon} ${showDropdown ? styles.rotated : ""}`} />
                  </div>

                  {showDropdown && (
                    <div className={styles.dropdownList}>
                      {commodityOptions.map((item, i) => (
                        <div
                          key={i}
                          className={`${styles.dropdownItem} ${commodity === item ? styles.selectedItem : ""}`}
                          onClick={() => {
                            setCommodity(item);
                            setShowDropdown(false);
                          }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className={styles.popularText}>Select most popular commodity type</p>
                <div className={styles.optionsGrid}>
                  {commodityOptions.slice(0, 5).map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.optionBtn} ${commodity === item ? styles.activeOption : ""}`}
                      onClick={() => setCommodity(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {/* Type of Cover */}
                <label className={styles.label}>What type of cover do you want?</label>
                <div className={styles.radioRow}>
                  <label className={`${styles.radioCard} ${coverType === "single" ? styles.activeCard : ""}`} onClick={() => setCoverType("single")}>
                    <input type="radio" checked={coverType === "single"} readOnly />
                    <Image src={singletransit} alt="Single Transit" width={60} height={60} />
                    <h4>Single transit</h4>
                    <p>Covers your single journey from one location to another.</p>
                  </label>

                  <label className={`${styles.radioCard} ${coverType === "annual" ? styles.activeCard : ""}`} onClick={() => setCoverType("annual")}>
                    <input type="radio" checked={coverType === "annual"} readOnly />
                    <Image src={annualopen} alt="Annual Open" width={60} height={60} />
                    <h4>Annual open</h4>
                    <p>Covers your shipments throughout the year.</p>
                  </label>
                </div>

                {/* Shipment Type */}
                <label className={styles.label}>Where will your goods be shipped?</label>
                <div className={styles.radioRow}>
                  {["inland", "export", "import"].map((type) => (
                    <label
                      key={type}
                      className={`${styles.radioBtn} ${shipmentType === type ? styles.activeRadio : ""}`}
                      onClick={() => setShipmentType(type)}
                    >
                      <input type="radio" checked={shipmentType === type} readOnly />
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  ))}
                </div>
                <button className={styles.cta} onClick={handleContinueStep2}>
                  Continue ›
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Marine;
