"use client";
import React from "react";
import styles from "@/styles/pages/CommercialVehicle/YearDialog.module.css";
import { FiEdit2, FiMapPin } from "react-icons/fi";
import { FaTruck, FaCar } from "react-icons/fa";
import { GiGearStickPattern } from "react-icons/gi";

interface YearDialogProps {
  onClose: () => void;
  vehicleNumber: string;
  selectedVehicle: string;
  selectedBrand: string;
  selectedModel: string;
   onBack: () => void; 
  selectedVariant: string;
  onSelectYear: (year: number) => void;
}

const yearDialog: React.FC<YearDialogProps> = ({
  onClose,
  vehicleNumber,
  selectedVehicle,
  selectedBrand,
  selectedModel,
  selectedVariant,
  onSelectYear,
  onBack
}) => {
  const years: number[] = [
    2024, 2023, 2022, 2021, 2020,
    2019, 2018, 2017, 2016, 2015,
    2014, 2013, 2012, 2011, 2010,
    2009, 2008, 2007, 2006,
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* Left Section */}
        <div className={styles.selectionBox}>
          <h3 className={styles.selectionTitle}>Your selection</h3>
          <div className={styles.selectionList}>
            <div className={styles.selectionItem}>
              <FiMapPin className={styles.icon} /> {vehicleNumber}
            </div>
            <div className={styles.selectionItem}>
              <FaTruck className={styles.icon} /> {selectedVehicle}
            </div>
            <div className={styles.selectionItem}>
              <FaCar className={styles.icon} /> {selectedBrand}
            </div>
            <div className={styles.selectionItem}>
              <FaCar className={styles.icon} /> {selectedModel}
            </div>
            <div className={styles.selectionItem}>
              <GiGearStickPattern className={styles.icon} /> {selectedVariant}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.yearBox}>
          <div className={styles.yearHeader}>
  <button className={styles.arrowBtn} onClick={onBack}>
              ‹
            </button>
            <span>Select Year</span>
            <button className={styles.arrowBtn} disabled>
              ›
            </button>
          </div>

          <div className={styles.yearGrid}>
            {years.map((year) => (
              <button
                key={year}
                type="button"
                className={styles.yearButton}
                onClick={() => {
                  onSelectYear(year);
                }}
              >
                {year}
                <span className={styles.arrow}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default yearDialog;