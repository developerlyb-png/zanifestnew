"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/Shop/shop2.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import AOS from "aos";
import "aos/dist/aos.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TravelPromptDialog from "@/components/Dialog/PromptDialog";
import LoginDialog from "@/components/Dialog/LoginDialog";
import RegisterDialog from "@/components/Dialog/RegisterDialog";

const Shop2: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  const [selectedBusiness, setSelectedBusiness] = useState("Offices");
  const [customBusiness, setCustomBusiness] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [ownerType, setOwnerType] = useState("owned");
  const [loading, setLoading] = useState(false);

  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  const [tempRecordId, setTempRecordId] = useState<string | null>(null);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const handleBusinessClick = (option: string) => {
    if (option === "Other") {
      setIsOtherSelected(true);
      setSelectedBusiness("Other");
    } else {
      setIsOtherSelected(false);
      setSelectedBusiness(option);
      setCustomBusiness("");
    }
  };

  const handleCustomChange = (value: string) => {
    setCustomBusiness(value);
    setSelectedBusiness(value || "Other");
  };

  const buildFinalPayload = () => {
    const s1 = localStorage.getItem("shopDataStep1");
    if (!s1) return null;
    const step1 = JSON.parse(s1);

    return {
      ...step1,
      businessCategory: selectedBusiness,
      businessType: isOtherSelected ? customBusiness || null : undefined,
      ownership: ownerType,
      email: null as string | null,
    };
  };

  const saveFinalData = async (emailValue: string) => {
    const payload: any = buildFinalPayload();
    if (!payload) return null;

    payload.email = emailValue ?? null;

    try {
      const res = await fetch("/api/shopinsurance", {
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

  const handleSubmit = async () => {
    const payload = buildFinalPayload();
    if (!payload) {
      alert("Please complete step 1 first.");
      router.push("/Shop/Shop1");
      return;
    }

    if (isLoggedIn && user?.email) {
      setLoading(true);
      const saved = await saveFinalData(user.email);
      setLoading(false);

      if (saved) {
        localStorage.removeItem("shopDataStep1");
        router.push("/Shop/Shop3");
      }
      return;
    }

    setShowPromptDialog(true);
  };

  const handlePromptCancel = async () => {
    setShowPromptDialog(false);
    setLoading(true);
    const saved = await saveFinalData("unregistered_user");
    setLoading(false);

    if (saved && saved._id) {
      setTempRecordId(saved._id);
      localStorage.setItem("shopRecordId", saved._id);
    }

    localStorage.removeItem("shopDataStep1");
    router.push("/Shop/Shop3");
  };

  const handlePromptLogin = () => {
    setShowPromptDialog(false);
    setShowLoginDialog(true);
  };

  const handlePromptRegister = () => {
    setShowPromptDialog(false);
    setShowRegisterDialog(true);
  };

  const handleLoginSuccess = async (email: string) => {
    setShowLoginDialog(false);

    // ⭐⭐⭐ IMPORTANT — Email Update Logic
    if (tempRecordId) {
      await fetch("/api/updateEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tempRecordId,
          email,
          module: "shop",
        }),
      });
    }

    setLoading(true);
    const saved = await saveFinalData(email);
    setLoading(false);

    if (saved) {
      localStorage.removeItem("shopDataStep1");
      router.push("/Shop/Shop3");
    }
  };

  const handleRegisterSuccess = () => {
    setShowRegisterDialog(false);
    setTimeout(() => setShowLoginDialog(true), 150);
  };

  return (
    <>
      <Navbar />

      <div className={styles.wrapper}>
        <div className={styles.left}>
          <h4 className={styles.subHeading}>Shop Insurance</h4>
          <h2 className={styles.heading}>
            Get <span className={styles.highlight}>₹50 Lakh</span> cover starting at just
            <span className={styles.price}>₹3,400/year*</span>
          </h2>

          <div className={styles.features}>
            <span>🔥 Fire & Natural Disaster</span>
            <span>🔒 Theft within 7 days of Peril Occurrence</span>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.card}>
            <h3 className={styles.cardHeading}>About your business</h3>

            <div className={styles.businessOptions}>
              {[
                "Offices",
                "Shops",
                "Hospitals and Clinics",
                "Restaurants",
                "Godown Storage (non hazardous goods)",
                "Other",
              ].map((option) => (
                <button
                  key={option}
                  className={`${styles.optionBtn} ${
                    selectedBusiness === option ? styles.active : ""
                  }`}
                  onClick={() => handleBusinessClick(option)}
                >
                  {option === "Other" && customBusiness && !isOtherSelected
                    ? customBusiness
                    : option}
                </button>
              ))}
            </div>

            {isOtherSelected && (
              <div className={styles.otherInputBox}>
                <input
                  type="text"
                  placeholder="Enter your business type"
                  value={customBusiness}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className={styles.textField}
                />
              </div>
            )}

            <p className={styles.subText}>Are you the owner or tenant?</p>
            <div className={styles.ownerTenant}>
              <div
                className={`${styles.option} ${
                  ownerType === "owned" ? styles.active : ""
                }`}
                onClick={() => setOwnerType("owned")}
              >
                <span>🏠</span>
                <p>Owned</p>
                <small>The person who owns the property</small>
              </div>

              <div
                className={`${styles.option} ${
                  ownerType === "tenant" ? styles.active : ""
                }`}
                onClick={() => setOwnerType("tenant")}
              >
                <span>🔑</span>
                <p>Tenant</p>
                <small>The person who rents the property</small>
              </div>
            </div>

            <button className={styles.continueBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Continue →"}
            </button>
          </div>
        </div>
      </div>

      <Footer />

      {/* DIALOGS */}
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
    </>
  );
};

export default Shop2;
