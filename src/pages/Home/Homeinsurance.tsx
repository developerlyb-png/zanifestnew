"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/Home/homeinsurance.module.css";
import { FiUser, FiPhone } from "react-icons/fi";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import { FaCheckCircle, FaWhatsapp } from "react-icons/fa";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import { useAuth } from "@/context/AuthContext";

// dialogs
import TravelPromptDialog from "@/components/Dialog/PromptDialog";
import LoginDialog from "@/components/Dialog/LoginDialog";
import RegisterDialog from "@/components/Dialog/RegisterDialog";

const Homeinsurance: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  // FORM FIELDS
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [whatsappUpdates, setWhatsappUpdates] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("+91 ");

  // Dialog states (Step-1 never opens dialog but keep states for Step-2 use)
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // Unregistered temp ID
  const [tempRecordId, setTempRecordId] = useState<string | null>(null);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  /* -----------------------------------------------
        Build Payload (Step-1)
  ----------------------------------------------- */
  const buildPayload = () => ({
    fullName,
    phoneNumber: mobile.replace(/\s+/g, ""),
    email: null as string | null,
    coverOptions: {
      homeStructure: selectedOptions.includes("Home Structure"),
      householdItems: selectedOptions.includes("Household Items"),
      homeLoanProtection: selectedOptions.includes("Home Loan Protection"),
      insuranceForLoan: selectedOptions.includes("Insurance For Loan"),
      jewelleryAndValuables: selectedOptions.includes("Jewellery & Valuables"),
    },
  });

  /* -----------------------------------------------
        Save Temp Record
  ----------------------------------------------- */
  const savePayload = async (emailValue: string) => {
    const payload = buildPayload();
    payload.email = emailValue;

    try {
      const res = await fetch("/api/homeinsurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      return res.ok ? data.data : null;
    } catch {
      alert("Network error");
      return null;
    }
  };

  /* -----------------------------------------------
        MAIN SUBMIT → Step-1
        (NO POPUP – direct save)
  ----------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert("Please enter full name.");
      return;
    }

    if (mobile.replace(/\D/g, "").length !== 12) {
      alert("Please enter valid 10-digit mobile number.");
      return;
    }

    // CASE 1 → logged in user
    if (isLoggedIn && user?.email) {
      const saved = await savePayload(user.email);

      if (saved) {
        localStorage.setItem("homeRecordId", saved._id);
        localStorage.setItem("homeStep1", JSON.stringify(buildPayload()));
        router.push("Homeinsurance2");
        return;
      }
    }

    // CASE 2 → unregistered user → save quietly
    const saved = await savePayload("unregistered_user");

    if (saved) {
      setTempRecordId(saved._id);
      localStorage.setItem("homeRecordId", saved._id);
      localStorage.setItem("homeStep1", JSON.stringify(buildPayload()));
    }

    router.push("Homeinsurance2");
  };

  /* -----------------------------------------------
        Input Handlers
  ----------------------------------------------- */
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^a-zA-Z\s]/g, "");
    input = input
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    setFullName(input);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prefix = "+91 ";
    let input = e.target.value;
    if (!input.startsWith(prefix)) input = prefix;

    const digits = input.substring(prefix.length).replace(/\D/g, "");
    setMobile(prefix + digits.slice(0, 10));
  };

  const handleOptionChange = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((i) => i !== option)
        : [...prev, option]
    );
  };

  /* -----------------------------------------------
        UI
  ----------------------------------------------- */
  return (
    <>
      <Navbar />

      <div className={styles.container}>
        <h3 className={styles.subTitle}>
          Elite protection for your house & valuables from theft & damage!
        </h3>

        <h1 className={styles.title}>
          Compare & Save <span>upto 25%*</span>
        </h1>

        <div className={styles.badges}>
          <span className={styles.badge}>
            <FaCheckCircle className={styles.badgeIcon} /> Bank Approved
          </span>
          <span className={styles.badge}>
            <FaCheckCircle className={styles.badgeIcon} /> Discounted Plans
          </span>
          <span className={styles.badge}>
            <FaCheckCircle className={styles.badgeIcon} /> Free Addons
          </span>
        </div>

        {/* ---- FORM ---- */}
        <form className={styles.form} onSubmit={handleSubmit} data-aos="fade-right">

          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Full Name"
              className={styles.input}
              value={fullName}
              onChange={handleFullNameChange}
            />
            <FiUser className={styles.inputIcon} />
          </div>

          <div className={styles.inputGroup}>
            <input
              type="tel"
              placeholder="Mobile Number"
              className={styles.input}
              value={mobile}
              onChange={handleMobileChange}
              maxLength={14}
            />
            <FiPhone className={styles.inputIcon} />
          </div>

          <div className={styles.coverSection}>
            <p className={styles.coverTitle}>
              What do you want to cover? <span>(Optional)</span>
            </p>

            <div className={styles.options}>
              {[
                "Home Structure",
                "Insurance For Loan",
                "Household Items",
                "Jewellery & Valuables",
                "Home Loan Protection",
              ].map((option) => (
                <label key={option} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => handleOptionChange(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            View Free Quotes
          </button>

          <div className={styles.whatsapp}>
            <FaWhatsapp className={styles.icon} />
            <span className={styles.label}>Get Updates on WhatsApp</span>

            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={whatsappUpdates}
                onChange={() => setWhatsappUpdates(!whatsappUpdates)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <p className={styles.terms}>
            By clicking on “Continue”, you agree to our{" "}
            <a href="#">Privacy Policy</a> and <a href="#">Terms of Use</a>
          </p>
        </form>
      </div>

      {/* dialogs kept for Step-2 use */}
      <TravelPromptDialog open={false} onCancel={() => {}} onLogin={() => {}} onRegister={() => {}} />

      <LoginDialog open={showLoginDialog} onClose={() => setShowLoginDialog(false)} onSuccess={() => {}} />

      <RegisterDialog open={showRegisterDialog} onClose={() => setShowRegisterDialog(false)} onSuccess={() => {}} />

      <Footer />
    </>
  );
};

export default Homeinsurance;
