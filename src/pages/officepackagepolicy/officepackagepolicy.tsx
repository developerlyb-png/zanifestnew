"use client";
import React, { useState } from "react";
import Image from "next/image";
import styles from "@/styles/pages/officepackagepolicy/Officepackagepolicy.module.css";
import {
  FaCheck,
  FaChevronLeft,
  FaShieldAlt,
  FaUserShield,
  FaWhatsapp,
} from "react-icons/fa";

import tata from "@/assets/TATAAIGlogo.png";
import orientalinsurance from "@/assets/OrintalInsurance.png";
import sbi from "@/assets/sbi.png";
import hdfc from "@/assets/unitedindia.png";
import opp from "@/assets/OPP.webp";
import buildingImg from "@/assets/office-building.png";
import contentImg from "@/assets/content.jpg";
import stockImg from "@/assets/stock.webp";
import { useRouter } from "next/navigation";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";

const Officepackagepolicy: React.FC = () => {
  const [whatsapp, setWhatsapp] = useState(true);
    const [companyName, setCompanyName] = useState("");
  const [mobile, setMobile] = useState("");

  const [step, setStep] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [values, setValues] = useState<{ [key: string]: string }>({
    Building: "",
    Content: "",
    Stock: "",
  });

  const nextStep = () => setStep((s) => Math.min(2, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };
  const router = useRouter();

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const raw = e.target.value.replace(/[^\d]/g, ""); // only numbers
    setValues((p) => ({ ...p, [key]: raw }));
  };

  const handleBlur = (key: string) => {
    setValues((p) => {
      const num = p[key].replace(/[^\d]/g, "");
      if (!num) return { ...p, [key]: "" };
      const formatted = new Intl.NumberFormat("en-IN").format(Number(num));
      return { ...p, [key]: formatted };
    });
  };
   const handleContinue = () => {
    if (!companyName.trim() || mobile.trim().length !== 10) {
      alert("Please enter company name & valid mobile number");
      return;
    }

    const payload = {
      companyName,
      mobile,
      options: selectedOptions.map((opt) => ({
        name: opt,
        checked: true,
        amount: values[opt]?.replace(/,/g, ""),
      })),
    };

    // ✅ Save Step-1 + Step-2 details
    sessionStorage.setItem("officepackage_initial", JSON.stringify(payload));

    router.push("./officepackagepolicy2");
  };

  return (
    <>
      <Navbar />
      <div className={styles.wrapper}>
        {/* ---------------- Left Section ---------------- */}
        <div className={styles.left}>
          <h1 className={styles.mainHeading}>
            Get <span>₹3 Crore</span> cover starting at{" "}
            <span>₹23,600 / year</span>+
          </h1>

          <div className={styles.features}>
            <span>
              <FaCheck className={styles.tick} /> Litigation and defense cost
            </span>
            <span>
              <FaCheck className={styles.tick} /> Coverage for assets of
              directors and officers
            </span>
          </div>

          <div className={styles.imagePartnerRow}>
            <div className={styles.imageWrap}>
              <Image
                src={opp}
                alt="Office Package"
                width={200}
                height={200}
                className={styles.directorImg}
                priority
              />
            </div>

            <div className={styles.partners}>
              <h3>10+ insurance partners</h3>
              <div className={styles.partnerRow}>
                <Image
                  src={hdfc}
                  alt="HDFC Ergo"
                  width={60}
                  height={40}
                  className={styles.partnerLogo}
                />
                <Image
                  src={orientalinsurance}
                  alt="Oriental Insurance"
                  width={60}
                  height={40}
                  className={styles.partnerLogo}
                />
                <Image
                  src={tata}
                  alt="Tata AIG"
                  width={60}
                  height={40}
                  className={styles.partnerLogo}
                />
                <Image
                  src={sbi}
                  alt="SBI General"
                  width={60}
                  height={40}
                  className={styles.partnerLogo}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Right Section ---------------- */}
        <div className={styles.right}>
          {/* ---------- Step 1 ---------- */}
          {step === 1 && (
            <div className={styles.card}>
              <h2>
                For custom plans, share your mobile number{" "}
                <span className={styles.step}>Step 1 / 2</span>
              </h2>

             <label className={styles.label}>Company Name</label>
<div className={styles.inputWrap}>
  <input
    type="text"
    placeholder="Enter company name"
    value={companyName}
    onChange={(e) => setCompanyName(e.target.value)}
  />
</div>

<label className={styles.label}>Mobile number</label>
<div className={styles.inputWrap}>
  <input
    type="text"
    placeholder="Enter mobile number"
    maxLength={10}
    value={mobile}
    onChange={(e) => {
      const value = e.target.value.replace(/\D/g, ""); // digits only
      setMobile(value);
    }}
  />
  <FaCheck className={styles.iconCheck} />
</div>


              <span className={styles.note}>
                <FaShieldAlt /> We don’t spam
              </span>

              <button className={styles.primaryBtn} onClick={nextStep}>
                View quotes →
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
                  <span>Get Quotes on WhatsApp</span>
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

              <p className={styles.disclaimer}>
                By clicking <span className={styles.bold}>“View quotes”</span>,
                you agree to our
                <a href="#" className={styles.link}>
                  Privacy Policy
                </a>
                ,
                <a href="#" className={styles.link}>
                  Terms of Use
                </a>{" "}
                &
                <a href="#" className={styles.link}>
                  Disclaimer
                </a>
              </p>
            </div>
          )}

          {/* ---------- Step 2 ---------- */}
{step === 2 && (
  <div className={styles.stepTwoCard}>
    <button className={styles.backBtn} onClick={prevStep}>
      <FaChevronLeft /> Back
    </button>

    <h2 className={styles.stepTwoTitle}>
      About your business <span className={styles.step}>Step 2 / 2</span>
    </h2>

    <div className={styles.optionList}>
      {[
        {
          key: "Building",
          img: buildingImg,
          desc: "Building includes the structure of your establishment with plinth and foundation.",
        },
        {
          key: "Content",
          img: contentImg,
          desc: "Content includes Plant & Machinery, Furniture & Fixtures, and any other content within the building premises.",
        },
        {
          key: "Stock",
          img: stockImg,
          desc: "Raw materials and finished stock within the premises.",
        },
      ].map(({ key, img, desc }) => (
        <div
          key={key}
          className={`${styles.optionCard} ${
            selectedOptions.includes(key) ? styles.selected : ""
          }`}
          onClick={() => toggleOption(key)}
        >
          <div className={styles.optionTopRow}>
            <div className={styles.optionLeft}>
              <input
                type="checkbox"
                checked={selectedOptions.includes(key)}
                readOnly
              />
              <div>
                <h4>{key}</h4>
                <p>{desc}</p>
              </div>
            </div>
            <Image src={img} alt={key} width={60} height={60} />
          </div>

          {selectedOptions.includes(key) && (
            <div
              className={styles.valueInputBox}
              onClick={(e) => e.stopPropagation()} 
            >
              <label>{key} Value (₹)</label>
              <div className={styles.currencyField}>
                <span className={styles.rupee}>₹</span>
                <input
                  type="text"
                  value={values[key]}
                  onChange={(e) => handleInput(e, key)}
                  onBlur={() => handleBlur(key)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Enter amount"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>

   
              <button className={styles.continueBtn} onClick={handleContinue}>
                Continue →
              </button>
  </div>
)}

        </div>
      </div>
      <Footer />
    </>
  );
};

export default Officepackagepolicy;
