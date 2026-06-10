"use client";
import React, { useState, useEffect } from "react";
import styles from "@/styles/pages/officepackagepolicy/Officepackagepolicy2.module.css";
import Image from "next/image";
import { FaCheck } from "react-icons/fa";
import bajaj from "@/assets/pageImages/bajaj.png";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import yes from "@/assets/F&B_yes_icon.webp";
import no from "@/assets/F&B_no_icon.webp";
import step3 from "@/assets/loss.png";

import { useAuth } from "@/context/AuthContext";

// dialogs
import PromptDialog from "@/components/Dialog/PromptDialog";
import LoginDialog from "@/components/Dialog/LoginDialog";
import RegisterDialog from "@/components/Dialog/RegisterDialog";

/* ---------------------------- MODAL ---------------------------- */
interface ModalProps {
  showModal: boolean;
  modalStep: number;
  setModalStep: (n: number) => void;
  companyName: string;
  setCompanyName: (s: string) => void;
  firstTimeBuying: string;
  setFirstTimeBuying: (s: string) => void;
  lossHistory: string;
  setLossHistory: (s: string) => void;
  isContinueDisabled: () => boolean;
  handleModalContinue: () => Promise<void> | void;
}

const Modal: React.FC<ModalProps> = ({
  showModal,
  modalStep,
  setModalStep,
  companyName,
  setCompanyName,
  firstTimeBuying,
  setFirstTimeBuying,
  lossHistory,
  setLossHistory,
  isContinueDisabled,
  handleModalContinue,
}) => {
  if (!showModal) return null;

  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  const [fadeClass, setFadeClass] = useState(styles.fadeIn);

  useEffect(() => {
    setFadeClass(styles.fadeOut);
    const timer = setTimeout(() => setFadeClass(styles.fadeIn), 200);
    return () => clearTimeout(timer);
  }, [modalStep]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCompanyName(value);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} ${fadeClass}`}>

        {/* STEP 1 */}
        {modalStep === 1 && (
          <div data-aos="fade">
            <h3 className={styles.modalTitle}>Best quotes for you are just moments away!</h3>
            <p className={styles.modalSubtitle}>Enter your pincode to get started.</p>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Pincode</label>
              <input
                type="text"
                value={companyName}
                onChange={handleCompanyChange}
                maxLength={6}
                className={styles.textInput}
              />
            </div>

            <button
              onClick={handleModalContinue}
              disabled={isContinueDisabled()}
              className={`${styles.continueBtn} ${isContinueDisabled() ? styles.disabled : ""}`}
            >
              Continue &gt;
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {modalStep === 2 && (
          <div data-aos="fade" className={styles.step2Container}>
            <h3 className={styles.modalTitle}>Best quotes for you are just moments away!</h3>
            <p className={styles.modalSubtitle}>Buying fire & burglary insurance for the first time?</p>

            <div className={styles.choiceGrid}>
              <div
                className={`${styles.choiceCard} ${firstTimeBuying === "Yes" ? styles.activeChoice : ""}`}
                onClick={() => setFirstTimeBuying("Yes")}
              >
                <Image src={yes} alt="Yes" width={50} height={50} />
                <p className={styles.choiceTitle}>Yes</p>
                <p className={styles.choiceDesc}>Buying for the first time</p>
                {firstTimeBuying === "Yes" && (
                  <div className={styles.checkmark}><FaCheck /></div>
                )}
              </div>

              <div
                className={`${styles.choiceCard} ${firstTimeBuying === "No" ? styles.activeChoice : ""}`}
                onClick={() => setFirstTimeBuying("No")}
              >
                <Image src={no} alt="No" width={50} height={50} />
                <p className={styles.choiceTitle}>No</p>
                <p className={styles.choiceDesc}>Existing policy is expiring</p>
                {firstTimeBuying === "No" && (
                  <div className={styles.checkmark}><FaCheck /></div>
                )}
              </div>
            </div>

            <button
              onClick={handleModalContinue}
              disabled={isContinueDisabled()}
              className={`${styles.viewQuoteBtn} ${isContinueDisabled() ? styles.disabled : ""}`}
            >
              Continue &gt;
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {modalStep === 3 && (
          <div data-aos="fade" className={styles.lossHistoryContainer}>
            <h3 className={styles.modalTitle}>Loss History Overview</h3>

            <div className={styles.lossIconWrapper}>
              <Image src={step3} alt="Loss" width={60} height={60} />
            </div>

            <p className={styles.lossQuestion}>
              Has your commercial property experienced any loss incidents in the last 3 years?
            </p>

            <div className={styles.lossChoiceRow}>
              <button
                className={`${styles.lossBtn} ${lossHistory === "Yes" ? styles.activeLossBtn : ""}`}
                onClick={() => setLossHistory("Yes")}
              >
                Yes
              </button>
              <button
                className={`${styles.lossBtn} ${lossHistory === "No" ? styles.activeLossBtn : ""}`}
                onClick={() => setLossHistory("No")}
              >
                No
              </button>
            </div>

            <button
              onClick={handleModalContinue}
              disabled={isContinueDisabled()}
              className={`${styles.viewQuotesBtn} ${isContinueDisabled() ? styles.disabled : ""}`}
            >
              View quotes &gt;
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

/* ---------------------------- MAIN PAGE ---------------------------- */

export default function Officepackagepolicy2() {
  const router = useRouter();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(true);
  const [modalStep, setModalStep] = useState(1);

  const [companyName, setCompanyName] = useState("");   // pincode
  const [firstTimeBuying, setFirstTimeBuying] = useState("");
  const [lossHistory, setLossHistory] = useState("");

  const [showPrompt, setShowPrompt] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  /* ---------------- VALIDATION ---------------- */
  const isContinueDisabled = () => {
    if (modalStep === 1) return companyName.length < 6;
    if (modalStep === 2) return !firstTimeBuying;
    if (modalStep === 3) return !lossHistory;
    return false;
  };

  /* ---------------- SAVE FINAL DATA ---------------- */
  const saveFinalData = async (emailToSave: string | null) => {
    try {
      const raw = sessionStorage.getItem("officepackage_initial");
      const stepData = raw ? JSON.parse(raw) : null;

      if (!stepData) {
        alert("Please re-start the form.");
        router.push("/officepackagepolicy");
        return;
      }

      const payload = {
        companyName: stepData.companyName,
        mobile: stepData.mobile,
        email: emailToSave,
        options: stepData.options,
        pincode: companyName,
        firstTimeBuying,
        lossHistory,
      };

      const res = await fetch("/api/officepackagepolicyinsurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      alert("Saved successfully!");
      setShowModal(false);

    } catch (err) {
      alert("Something went wrong while saving!");
    }
  };

  /* ---------------- HANDLE CONTINUE ---------------- */
  const handleModalContinue = async () => {
    if (modalStep < 3) {
      setModalStep((s) => s + 1);
      return;
    }

    // LAST STEP → check login
    if (user?.email) {
      await saveFinalData(user.email);
      return;
    }

    // Not logged in → show dialog
    setShowPrompt(true);
  };

  /* ---------------- PROMPT HANDLERS ---------------- */
  const handlePromptCancel = async () => {
    setShowPrompt(false);
    await saveFinalData("unregistered_user");
  };

  const handlePromptLogin = () => {
    setShowPrompt(false);
    setShowLogin(true);
  };

  const handlePromptRegister = () => {
    setShowPrompt(false);
    setShowRegister(true);
  };

  /* ---------------- LOGIN SUCCESS ---------------- */
  const handleLoginSuccess = async (email: string) => {
    setShowLogin(false);
    await saveFinalData(email);
  };

  /* ---------------- REGISTER SUCCESS ---------------- */
  const handleRegisterSuccess = async ({ email }: { email: string }) => {
    setShowRegister(false);
    await saveFinalData(email);
  };

  /* ---------------- UI BELOW (NO CHANGES DONE!) ---------------- */
  return (
    <>
      {/* MODAL */}
      <Modal
        showModal={showModal}
        modalStep={modalStep}
        setModalStep={setModalStep}
        companyName={companyName}
        setCompanyName={setCompanyName}
        firstTimeBuying={firstTimeBuying}
        setFirstTimeBuying={setFirstTimeBuying}
        lossHistory={lossHistory}
        setLossHistory={setLossHistory}
        isContinueDisabled={isContinueDisabled}
        handleModalContinue={handleModalContinue}
      />

      {/* DIALOGS */}
      <PromptDialog
        open={showPrompt}
        onLogin={handlePromptLogin}
        onRegister={handlePromptRegister}
        onCancel={handlePromptCancel}
      />
      <LoginDialog
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
      />
      <RegisterDialog
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={handleRegisterSuccess}
      />

      {/* PAGE CONTENT (UNCHANGED) */}
      <div className={`${styles.pageContent} ${showModal ? styles.blurred : ""}`}>
        <Navbar />

        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => router.push("/Marine1")}>
            ←
          </button>

          <div className={styles.info}>
            <div>
              <span className={styles.label}>Commodity details</span>
              <span className={styles.value}>Electronic and white goods</span>
            </div>

            <div>
              <span className={styles.label}>Cover amount</span>
              <span className={styles.value}>₹ 1,23,456</span>
            </div>

            <div>
              <span className={styles.label}>Cover type</span>
              <span className={styles.value}>Annual open</span>
            </div>

            <div>
              <span className={styles.label}>Shipment type</span>
              <span className={styles.value}>Export</span>
            </div>

            <div>
              <span className={styles.label}>Mode of transport</span>
              <span className={styles.value}>Road</span>
            </div>

            <button className={styles.editBtn}>✎ Edit your search</button>
          </div>
        </div>

        <div className={styles.wrapper}>
          <div className={styles.leftsection}>
            {[...Array(5)].map((_, idx) => (
              <div className={styles.card} key={idx}>
                <span className={styles.recommended}>★ Recommended</span>
                <div className={styles.row}>
                  <div className={styles.section}>
                    <Image src={bajaj} alt="logo" className={styles.logo} />
                    <span className={styles.policyTitle}>All Risk Cover</span>
                  </div>

                  <div className={styles.coverBlock}>
                    <span className={styles.coveredLabel}>Covered amount</span>
                    <strong className={styles.coveredValue}>₹ 54,45,556</strong>
                  </div>

                  <button className={styles.quoteBtn} onClick={() => router.push("/Marine6")}>
                    Get quote
                  </button>
                </div>

                <div className={styles.coverages}>
                  <div className={styles.linetext}>
                    <span className={styles.coverLabel}>Top coverages</span>
                  </div>

                  <div className={styles.tagsRow}>
                    <div className={styles.tags}>
                      <span><FaCheck size={12} className={styles.tick} /> Theft / pilferage</span>
                      <span><FaCheck size={12} className={styles.tick} /> Loading and unloading</span>
                      <span><FaCheck size={12} className={styles.tick} /> Malicious damage</span>
                      <span className={styles.more}>+4 risks covered</span>
                    </div>

                    <label className={styles.compare}>
                      <input type="checkbox" /> Add to compare
                    </label>
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className={styles.rightsection}>
            <div className={styles.right}>
              <h4 className={styles.title}>Events & Conference</h4>

              <div className={styles.thumbnail}>
                <button className={styles.playBtn}>▶</button>
              </div>

              <p className={styles.date}>
                13th February | 3:00 PM | <span className={styles.webinar}>Webinar (Online)</span>
              </p>

              <h5 className={styles.heading}>
                FIEO - Federation of Indian Export Organisation (Ministry of commerce)
              </h5>

              <p className={styles.desc}>
                Moments from our recent webinar on Role of Insurance in managing Export Supply Chain risk
              </p>

              <a href="#" className={styles.link}>Read more →</a>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
