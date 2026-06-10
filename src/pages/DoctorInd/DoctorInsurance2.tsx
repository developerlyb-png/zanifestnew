"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/pages/DoctorInd/doctorinsurance2.module.css";
import futureImg from "@/assets/doctor/Future_Generali_India_Life_Insurance_logo.jpg";
import nationalInsurance from "@/assets/doctor/download.jpeg";
import sriram from "@/assets/doctor/sriram.png";
import balance from "@/assets/doctor/balance.png";
import call from "@/assets/doctor/call.png";
import manager from "@/assets/doctor/manager.png";
import flag from "@/assets/doctor/flag.png";
import quick from "@/assets/doctor/quick.png";
import ruppee from "@/assets/doctor/rupee.png";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";
import axios from "axios";

/* ---------- Small icons as components ---------- */
const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
    <path fill="#16a34a" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="M10 17l5-5-5-5v10z" />
  </svg>
);

const Lightning = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
    <path fill="#8b5cf6" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
  </svg>
);

const Bullet = ({ bg = "#EAF2FF", dot = "#3B82F6" }: { bg?: string; dot?: string }) => (
  <span className={styles.bullet} style={{ background: bg }}>
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="6" fill={dot} />
    </svg>
  </span>
);

/* ---------- Types ---------- */
type Stage = "drawer" | "center" | "done";

