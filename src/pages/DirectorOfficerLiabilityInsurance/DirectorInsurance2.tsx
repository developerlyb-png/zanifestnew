"use client";

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import styles from "@/styles/pages/DirectorOfficerLiabilityInsurance/DirectorInsurance2.module.css";

import tata from "@/assets/TATAAIGlogo.png";
import orientalinsurance from "@/assets/OrintalInsurance.png";
import sbi from "@/assets/sbi.png";
import hdfc from "@/assets/unitedindia.png";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

import PromptDialog from "@/components/Dialog/PromptDialog";
import LoginDialog from "@/components/Dialog/LoginDialog";
import RegisterDialog from "@/components/Dialog/RegisterDialog";

import { useRouter } from "next/navigation";

interface InsurancePlan {
  id: number;
  logo: StaticImageData;
  company: string;
  plan: string;
  price: string | null;
  instantCover: boolean;
  features: string[];
}

const insurancePlans: InsurancePlan[] = [
  {
    id: 1,
    logo: sbi,
    company: "SBI General Insurance Company Ltd",
    plan: "Directors & Officers Liability",
    price: "₹ 38,350",
    instantCover: true,
    features: [
      "Cover for Retired Directors",
      "Cover for failure / negligence to supervise",
      "Cover for Heirs, Estates and Legal Representatives",
    ],
  },
  {
    id: 2,
    logo: tata,
    company: "Tata AIG General Insurance",
    plan: "Directors & Officers Liability",
    price: null,
    instantCover: false,
    features: [
      "Cover for Retired Directors",
      "Cover for failure / negligence to supervise",
      "Cover for Heirs, Estates and Legal Representatives",
    ],
  },
  {
    id: 3,
    logo: orientalinsurance,
    company: "Oriental Insurance Company Ltd",
    plan: "Directors & Officers Liability",
    price: null,
    instantCover: false,
    features: [
      "Cover for Retired Directors",
      "Cover for failure / negligence to supervise",
      "Cover for Heirs, Estates and Legal Representatives",
    ],
  },
];

