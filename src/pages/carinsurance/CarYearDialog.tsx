"use client";

import styles from "@/styles/pages/carinsurance.module.css";

const years = [
  "Brand New Car",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
  "2015",
  "2014",
  "2013",
  "2012",
  "2011",
  "2010",
  "2009",
  "2008",
  "2007",
];

interface CarYearDialogProps {
  location: any;
  onEditLocation: () => void;
  onSelectYear: (year: string) => void;
  onClose: () => void;
}

export default function CarYearDialog({
  location,
  onEditLocation,
  onSelectYear,
  onClose,
}: CarYearDialogProps) {
  return (
    <div className={styles.vehicleModal}>
      <div className={styles.vehicleDialog}>

        {/* ================= LEFT SECTION ================= */}

        <div className={styles.vehicleLeft}>

          <h2>Your selection</h2>

          <div className={styles.selectedBox}>

            <div className={styles.selectionRow}>
              <span className={styles.locationIcon}>⌾</span>

              <span className={styles.locationValue}>
                {location?.state || ""}
                {location?.state && location?.rto ? " " : ""}
                {location?.rto || ""}
              </span>
            </div>

            <button
              type="button"
              className={styles.editBtn}
              onClick={onEditLocation}
              aria-label="Edit location"
            >
              ✎
            </button>

          </div>

        </div>


        {/* ================= RIGHT SECTION ================= */}

        <div className={styles.vehicleRight}>

          <div className={styles.yearHeader}>

            <button
              type="button"
              className={styles.yearBackBtn}
              onClick={onClose}
              aria-label="Go back"
            >
              ‹
            </button>

            <h2>Car Registration Year</h2>

          </div>


          <div className={styles.yearGrid}>

            {years.map((year) => (
              <button
                type="button"
                key={year}
                className={`${styles.yearItem} ${
                  year === "Brand New Car"
                    ? styles.brandNewItem
                    : ""
                }`}
                onClick={() => onSelectYear(year)}
              >
                <span>{year}</span>

                <span className={styles.yearArrow}>
                  ›
                </span>
              </button>
            ))}

          </div>

        </div>

      </div>
    </div>
  );
}