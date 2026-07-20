// src/pages/carinsurance/PolicyExpiryDialog.tsx
import { useEffect, useState } from "react";
import styles from "@/styles/pages/policyExpiryDialog.module.css";
import { FaTimes } from "react-icons/fa";

interface PolicyExpiryDialogProps {
  open: boolean;
  onSelect: (isoDate: string | null) => void;
  onClose: () => void;
}

const daysOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const generateMonth = (year: number, month: number): (number | null)[] => {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const dates: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= totalDays; i++) dates.push(i);
  while (dates.length % 7 !== 0) dates.push(null);
  return dates;
};

const toIso = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;

const PolicyExpiryDialog = ({
  open,
  onSelect,
  onClose,
}: PolicyExpiryDialogProps) => {
  const [monthsShown, setMonthsShown] = useState(2);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    const updateMonths = () => {
      setMonthsShown(window.innerWidth <= 768 ? 1 : 2);
    };
    updateMonths();
    window.addEventListener("resize", updateMonths);
    return () => window.removeEventListener("resize", updateMonths);
  }, []);

  useEffect(() => {
    if (open) setMonthOffset(0);
  }, [open]);

  if (!open) return null;

  const today = new Date();

  const getMonthData = (offset: number) => {
    const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const label = base
      .toLocaleString("default", { month: "long", year: "numeric" })
      .toUpperCase();
    return { year, month, label, dates: generateMonth(year, month) };
  };

  const monthsToRender = Array.from({ length: monthsShown }, (_, i) =>
    getMonthData(monthOffset + i)
  );

  const isToday = (year: number, month: number, day: number) =>
    year === today.getFullYear() &&
    month === today.getMonth() &&
    day === today.getDate();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              When does your &apos;Own Damage&apos; policy expire?
            </h2>
            <p className={styles.subtitle}>
              This is the policy you bought last year
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className={styles.calendarWrapper}>
          <span
            className={styles.navArrow}
            onClick={() => setMonthOffset((prev) => prev - 1)}
          >
            ◀
          </span>

          {monthsToRender.map(({ year, month, label, dates }) => (
            <div className={styles.calendar} key={`${year}-${month}`}>
              <div className={styles.monthYear}>{label}</div>
              <div className={styles.daysRow}>
                {daysOfWeek.map((d) => (
                  <div key={d} className={styles.dayLabel}>
                    {d}
                  </div>
                ))}
                {dates.map((day, idx) => (
                  <div
                    key={idx}
                    className={`${styles.date} ${
                      day ? styles.clickable : ""
                    } ${day && isToday(year, month, day) ? styles.today : ""}`}
                    onClick={() =>
                      day && onSelect(toIso(year, month, day))
                    }
                  >
                    {day || ""}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <span
            className={styles.navArrow}
            onClick={() => setMonthOffset((prev) => prev + 1)}
          >
            ▶
          </span>
        </div>

        <div className={styles.helpLinkContainer}>
          <span className={styles.helpLink} onClick={() => onSelect(null)}>
            Don&apos;t know policy expiry date?
          </span>
        </div>
      </div>
    </div>
  );
};

export default PolicyExpiryDialog;