const DirectorInsurance2: React.FC = () => {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InsurancePlan | null>(null);

  const [promptOpen, setPromptOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const [savedId, setSavedId] = useState<string | null>(null);

  const openModal = (plan: InsurancePlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  /* =====================================================
          SAVE DATA FUNCTION
    ===================================================== */
  const saveData = async (email: string | null) => {
    try {
      const raw = sessionStorage.getItem("director_step1");
      const step1 = raw ? JSON.parse(raw) : null;

      if (!step1) {
        alert("Session expired. Please refill form.");
        router.push("/DirectorOfficerLiabilityInsurance/DirectorInsurance1");
        return null;
      }

      const payload = { ...step1, email };

      const res = await fetch("/api/directorins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert("Error saving data.");
        return null;
      }

      setSavedId(json.data._id);
      return json.data._id;
    } catch (err) {
      alert("Save error");
      return null;
    }
  };

  /* =====================================================
        AFTER QUESTIONS SUBMIT
    ===================================================== */
  const handleQuestionSubmit = async () => {
    setIsModalOpen(false);

    const loggedIn = document.cookie.includes("userToken");

    if (!loggedIn) {
      setPromptOpen(true);
      return;
    }

    const id = await saveData(null);
    if (id) router.push("/thankyou");
  };

  /* =====================================================
        PROMPT → CANCEL → GUEST SAVE
    ===================================================== */
  const handlePromptCancel = async () => {
    setPromptOpen(false);

    const id = await saveData("unregistered_user");
    if (id) router.push("/thankyou");
  };

  /* =====================================================
        PROMPT → LOGIN
    ===================================================== */
  const handlePromptLogin = () => {
    setPromptOpen(false);
    setLoginOpen(true);
  };

  /* =====================================================
        PROMPT → REGISTER
    ===================================================== */
  const handlePromptRegister = () => {
    setPromptOpen(false);
    setRegisterOpen(true);
  };

  /* =====================================================
        LOGIN SUCCESS
    ===================================================== */
  const handleLoginSuccess = async (email: string) => {
    const id = await saveData(email);

    if (id) {
      await fetch("/api/updateEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, module: "director" }),
      });

      setLoginOpen(false);
      router.push("/thankyou");
    }
  };

  /* =====================================================
        REGISTER SUCCESS
    ===================================================== */
  const handleRegisterSuccess = async ({ email }: { email: string }) => {
    const id = await saveData(email);

    if (id) {
      await fetch("/api/updateEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, module: "director" }),
      });

      setRegisterOpen(false);
      router.push("/thankyou");
    }
  };

  return (
    <>
      <Navbar />

      {/* ---------- DIALOGS ---------- */}
      <PromptDialog
        open={promptOpen}
        onCancel={handlePromptCancel}
        onLogin={handlePromptLogin}
        onRegister={handlePromptRegister}
      />

      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      <RegisterDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={handleRegisterSuccess}
      />

      {/* ---------- PAGE UI (UNCHANGED) ---------- */}
      <div className={styles.pageContainer}>
        <div className={styles.leftSection}>
          <div className={styles.detailsCard}>
            <div className={styles.detailsHeader}>
              <h3>Your details</h3>
              <button className={styles.editBtn}>✎ Edit</button>
            </div>
            <div className={styles.detailsContent}>
              <div>
                <h4>Territory</h4>
                <p>Worldwide Including US & Canada</p>
              </div>
              <div>
                <h4>Jurisdiction</h4>
                <p>Worldwide Including US & Canada</p>
              </div>
              <div>
                <h4>Limit of Liability</h4>
                <p>₹ 5 Crores</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightSection}>
          {insurancePlans.map((plan) => (
            <div key={plan.id} className={styles.planCard}>
              {plan.instantCover && (
                <div className={styles.instantTag}>Instant Risk Covered</div>
              )}

              <div className={styles.planHeader}>
                <div className={styles.planHeaderLeft}>
                  <Image src={plan.logo} alt={plan.company} className={styles.logo} />
                  <div>
                    <h4 className={styles.company}>{plan.company}</h4>
                    <p className={styles.planName}>
                      <span>Plan name</span> <strong>{plan.plan}</strong>
                    </p>
                  </div>
                </div>

                {plan.price ? (
                  <button className={styles.priceBtn} onClick={() => openModal(plan)}>
                    {plan.price}
                  </button>
                ) : (
                  <button className={styles.quoteBtn}>Get Quote</button>
                )}
              </div>

              <div className={styles.features}>
                <p className={styles.featureTitle}>Top Features</p>
                <ul>
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <span>✔</span> {feature}
                    </li>
                  ))}
                </ul>
                <button className={styles.viewBtn}>View All Features</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- MODAL ---------- */}
      {isModalOpen && selectedPlan && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Please answer a few questions before you proceed</h3>
              <button className={styles.closeModalBtn} onClick={closeModal}>
                ✖
              </button>
            </div>

            <div className={styles.modalContent}>
              <form className={styles.questionsForm}>
                <div className={styles.question}>
                  <p>Are you buying Directors & Officers policy for the first time?</p>
                  <div className={styles.options}>
                    <label><input type="radio" name="firstTime" /> Yes</label>
                    <label><input type="radio" name="firstTime" /> No</label>
                  </div>
                </div>

                <div className={styles.question}>
                  <p>Is your gross asset size more than 100 crores?</p>
                  <div className={styles.options}>
                    <label><input type="radio" name="gross" /> Yes</label>
                    <label><input type="radio" name="gross" /> No</label>
                  </div>
                </div>

                <div className={styles.question}>
                  <p>Is your company profitable?</p>
                  <div className={styles.options}>
                    <label><input type="radio" name="profit" /> Yes</label>
                    <label><input type="radio" name="profit" /> No</label>
                  </div>
                </div>

                <div className={styles.question}>
                  <p>Do you have any domiciled presence outside India?</p>
                  <div className={styles.options}>
                    <label><input type="radio" name="domiciled" /> Yes</label>
                    <label><input type="radio" name="domiciled" /> No</label>
                  </div>
                </div>

                <div className={styles.question}>
                  <p>
                    Are any of your directors working as a director with any foreign
                    entity?
                  </p>
                  <div className={styles.options}>
                    <label><input type="radio" name="otherDir" /> Yes</label>
                    <label><input type="radio" name="otherDir" /> No</label>
                  </div>
                </div>

                <div className={styles.question}>
                  <p>Are your annual reports for the past three years qualified by auditors?</p>
                  <div className={styles.options}>
                    <label><input type="radio" name="audit" /> Yes</label>
                    <label><input type="radio" name="audit" /> No</label>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleQuestionSubmit}
                >
                  Save & Continue
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default DirectorInsurance2;


