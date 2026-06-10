"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/Home/homeinsurance2.module.css";
import { FiInfo } from "react-icons/fi";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import { useAuth } from "@/context/AuthContext";

// dialogs
import TravelPromptDialog from "@/components/Dialog/PromptDialog";
import LoginDialog from "@/components/Dialog/LoginDialog";
import RegisterDialog from "@/components/Dialog/RegisterDialog";

const Homeinsurance2: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  // fields
  const [houseValue, setHouseValue] = useState("");
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [householdValue, setHouseholdValue] = useState("");
  const [city, setCity] = useState("");

  // dialogs
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  const [tempRecordId, setTempRecordId] = useState<string | null>(null);

  /* ---------------- LOAD RECORD ID FIX ---------------- */
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });

    const savedId = localStorage.getItem("homeRecordId");
    if (savedId) setTempRecordId(savedId);
  }, []);

  /* ---------------- Format Helpers ---------------- */
  const presetOptions: Record<string, number> = {
    "₹1 Cr": 10000000,
    "₹75 L": 7500000,
    "₹50 L": 5000000,
    "₹40 L": 4000000,
  };

  const wordsMap: Record<string, string> = {
    "₹1 Cr": "One Crore Only",
    "₹75 L": "Seventy-Five Lakh Only",
    "₹50 L": "Fifty Lakh Only",
    "₹40 L": "Forty Lakh Only",
  };

  const [houseTextValue, setHouseTextValue] = useState("");

  const handleSelectValue = (value: string) => {
    const num = presetOptions[value];
    setSelectedValue(value);
    setHouseValue(num.toLocaleString("en-IN"));
    setHouseTextValue(wordsMap[value]);
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, "");
    if (val) setHouseValue(Number(val).toLocaleString("en-IN"));
    else setHouseValue("");

    setSelectedValue(null);
    setHouseTextValue("");
  };

  const handleHouseholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, "");
    if (!val) return setHouseholdValue("");

    const householdNum = parseInt(val);
    const houseNum = parseInt(houseValue.replace(/,/g, "")) || 0;

    if (householdNum > houseNum) {
      alert("Household cannot be greater than house value!");
      return;
    }

    setHouseholdValue(Number(val).toLocaleString("en-IN"));
  };

  /* ---------------- Build Final Payload ---------------- */
  const buildFinalPayload = () => {
    const step1Data = localStorage.getItem("homeStep1");
    if (!step1Data) return null;

    const parsed = JSON.parse(step1Data);

    return {
      ...parsed,
      propertyDetails: {
        houseValue,
        householdItemsValue: householdValue,
        cityName: city,
      },
    };
  };

  /* ---------------- Save Final Record ---------------- */
  const saveFinalData = async (emailValue: string) => {
    const payload: any = buildFinalPayload();
    if (!payload) return null;

    payload.email = emailValue ?? null;

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
      alert("Network Error");
      return null;
    }
  };

  /* ---------------- SUBMIT → Step-2 ---------------- */
  const handleSubmitData = async () => {
    if (!houseValue || !householdValue)
      return alert("Please fill all required fields.");

    // logged-in user → save and continue
    if (isLoggedIn && user?.email) {
      const saved = await saveFinalData(user.email);

      if (saved) {
        localStorage.removeItem("homeStep1");
        router.push("Homeinsurance3");
      }
      return;
    }

    // user not logged in → show popup (only here)
    setShowPromptDialog(true);
  };

  /* ---------------- CANCEL → Save unregistered ---------------- */
  const handlePromptCancel = async () => {
    setShowPromptDialog(false);

    const saved = await saveFinalData("unregistered_user");
    if (saved && saved._id) setTempRecordId(saved._id);

    localStorage.removeItem("homeStep1");
    router.push("Homeinsurance3");
  };

  /* ---------------- LOGIN / REGISTER ---------------- */
  const handlePromptLogin = () => {
    setShowPromptDialog(false);
    setShowLoginDialog(true);
  };

  const handlePromptRegister = () => {
    setShowPromptDialog(false);
    setShowRegisterDialog(true);
  };

  /* ---------------- LOGIN SUCCESS → Update Email ---------------- */
  const handleLoginSuccess = async (email: string) => {
    setShowLoginDialog(false);

    if (tempRecordId) {
      await fetch("/api/updateEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tempRecordId,
          email,
          module: "home",
        }),
      });
    }

    localStorage.removeItem("homeStep1");
    router.push("Homeinsurance3");
  };

  const handleRegisterSuccess = () => {
    setShowRegisterDialog(false);
    setTimeout(() => setShowLoginDialog(true), 150);
  };

  return (
    <div>
      <Navbar />

      <div className={styles.container}>
        <h2 className={styles.heading}>Please help us with your property details</h2>

        {/* House Value */}
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Current house value (₹)"
            value={houseValue}
            onChange={handleManualInput}
            className={styles.input}
          />
          <FiInfo className={styles.icon} />
        </div>

        {houseTextValue && <p className={styles.helperText}>{houseTextValue}</p>}

        <p className={styles.subLabel}>Most chosen house values</p>

        <div className={styles.valueButtons}>
          {Object.keys(presetOptions).map((val) => (
            <button
              key={val}
              onClick={() => handleSelectValue(val)}
              className={`${styles.valueBtn} ${
                selectedValue === val ? styles.activeValueBtn : ""
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Household Items */}
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Household items value (₹)"
            value={householdValue}
            onChange={handleHouseholdChange}
            className={styles.input}
          />
          <FiInfo className={styles.icon} />
        </div>

        {/* City */}
        <input
          type="text"
          placeholder="City name (Optional)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={styles.input}
        />

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <button className={styles.prevBtn} onClick={() => router.push("Homeinsurance")}>
            <MdKeyboardArrowLeft /> Previous
          </button>

          <button className={styles.nextBtn} onClick={handleSubmitData}>
            View Discounted Plans
          </button>
        </div>
      </div>

      {/* dialogs */}
      <TravelPromptDialog
        open={showPromptDialog}
        onCancel={handlePromptCancel}
        onLogin={handlePromptLogin}
        onRegister={handlePromptRegister}
      />

      <LoginDialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onSuccess={handleLoginSuccess}
      />

      <RegisterDialog
        open={showRegisterDialog}
        onClose={() => setShowRegisterDialog(false)}
        onSuccess={handleRegisterSuccess}
      />

      <Footer />
    </div>
  );
};

export default Homeinsurance2;