/* ---------- Component ---------- */
const DoctorInsurance2: React.FC = () => {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("drawer");
  const [selectedSpec, setSelectedSpec] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [firstTime, setFirstTime] = useState<null | "yes" | "no">(null);
  const [facility, setFacility] = useState<null | "yes" | "no">(null);

  const isModalOpen = stage !== "done";

  const popular = [
    "Dental Surgeon",
    "General physician",
    "General Surgeon",
    "Anaesthesiologist",
    "Orthopaedic Surgeon",
  ];

  const specializationGroups: { group: string; items: string[] }[] = [
    { group: "Anaesthesiologist", items: ["Anaesthesiologist", "Cardiac Anaesthesiologist"] },
    {
      group: "Consultant General Physicians, Pathologist and Radiologist",
      items: [
        "General physician",
        "Ayurvedic General Physician",
        "Homeopathic Physician",
        "Pathologist",
        "Radiologist",
        "Unani General Practitioner",
      ],
    },
    { group: "Gynaecologist and Obstetrician", items: ["Gynaecologist", "Obstetrician"] },
  ];

  const filteredGroups = specializationGroups.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.toLowerCase().includes(searchQuery.toLowerCase())),
  }));

  /* ---------- Final submit: update saved doctor record ---------- */
  const handleFinalSubmit = async () => {
    try {
      const id = localStorage.getItem("doctorId");
      if (!id) {
        alert("Missing doctor ID. Please start again.");
        return;
      }

      setSaving(true);

      // Build payload
      const payload = {
        specialization: selectedSpec || null,
        firstTime: firstTime || null,
        facility: facility || null,
      };

      const res = await axios.put(`/api/doctorinsurance?id=${id}`, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (res?.data?.success) {
        // Success — show confirmation and go to done stage
        alert("Data saved successfully!");
        setStage("done");
        // Optionally redirect to quotes page:
        // router.push("/Doctor/DoctorInsurance5");
      } else {
        alert("Failed to save updates.");
      }
    } catch (err: any) {
      console.error("Error updating doctor:", err);
      alert("Error updating data. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <UserDetails />
      <Navbar />

      <div className={styles.page}>
        {/* ===== Step 1: RIGHT DRAWER with Search ===== */}
        {stage === "drawer" && (
          <div className={styles.drawerOverlay} aria-modal="true" role="dialog">
            <div className={styles.drawerPanel}>
              <div className={styles.drawerHeader}>
                <h3>Tell us about your specialization</h3>
              </div>

              <div className={styles.searchBox}>
                <div className={styles.searchInputWrap}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                    <path
                      fill="#64748b"
                      d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search specialization"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i className={styles.chevDown} />
                </div>
              </div>

              <div className={styles.popularSection}>
                <div className={styles.popularHeader}>
                  <span>Popular specialization</span>
                  <em />
                </div>
                <div className={styles.tagContainer}>
                  {popular.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={styles.tag}
                      onClick={() => {
                        setSelectedSpec(p);
                        setSearchQuery(p);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.specializationsList}>
                {filteredGroups.map(
                  (g) =>
                    g.items.length > 0 && (
                      <div className={styles.specializationGroup} key={g.group}>
                        <h4>{g.group}</h4>
                        {g.items.map((item) => (
                          <label key={item} className={styles.radioRow}>
                            <input
                              type="radio"
                              name="spec"
                              value={item}
                              checked={selectedSpec === item}
                              onChange={(e) => setSelectedSpec(e.target.value)}
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    )
                )}
              </div>

              <button
                className={styles.continueBtn}
                disabled={!selectedSpec}
                onClick={() => setStage("center")}
              >
                Continue <ArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ===== Step 2: CENTERED MODAL (Yes/No) ===== */}
        {stage === "center" && (
          <div className={styles.centerOverlay} aria-modal="true" role="dialog">
            <div className={styles.centerModal}>
              <div className={styles.centerHeader}>
                <h3>Just one last thing before you get your quotes</h3>
              </div>

              <div className={styles.centerBody}>
                <p>Are you buying for the first time?</p>
                <div className={styles.optionRow}>
                  <label
                    className={`${styles.optionBox} ${
                      firstTime === "yes" ? styles.optionSelected : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="firstTime"
                      checked={firstTime === "yes"}
                      onChange={() => setFirstTime("yes")}
                    />
                    <span className={styles.radioDot} />
                    <span>Yes</span>
                  </label>
                  <label
                    className={`${styles.optionBox} ${
                      firstTime === "no" ? styles.optionSelected : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="firstTime"
                      checked={firstTime === "no"}
                      onChange={() => setFirstTime("no")}
                    />
                    <span className={styles.radioDot} />
                    <span>No</span>
                  </label>
                </div>

                <p>
                  Do you operate/ own a medical facility such as a clinic, hospital or similar?
                </p>
                <div className={styles.optionRow}>
                  <label
                    className={`${styles.optionBox} ${facility === "yes" ? styles.optionSelected : ""}`}
                  >
                    <input
                      type="radio"
                      name="facility"
                      checked={facility === "yes"}
                      onChange={() => setFacility("yes")}
                    />
                    <span className={styles.radioDot} />
                    <span>Yes</span>
                  </label>
                  <label
                    className={`${styles.optionBox} ${facility === "no" ? styles.optionSelected : ""}`}
                  >
                    <input
                      type="radio"
                      name="facility"
                      checked={facility === "no"}
                      onChange={() => setFacility("no")}
                    />
                    <span className={styles.radioDot} />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <button
                className={styles.continueBtn}
                disabled={!(firstTime && facility) || saving}
                onClick={handleFinalSubmit}
              >
                {saving ? "Saving..." : "Continue"} <ArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ===== Step 3: FULL PAGE (your existing page) ===== */}
        <div className={`${styles.pageContent} ${isModalOpen ? styles.blurred : ""}`}>
          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.field}>
              <label>Cover amount</label>
              <div className={styles.input}>
                <span>1 Crore</span>
                <i />
              </div>
            </div>
            <div className={styles.field}>
              <label>Profession</label>
              <div className={styles.input}>
                <span>Doctor/Medical Practitio</span>
                <i />
              </div>
            </div>
            <div className={styles.field}>
              <label>Specialization</label>
              <div className={styles.input}>
                <span>{selectedSpec || "Anaesthesiologist"}</span>
                <i />
              </div>
            </div>
          </div>

          <div className={styles.grid}>
            {/* LEFT: Plans */}
            <div className={styles.left}>
              {/* Card 1 */}
              <div className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.brandRow}>
                    <Image className={styles.logo} src={futureImg} alt="Future Generali" />
                    <span className={styles.vDivider} />
                    <span className={styles.product}>Professional Indemnity</span>
                  </div>

                  <div className={styles.coverAmount}>
                    <span className={styles.coverLabel}>Covered amount</span>
                    <span className={styles.coverValue}>₹ 1 Crore</span>
                  </div>

                  <div className={styles.ctaBlock}>
                    <label className={styles.compare}>
                      <input type="checkbox" />
                      <span>Add to compare</span>
                    </label>

                    <button
                      className={styles.priceBtn}
                      onClick={() => router.push("DoctorInsurance5")}
                    >
                      <span className={styles.priceText}>₹ 5,553</span>
                      <span className={styles.priceArrow}>
                        <ArrowRight />
                      </span>
                    </button>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.coverages}>
                  <span className={styles.tcTitle}>Top coverages</span>
                  <span className={styles.pill}>
                    <Check /> Defamation
                  </span>
                  <span className={styles.pill}>
                    <Check /> Loss of Documents
                  </span>
                  <span className={styles.pill}>
                    <Check /> Investigation cost
                  </span>
                  <span className={`${styles.pill} ${styles.pillMore}`}>
                    +7 risks covered <ArrowRight />
                  </span>
                </div>
              </div>

              {/* Card 2 */}
              <div className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.brandRow}>
                    <Image className={styles.logoNI} src={nationalInsurance} alt="National Insurance" />
                    <span className={styles.vDivider} />
                    <span className={styles.product}>Professional Indemnity</span>
                  </div>

                  <div className={styles.coverAmount}>
                    <span className={styles.coverLabel}>Covered amount</span>
                    <span className={styles.coverValue}>₹ 1 Crore</span>
                  </div>

                  <div className={styles.ctaBlock}>
                    <label className={styles.compare}>
                      <input type="checkbox" />
                      <span>Add to compare</span>
                    </label>

                    <button
                      className={styles.priceBtn}
                      onClick={() => router.push("DoctorInsurance5")}
                    >
                      <span className={styles.priceText}>₹ 8,850</span>
                      <span className={styles.priceArrow}>
                        <ArrowRight />
                      </span>
                    </button>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.coverages}>
                  <span className={styles.tcTitle}>Top coverages</span>
                  <span className={styles.pill}>
                    <Check /> Omission / negligence
                  </span>
                  <span className={styles.pill}>
                    <Check /> Bodily injury
                  </span>
                  <span className={styles.pill}>
                    <Check /> Investigation cost
                  </span>
                  <span className={`${styles.pill} ${styles.pillMore}`}>
                    +6 risks covered <ArrowRight />
                  </span>
                </div>
              </div>

              {/* Card 3 */}
              <div className={styles.card}>
                <div className={styles.ribbon}>
                  <Lightning />
                  <span>Instant Policy</span>
                </div>

                <div className={styles.cardTop}>
                  <div className={styles.brandRow}>
                    <Image className={styles.logo} src={sriram} alt="Shriram General" />
                    <span className={styles.vDivider} />
                    <span className={styles.product}>Professional Indemnity</span>
                  </div>

                  <div className={styles.coverAmount}>
                    <span className={styles.coverLabel}>Covered amount</span>
                    <span className={styles.coverValue}>₹ 1 Crore</span>
                  </div>

                  <div className={styles.ctaBlock}>
                    <label className={styles.compare}>
                      <input type="checkbox" />
                      <span>Add to compare</span>
                    </label>

                    <button
                      className={styles.priceBtn}
                      onClick={() => router.push("DoctorInsurance5")}
                    >
                      <span className={styles.priceText}>₹ 12,213</span>
                      <span className={styles.priceArrow}>
                        <ArrowRight />
                      </span>
                    </button>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.coverages}>
                  <span className={styles.tcTitle}>Top coverages</span>
                  <span className={styles.pill}>
                    <Check /> Omission / negligence
                  </span>
                  <span className={styles.pill}>
                    <Check /> Bodily injury
                  </span>
                  <span className={styles.pill}>
                    <Check /> Investigation cost
                  </span>
                  <span className={`${styles.pill} ${styles.pillMore}`}>
                    +4 risks covered <ArrowRight />
                  </span>
                </div>
              </div>

              {/* Expert Team */}
              <div className={styles.experts}>
                <h3>Our Expert Team</h3>
                <div className={styles.expertRow}>
                  <div className={styles.expertCard}>
                    <img
                      src="https://randomuser.me/api/portraits/men/32.jpg"
                      alt="Dinesh Waghlela"
                    />
                    <div>
                      <h4>Dinesh Waghlela</h4>
                      <p>Associate Director &amp; Mentor</p>
                    </div>
                  </div>
                  <div className={styles.expertCard}>
                    <img
                      src="https://randomuser.me/api/portraits/men/12.jpg"
                      alt="A V Rao"
                    />
                    <div>
                      <h4>A V Rao</h4>
                      <p>VP &amp; Mentor - Fire, Engineering &amp; Marine</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Why Doctors buy */}
            <aside className={styles.right}>
              <h3>Why Doctors buy from Zanifest for Business ?</h3>

              <div className={styles.reason}>
                <Image className={styles.logo1} src={balance} alt="Balance" />
                <div>
                  <strong>Medico-Legal Lawyer Panel</strong>
                  <p>Expert panel of medico-legal lawyers to represent doctors</p>
                </div>
              </div>

              <div className={styles.reason}>
                <Image className={styles.logo1} src={call} alt="Call" />
                <div>
                  <strong>Within 4 hrs Lawyer Allocation Promise</strong>
                  <p>You will have legal representation allocated within 4 hours</p>
                </div>
              </div>

              <div className={styles.reason}>
                <Image className={styles.logo1} src={ruppee} alt="Rupee" />
                <div>
                  <strong>Affordable Pricing</strong>
                  <p>We provide you the best prices in the market with excellent services</p>
                </div>
              </div>

              <div className={styles.reason}>
                <Image className={styles.logo1} src={manager} alt="Manager" />
                <div>
                  <strong>Dedicated Relationship Manager</strong>
                  <p>A full-time relationship manager is assigned for all your insurance needs</p>
                </div>
              </div>

              <div className={styles.reason}>
                <Image className={styles.logo1} src={flag} alt="Flag" />
                <div>
                  <strong>365 Days Claim Assistance</strong>
                  <p>Our claim experts are available 365 days to help you with claim initiation and status</p>
                </div>
              </div>

              <div className={styles.reason}>
                <Image className={styles.logo1} src={quick} alt="Quick" />
                <div>
                  <strong>Instant Policy Copy</strong>
                  <p>Get policy copy instantly in 5 clicks</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default DoctorInsurance2;
