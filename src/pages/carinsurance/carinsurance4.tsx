import React, { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import styles from "@/styles/pages/carinsurance4.module.css";
import carImage from "@/assets/pageImages/blackcar.png";
import UserDetails from "@/components/ui/UserDetails";
import { useRouter } from "next/router";
import { IoIosArrowBack } from "react-icons/io";
import { FaArrowRight } from "react-icons/fa6";
import indiaFlag from "@/assets/pageImages/Flag_of_India.png";
import AOS from "aos";
import "aos/dist/aos.css";

const daysOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

interface GenerateMonthFn {
  (year: number, month: number): (number | string)[];
}

const generateMonth: GenerateMonthFn = (year, month) => {
  const firstDay: number = new Date(year, month, 1).getDay();
  const totalDays: number = new Date(year, month + 1, 0).getDate();

  const dates: (number | string)[] = Array(firstDay).fill(""); // empty slots before 1st
  for (let i = 1; i <= totalDays; i++) dates.push(i);

  while (dates.length % 7 !== 0) dates.push(""); // pad to full weeks

  return dates;
};

const CarInsurance4 = () => {
  const router = useRouter();

  const [step, setStep] = useState<"form" | "calendar" | "claim">("form"); // toggle UI
  const [monthsShown, setMonthsShown] = useState<number>(2);
  const [currentMonth, setCurrentMonth] = useState<number>(7); // August 2025

  // AOS animation
    useEffect(() => {
      AOS.init({ duration: 1000, once: true });
    }, []);

  useEffect(() => {
    const updateMonths = () => {
      if (window.innerWidth <= 768) {
        setMonthsShown(1);
      } else {
        setMonthsShown(2);
      }
    };
    updateMonths();
    window.addEventListener("resize", updateMonths);
    return () => window.removeEventListener("resize", updateMonths);
  }, []);

  const getMonthData = (offset = 0) => {
    const month = currentMonth + offset;
    const year = 2025 + Math.floor(month / 12);
    const actualMonth = month % 12;

    const label = new Date(year, actualMonth).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    const dates = generateMonth(year, actualMonth);
    return { dates, label: label.toUpperCase() };
  };

  const current = getMonthData(0);
  const next = getMonthData(1);

  return (
    <div className={styles.mainContainer}>
      <UserDetails />
      <Navbar />

      <div className={styles.pageContainer}>
        {/* LEFT SECTION */}
        <div className={styles.leftSection}>
          {/* STEP 1: FORM */}
          {step === "form" && (
            <div className={styles.formWrapper} data-aos="fade-right">
              <div className={styles.header}>
                <div className={styles.iconBox}>
                  <IoIosArrowBack className={styles.arrow} />
                </div>
                <p className={styles.titleText}>
                  Almost done! Just one last step
                </p>
              </div>

              <input
                type="text"
                placeholder="Full Name"
                aria-label="Full Name"
                className={styles.input}
              />

              <div className={styles.mobileInputGroup}>
                <div className={styles.flagWrapper}>
                  <Image
                    className={styles.flagImg}
                    src={indiaFlag}
                    alt="India Flag"
                    width={24}
                    height={16}
                  />
                  <span>+91</span>
                </div>
                <input
                  type="text"
                  aria-label="Mobile Number"
                  placeholder="Mobile number"
                  className={styles.mobileInput}
                />
              </div>

              <button
                className={styles.submitButton}
                onClick={() => setStep("calendar")}
                aria-label="View Prices"
              >
                View Prices <FaArrowRight />
              </button>

              <p className={styles.terms}>
                By clicking on "View Prices", you agree to our{" "}
                <span className={styles.link}>Privacy Policy</span> &{" "}
                <span className={styles.link}>Terms of Use</span>
              </p>
            </div>
          )}

          {/* STEP 2: CALENDAR */}
          {step === "calendar" && (
            <div className={styles.outerBox} data-aos="fade">
              <div className={styles.innerBox}>
                <div className={styles.headingBox}>
                  <h2 className={styles.heading}>
                    When does your 'Own Damage' policy expire?
                  </h2>
                  <p className={styles.subtext}>
                    This is the policy you bought last year
                  </p>
                </div>

                <div className={styles.datepickerWrapper}>
                  <div className={styles.calendarWrapper}>
                    {/* Current Month */}
                    <div className={styles.calendar}>
                      <div className={styles.header}>
                        <span
                          className={styles.arrow}
                          onClick={() => setCurrentMonth((prev) => prev - 1)}
                        >
                          ◀
                        </span>
                        <span className={styles.monthYear}>
                          {current.label}
                        </span>
                        {monthsShown === 1 && (
                          <span
                            className={styles.arrow}
                            onClick={() => setCurrentMonth((prev) => prev + 1)}
                          >
                            ▶
                          </span>
                        )}
                      </div>
                      <div className={styles.daysRow}>
                        {daysOfWeek.map((day) => (
                          <div key={day} className={styles.day}>
                            {day}
                          </div>
                        ))}
                        {current.dates.map((date, index) => (
                          <div
                            key={index}
                            className={`${styles.date} ${
                              date ? styles.clickable : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (date) setStep("claim");
                            }}
                          >
                            {date}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Next Month (desktop only) */}
                    {monthsShown === 2 && (
                      <div className={styles.calendar}>
                        <div className={styles.header}>
                          <span className={styles.monthYear}>
                            {next.label}
                          </span>
                          <span
                            className={styles.arrow}
                            onClick={() =>
                              setCurrentMonth((prev) => prev + 1)
                            }
                          >
                            ▶
                          </span>
                        </div>
                        <div className={styles.daysRow}>
                          {daysOfWeek.map((day) => (
                            <div key={day} className={styles.day}>
                              {day}
                            </div>
                          ))}
                          {next.dates.map((date, index) => (
                            <div
                              key={index}
                              className={`${styles.date} ${
                                date ? styles.clickable : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (date) setStep("claim");
                              }}
                            >
                              {date}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.helpLinkContainer}>
                  <a href="#" className={styles.helpLink}>
                    Don't know policy expiry date?
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CLAIM DETAILS (merged from carinsurance5) */}
          {step === "claim" && (
            <div className={styles.outerBoxClaim} data-aos="fade">
              <div className={styles.innerBoxClaim}>
                <div className={styles.claimDetails}>
                  <h2 className={styles.sectionTitle}>Claim detail</h2>
                </div>
                <p className={styles.question}>
                  Did you make a claim in your existing policy?
                </p>

                <div className={styles.options}>
                  <button
                    className={styles.optionButton}
                    onClick={() => router.push("./carinsurance3")}
                  >
                    Yes
                  </button>
                  <button
                    className={styles.optionButton}
                    onClick={() => router.push("./carinsurance3")}
                  >
                    No
                  </button>
                  <button
                    className={styles.optionButton}
                    onClick={() => router.push("./carinsurance3")}
                  >
                    Not sure
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SECTION */}
        <div className={styles.rightSection}>
          <div className={styles.imageContainer}>
            <Image
              src={carImage}
              alt="Car"
              className={styles.carImage}
              priority
              fill
              sizes="(max-width: 768px) 100vw, 
                     (max-width: 1200px) 50vw, 
                     33vw"
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CarInsurance4;
