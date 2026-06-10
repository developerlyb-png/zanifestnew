"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import styles from "@/styles/pages/Travel/travel1.module.css";
import {
  FiShield,
  FiXCircle,
  FiBriefcase,
  FiBox,
  FiUsers,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiMinus,
} from "react-icons/fi";

import schengenImg from "@/assets/travel/liberty.jpg";
import usaImg from "@/assets/travel/liberty.jpg";
import germanyImg from "@/assets/travel/liberty.jpg";
import ukImg from "@/assets/travel/liberty.jpg";
import franceImg from "@/assets/travel/liberty.jpg";
import netherlandsImg from "@/assets/travel/liberty.jpg";

import AOS from "aos";
import "aos/dist/aos.css";

import TravelPromptDialog from "@/components/Dialog/PromptDialog";
import LoginDialog from "@/components/Dialog/LoginDialog";
import RegisterDialog from "@/components/Dialog/RegisterDialog";

type Country = { name: string; img: any };

const countries: Country[] = [
  { name: "Schengen", img: schengenImg },
  { name: "USA", img: usaImg },
  { name: "Germany", img: germanyImg },
  { name: "United Kingdom", img: ukImg },
  { name: "France", img: franceImg },
  { name: "Netherlands", img: netherlandsImg },
];

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ------------------ CALENDAR COMPONENT ------------------ */
type CalendarProps = {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

function CalendarMonth({
  year,
  month,
  startDate,
  endDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarProps) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  const isInRange = (d: Date) => {
    if (!startDate || !endDate) return false;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return d >= s && d <= e;
  };

  const isSelected = (d: Date) =>
    (startDate && isoDate(d) === startDate) ||
    (endDate && isoDate(d) === endDate);

  return (
    <div className={styles.calendarMonth}>
      <div className={styles.calendarHeader}>
        <button className={styles.navBtn} onClick={onPrevMonth}>
          <FiChevronLeft />
        </button>
        <span className={styles.monthName}>
          {firstDay.toLocaleString("default", { month: "long" })} {year}
        </span>
        <button className={styles.navBtn} onClick={onNextMonth}>
          <FiChevronRight />
        </button>
      </div>

      <div className={styles.calendarGrid}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d} className={styles.calendarDayName}>
            {d}
          </div>
        ))}

        {days.map((d, idx) =>
          d ? (
            <button
              key={idx}
              className={`${styles.calendarDate} 
                ${isInRange(d) ? styles.inRange : ""} 
                ${isSelected(d) ? styles.selectedDate : ""}`}
              onClick={() => onSelectDate(isoDate(d))}
            >
              {d.getDate()}
            </button>
          ) : (
            <div key={idx} className={styles.emptyCell}></div>
          )
        )}
      </div>
    </div>
  );
}

/* ------------------ MAIN COMPONENT START ------------------ */

