"use client";
import React, { useState, useEffect } from "react";
import styles from "@/styles/pages/marine/marine5.module.css";
import Image from "next/image";
import bajaj from "@/assets/pageImages/bajaj.png";
import { FaCheck, FaTruck, FaPlane, FaShip, FaBox, FaTrain } from "react-icons/fa";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import { useAuth } from "@/context/AuthContext";

/* ----------------------------- MODAL COMPONENT ----------------------------- */
const Modal = ({
  showModal,
  modalStep,
  companyName,
  setCompanyName,
  transportMode,
  setTransportMode,
  coverAmount,
  handleAmountChange,
  numberToWords,
  isContinueDisabled,
  handleModalContinue,
  handleCompanyChange,
}: any) => {
  if (!showModal) return null;

  useEffect(() => {
    AOS.init({ duration: 800, once: false });
  }, []);

  const [fadeClass, setFadeClass] = useState(styles.fadeIn);
  useEffect(() => {
    setFadeClass(styles.fadeOut);
    const timer = setTimeout(() => setFadeClass(styles.fadeIn), 200);
    return () => clearTimeout(timer);
  }, [modalStep]);

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} ${fadeClass}`}>
        {/* STEP 1: Company Name */}
        {modalStep === 1 && (
          <div data-aos="fade">
            <h3 className={styles.modalTitle}>Just one last thing before you get your quotes</h3>
            <p className={styles.modalSubtitle}>Tell us the name of your company</p>
            <div className={styles.inputGroup}>
              <label htmlFor="companyName" className={styles.inputLabel}>Company name</label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={handleCompanyChange}
                className={styles.textInput}
                placeholder="Company Name"
              />
            </div>
            <button
              onClick={handleModalContinue}
              disabled={isContinueDisabled()}
              className={`${styles.continueBtn} ${isContinueDisabled() ? styles.disabled : ""}`}
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: Transport Mode */}
        {modalStep === 2 && (
          <div data-aos="fade">
            <h3 className={styles.modalTitle}>How will your goods be making their journey?</h3>
            <div className={styles.transportOptions}>
              {["Road", "Air", "Sea", "Courier", "Rail"].map((mode) => (
                <div
                  key={mode}
                  className={`${styles.transportOption} ${transportMode === mode ? styles.selected : ""}`}
                  onClick={() => setTransportMode(mode)}
                >
                  {mode === "Road" && <FaTruck className={styles.transportIcon} />}
                  {mode === "Air" && <FaPlane className={styles.transportIcon} />}
                  {mode === "Sea" && <FaShip className={styles.transportIcon} />}
                  {mode === "Courier" && <FaBox className={styles.transportIcon} />}
                  {mode === "Rail" && <FaTrain className={styles.transportIcon} />}
                  {mode}
                </div>
              ))}
            </div>
            <button
              onClick={handleModalContinue}
              disabled={isContinueDisabled()}
              className={`${styles.continueBtn} ${isContinueDisabled() ? styles.disabled : ""}`}
            >
              View quotes &gt;
            </button>
          </div>
        )}

        {/* STEP 3: Cover Amount */}
        {modalStep === 3 && (
          <div data-aos="fade">
            <h3 className={styles.modalTitle}>How much cover amount are you looking for?</h3>
            <div className={styles.inputGroup}>
              <label htmlFor="coverAmount" className={styles.inputLabel}>Cover amount</label>
              <input
                id="coverAmount"
                type="text"
                value={coverAmount}
                onChange={handleAmountChange}
                className={styles.textInput}
                placeholder="0"
              />
              <p className={styles.amountInWords}>
                {coverAmount ? `${numberToWords(coverAmount)} Only` : "Enter amount to see in words"}
              </p>
            </div>
            <button
              onClick={handleModalContinue}
              disabled={isContinueDisabled()}
              className={`${styles.continueBtn} ${isContinueDisabled() ? styles.disabled : ""}`}
            >
              Save Details &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ----------------------------- MAIN COMPONENT ----------------------------- */
const Marine5 = () => {
  const [showModal, setShowModal] = useState(true);
  const [modalStep, setModalStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [coverAmount, setCoverAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setShowModal(true);
    setModalStep(1);
  }, []);

  useEffect(() => {
    const savedPhone = localStorage.getItem("phoneNumber");
    if (savedPhone) setPhoneNumber(savedPhone);
  }, []);

  const handleModalContinue = async () => {
    if (modalStep < 3) {
      setModalStep((s) => s + 1);
      return;
    }

    if (!phoneNumber) {
      alert("Please complete step 1 on Marine page first.");
      return;
    }

    // determine userEmail
    let userEmailToSave = !authLoading && user?.email ? user.email : `null`;

    const payload = {
      phoneNumber: phoneNumber.replace(/\s+/g, ""),
      companyName,
      transportMode,
      coverAmount: coverAmount.replace(/,/g, ""),
email: userEmailToSave,
    };

    try {
      const res = await fetch("/api/p", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save data");

      localStorage.setItem("companyName", companyName);
      localStorage.setItem("transportMode", transportMode);
      localStorage.setItem("coverAmount", coverAmount);

      setShowModal(false);
      alert("Data saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving data. Check console for details.");
    }
  };

  const isContinueDisabled = () => {
    if (modalStep === 1) return !companyName.trim();
    if (modalStep === 2) return !transportMode;
    if (modalStep === 3) return !coverAmount.trim();
    return false;
  };

  const formatNumber = (num: string) =>
    num.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCoverAmount(formatNumber(e.target.value));

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCompanyName(e.target.value.replace(/\b\w/g, (c) => c.toUpperCase()));

  const numberToWords = (num: string) => {
    const val = parseInt(num.replace(/,/g, "")) || 0;
    if (val === 0) return "Zero Rupees";
    return `Rupees ${val.toLocaleString("en-IN")}`;
  };

  const persistedCommodity = typeof window !== "undefined" ? localStorage.getItem("commodity") : null;
  const persistedCoverType = typeof window !== "undefined" ? localStorage.getItem("coverType") : null;
  const persistedShipmentType = typeof window !== "undefined" ? localStorage.getItem("shipmentType") : null;
  const persistedMode = typeof window !== "undefined" ? localStorage.getItem("transportMode") : null;
  const persistedCoverAmount = typeof window !== "undefined" ? localStorage.getItem("coverAmount") : null;

  return (
    <>
      <Modal
        showModal={showModal}
        modalStep={modalStep}
        companyName={companyName}
        setCompanyName={setCompanyName}
        transportMode={transportMode}
        setTransportMode={setTransportMode}
        coverAmount={coverAmount}
        handleAmountChange={handleAmountChange}
        numberToWords={numberToWords}
        isContinueDisabled={isContinueDisabled}
        handleModalContinue={handleModalContinue}
        handleCompanyChange={handleCompanyChange}
      />

      <div className={`${styles.pageContent} ${showModal ? styles.blurred : ""}`}>
        <Navbar />

        {/* TOP BAR */}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => router.push("Marine1")}>←</button>
          <div className={styles.info}>
            <div>
              <span className={styles.label}>Commodity details</span>
              <span className={styles.value}>{persistedCommodity || "Electronic and white goods"}</span>
            </div>
            <div>
              <span className={styles.label}>Cover amount</span>
              <span className={styles.value}>
                {persistedCoverAmount ? `₹ ${formatNumber(persistedCoverAmount)}` : "₹ 1,23,456"}
              </span>
            </div>
            <div>
              <span className={styles.label}>Cover type</span>
              <span className={styles.value}>{persistedCoverType || "Annual open"}</span>
            </div>
            <div>
              <span className={styles.label}>Shipment type</span>
              <span className={styles.value}>{persistedShipmentType || "Export"}</span>
            </div>
            <div>
              <span className={styles.label}>Mode of transport</span>
              <span className={styles.value}>{persistedMode || "Road"}</span>
            </div>
            <button className={styles.editBtn}>✎ Edit your search</button>
          </div>
        </div>

        {/* MAIN WRAPPER */}
        <div className={styles.wrapper}>
          {/* LEFT */}
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
                  <button className={styles.quoteBtn} onClick={() => router.push("Marine6")}>Get quote</button>
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
                    <label className={styles.compare}><input type="checkbox" /> Add to compare</label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT */}
          <div className={styles.rightsection}>
            <div className={styles.right}>
              <h4 className={styles.title}>Events & Conference</h4>
              <div className={styles.thumbnail}><button className={styles.playBtn}>▶</button></div>
              <p className={styles.date}>13th February | 3:00 PM | <span className={styles.webinar}>Webinar (Online)</span></p>
              <h5 className={styles.heading}>FIEO - Federation of Indian Export Organisation (Ministry of commerce)</h5>
              <p className={styles.desc}>Moments from our recent webinar on Role of Insurance in managing Export Supply Chain risk</p>
              <a href="#" className={styles.link}>Read more →</a>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Marine5;