export default function TravelInsurance() {
  const router = useRouter();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const [showCalendar, setShowCalendar] = useState(false);

  // TRAVELLERS
  const [travellers, setTravellers] = useState<number>(1);
  const [travellersInfo, setTravellersInfo] = useState<
    { age: string; hasCondition: boolean }[]
  >([{ age: "", hasCondition: false }]);

  const [medicalCondition, setMedicalCondition] = useState<string>("No");

  // drawer modals
  const [showTravellerModal, setShowTravellerModal] = useState(false);
  const [showTravellerInput, setShowTravellerInput] = useState(false);

  // auth dialogs
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // user info
  const [tempRecordId, setTempRecordId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);
  /* ------------------ COUNTRY SELECT ------------------ */
  const toggleCountry = (name: string) => {
    setSelected((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  };

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  /* ------------------ DATE SELECT ------------------ */
  const handleSelectDate = (date: string) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate("");
    } else if (!endDate) {
      if (new Date(date) >= new Date(startDate)) {
        setEndDate(date);
      } else {
        setStartDate(date);
      }
    }
  };

  const tripDuration =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  /* ------------------ TRAVELLER FUNCTIONS ------------------ */
  const resizeTravellersInfo = (count: number) => {
    setTravellersInfo((prev) => {
      const copy = [...prev];
      if (copy.length > count) return copy.slice(0, count);

      while (copy.length < count) {
        copy.push({ age: "", hasCondition: false });
      }
      return copy;
    });
  };

  const handleTravellerCountClick = (count: number) => {
    setTravellers(count);
    resizeTravellersInfo(count);
  };

  const handleTravellerAgeChange = (i: number, age: string) => {
    setTravellersInfo((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], age };
      return copy;
    });
  };

  const toggleTravellerCondition = (i: number) => {
    setTravellersInfo((prev) => {
      const copy = [...prev];
      copy[i].hasCondition = !copy[i].hasCondition;
      return copy;
    });
  };

  const handleTravellerInputChange = (change: number) => {
    setTravellers((prev) => {
      let newCount = prev + change;
      if (newCount < 6) newCount = 6;
      if (newCount > 10) newCount = 10;
      resizeTravellersInfo(newCount);
      return newCount;
    });
  };

  const handleMedicalConditionChange = (value: string) => {
    setMedicalCondition(value);
    if (value === "No") {
      setTravellersInfo((prev) =>
        prev.map((t) => ({ ...t, hasCondition: false }))
      );
    }
  };

  const handleTravellerModalDone = () => {
    setShowTravellerModal(false);
    alert("Traveller details saved!");
  };
  

  /* ------------------ BUILD PAYLOAD ------------------ */
 const buildPayload = () => ({
  countries: selected,
  startDate,
  endDate,
  travellers,
  medicalCondition,
  travellersInfo: travellersInfo.map((t, i) => ({
    travellerId: i + 1,
    age: Number(t.age) || null,
    hasMedicalCondition: t.hasCondition,
  })),
  email: null as string | null,   // <-- ADD THIS LINE
});


  /* ------------------ SAVE PAYLOAD ------------------ */
 const savePayload = async (emailValue: string) => {
  const payload = buildPayload();
  payload.email = emailValue;  // always set manually

  try {
    const res = await fetch("/api/travelinsurance", {
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


  /* ------------------ UPDATE EMAIL AFTER LOGIN ------------------ */
  const updateRecordEmail = async (id: string, email: string) => {
    try {
      const res = await fetch("/api/travelinsurance/updateEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, email }),
      });

      const data = await res.json();
      return res.ok && data.success;
    } catch {
      return false;
    }
  };

  /* ------------------ EXPLORE CLICK ------------------ */
  const handleExploreClick = async () => {
  if (!selected.length || !startDate || !endDate) {
    alert("Please fill all required fields");
    return;
  }

  // CASE 1 — User is already logged in
  if (isLoggedIn && loggedInEmail) {
    const saved = await savePayload(loggedInEmail);
    if (saved) router.push("/Travel/Travel4");
    return;
  }

  // CASE 2 — Not logged in → Open prompt dialog
  setShowPromptDialog(true);
};

  /* ------------------ PROMPT DIALOG HANDLERS ------------------ */
 const handlePromptCancel = async () => {
  setShowPromptDialog(false);

  const saved = await savePayload("unregistered_user");

  if (saved && saved._id) {
    setTempRecordId(saved._id);
  }

  router.push("/Travel/Travel4");
};


  const handlePromptLogin = () => {
    setShowPromptDialog(false);
    setShowLoginDialog(true);
  };

  const handlePromptRegister = () => {
    setShowPromptDialog(false);
    setShowRegisterDialog(true);
  };

  /* ------------------ LOGIN SUCCESS ------------------ */
  const handleLoginSuccess = async (email: string) => {
    setShowLoginDialog(false);
    setIsLoggedIn(true);
    setLoggedInEmail(email);

    // update saved data
    if (tempRecordId) {
      await updateRecordEmail(tempRecordId, email);
      setTempRecordId(null);
    } else {
      await savePayload(email);
    }

    router.push("/Travel/Travel4");
  };

  /* ------------------ REGISTER SUCCESS ------------------ */
  const handleRegisterSuccess = async ({ email }: { email: string }) => {
    setShowRegisterDialog(false);

    // open login dialog automatically
    setTimeout(() => setShowLoginDialog(true), 200);
  };

  /* ------------------ JSX UI ------------------ */
  return (
    <>
      <Navbar />

      <div className={styles.wrapper}>
        {/* LEFT SECTION */}
        <section className={styles.leftSection}>
          <h1 className={styles.heading}>
            Travel worry free starting at <span className={styles.price}>₹18/day*</span>
          </h1>
          <p className={styles.subText}>Instant quotes. Global coverage. Easy claims.</p>

          <h2 className={styles.whyHeading}>Why smart travellers choose insurance?</h2>

          <ul className={styles.featureList}>
            <li>
              <span className={`${styles.icon} ${styles.green}`}><FiShield /></span>
              Medical emergencies
            </li>
            <li>
              <span className={`${styles.icon} ${styles.red}`}><FiXCircle /></span>
              Flight delays or cancellations
            </li>
            <li>
              <span className={`${styles.icon} ${styles.yellow}`}><FiBriefcase /></span>
              Lost baggage & passport
            </li>
            <li>
              <span className={`${styles.icon} ${styles.blue}`}><FiBox /></span>
              Theft or loss of belongings
            </li>
          </ul>
        </section>

        {/* RIGHT SECTION */}
        <section className={styles.rightSection} data-aos="fade-left">
          <h3 className={styles.formHeading}>Where are you travelling to?</h3>

          <div className={styles.searchWrap}>
            <input
              type="text"
              placeholder="Search country"
              className={styles.inputBox}
              value={query}
              onChange={(e) =>
                setQuery(
                  e.target.value.replace(/\b\w/g, (char) => char.toUpperCase())
                )
              }
            />
          </div>

          <div className={styles.popularChoices}>
            <p className={styles.popularText}>
              Popular choices{" "}
              <span className={styles.muted}>(You can add more than one country)</span>
            </p>

            <div className={styles.countryList}>
              {filteredCountries.map((c) => (
                <button
                  key={c.name}
                  className={`${styles.countryCard} ${
                    selected.includes(c.name) ? styles.countryActive : ""
                  }`}
                  onClick={() => toggleCountry(c.name)}
                >
                  <Image src={c.img} alt={c.name} className={styles.countryImg} width={60} height={60} />
                  <span className={styles.countryName}>{c.name}</span>
                </button>
              ))}
            </div>

            {selected.length > 0 && (
              <div className={styles.selectedPills}>
                {selected.map((n) => (
                  <span key={n} className={styles.pill}>{n}</span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.dateRow}>
            <div className={styles.dateField}>
              <label className={styles.dateLabel}>Start date</label>
              <button className={styles.dateBtn} onClick={() => setShowCalendar(true)}>
                <FiCalendar />
                {startDate || "Select date"}
              </button>
            </div>

            <div className={styles.dateField}>
              <label className={styles.dateLabel}>End date</label>
              <button className={styles.dateBtn} onClick={() => setShowCalendar(true)}>
                <FiCalendar />
                {endDate || "Select date"}
              </button>
            </div>
          </div>

          <div className={styles.travellerBox}>
            <div className={styles.travellerLeft}>
              <FiUsers className={styles.travellerIcon} />
              <span>{travellers} Traveller(s)</span>
            </div>

            <button
              className={styles.addBtn}
              onClick={() => {
                setShowTravellerModal(true);
                resizeTravellersInfo(travellers);
              }}
            >
              + Add travellers
            </button>
          </div>

          <button className={styles.exploreBtn} onClick={handleExploreClick}>
            Explore Plans
          </button>
        </section>
      </div>

      <Footer />

      {/* ------------------ CALENDAR MODAL ------------------ */}
      {showCalendar && (
        <div className={styles.drawerOverlay}>
          <div className={styles.drawer}>
            <button className={styles.closeBtn} onClick={() => setShowCalendar(false)}>
              <FiXCircle />
            </button>

            <h2 className={styles.modalHeading}>
              When are you planning to travel to {selected[0] || "your destination"}?
            </h2>

            <div className={styles.calendarBox}>
              <CalendarMonth
                year={currentYear}
                month={currentMonth}
                startDate={startDate}
                endDate={endDate}
                onSelectDate={handleSelectDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />

              <CalendarMonth
                year={currentMonth === 11 ? currentYear + 1 : currentYear}
                month={(currentMonth + 1) % 12}
                startDate={startDate}
                endDate={endDate}
                onSelectDate={handleSelectDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />
            </div>

            {tripDuration > 0 && (
              <p className={styles.tripDuration}>Trip duration: {tripDuration} days</p>
            )}

            <button className={styles.modalContinueBtn} onClick={() => setShowCalendar(false)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ------------------ TRAVELLER MODAL ------------------ */}
      {showTravellerModal && (
        <div className={styles.drawerOverlay}>
          <div className={styles.drawer}>
            <button className={styles.closeBtn} onClick={() => setShowTravellerModal(false)}>
              <FiXCircle />
            </button>

            <h2 className={styles.modalHeading}>How many travellers?</h2>

            <div className={styles.travellerCountBtns}>
              {[1, 2, 3, 4, 5, "6+"].map((num) => (
                <button
                  key={num}
                  className={`${styles.travellerCountBtn} ${
                    travellers.toString() === num.toString() ? styles.travellerActive : ""
                  }`}
                  onClick={() => {
                    if (num === "6+") {
                      setShowTravellerInput(true);
                      handleTravellerCountClick(6);
                    } else {
                      setShowTravellerInput(false);
                      handleTravellerCountClick(num as number);
                    }
                  }}
                >
                  {num}
                </button>
              ))}
            </div>

            {showTravellerInput && (
              <div className={styles.travellerInputBox}>
                <label>No. of travellers</label>
                <div className={styles.travellerCounter}>
                  <button className={styles.counterBtn} onClick={() => handleTravellerInputChange(-1)}>
                    <FiMinus />
                  </button>

                  <span className={styles.travellerCountDisplay}>{travellers}</span>

                  <button className={styles.counterBtn} onClick={() => handleTravellerInputChange(1)}>
                    <FiPlus />
                  </button>
                </div>
              </div>
            )}

            <div className={styles.multipleAgeGrid}>
              {travellersInfo.map((t, idx) => (
                <div key={idx} className={styles.ageSelectWrap}>
                  <label className={styles.ageLabel}>Select age of traveller {idx + 1}</label>

                  <select
                    className={styles.ageSelect}
                    value={t.age}
                    onChange={(e) => handleTravellerAgeChange(idx, e.target.value)}
                  >
                    <option value="">Select age of traveller {idx + 1}</option>
                    {Array.from({ length: 100 }, (_, i) => i + 1).map((age) => (
                      <option key={age} value={age}>
                        {age} years
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <p className={styles.medicalQ}>
              Do any of the travellers have pre-existing medical conditions?
            </p>

            <div className={styles.radioGroupCustom}>
              <button
                className={`${styles.radioCustom} ${
                  medicalCondition === "Yes" ? styles.radioActive : ""
                }`}
                onClick={() => handleMedicalConditionChange("Yes")}
              >
                Yes
              </button>

              <button
                className={`${styles.radioCustom} ${
                  medicalCondition === "No" ? styles.radioActive : ""
                }`}
                onClick={() => handleMedicalConditionChange("No")}
              >
                No
              </button>
            </div>

            {medicalCondition === "Yes" && (
              <div className={styles.conditionGrid}>
                {travellersInfo.map((t, idx) => (
                  <button
                    key={idx}
                    className={`${styles.conditionCard} ${
                      t.hasCondition ? styles.conditionChecked : ""
                    }`}
                    onClick={() => toggleTravellerCondition(idx)}
                  >
                    <input
                      type="checkbox"
                      checked={t.hasCondition}
                      readOnly
                      className={styles.conditionCheckbox}
                    />

                    <div className={styles.conditionText}>
                      <div className={styles.conditionTitle}>Traveller {idx + 1}</div>
                      <div className={styles.conditionSub}>
                        {t.age ? `${t.age} years` : "Select age"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button className={styles.modalContinueBtn1} onClick={handleTravellerModalDone}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* ------------------ DIALOGS ------------------ */}
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
}
