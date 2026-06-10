"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/VehicleVariantDialog.module.css";
import { FiMapPin, FiEdit2, FiSearch } from "react-icons/fi";
import { FaTruck, FaCar } from "react-icons/fa";

interface VehicleVariantDialogProps {
  onClose: () => void;
  vehicleNumber: string;
  selectedVehicle: string;
  selectedBrand: string;
  selectedModel: string;
  onBackToModel: () => void;
onNextToYear: () => void;
  onSelectVariant: (variant: string) => void;   
}

const VehicleVariantDialog: React.FC<VehicleVariantDialogProps> = ({
  onClose,
  vehicleNumber,
  selectedVehicle,
  selectedBrand,
  selectedModel,
  onSelectVariant,
   onBackToModel,
  onNextToYear,
}) => {
  const [search, setSearch] = useState("");

  const variants = [
    { name: "35000 GVW - DIESEL", weight: "35000", seating: "3" },
    { name: "BSIV - DIESEL", weight: "35200", seating: "3" },
    { name: "CAR CARRIER GVW 35200 - DIESEL", weight: "35200", seating: "3" },
    { name: "TT CBC - DIESEL", weight: "35200", seating: "3" },
    { name: "g DCR39HSD 85B6M5 TT - CNG", weight: "35200", seating: "3" },
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* Left Section */}
        <div className={styles.left}>
          <h3 className={styles.leftTitle}>Your selection</h3>
          <div className={styles.selectionBox}>
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
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.right}>
          <div className={styles.header}>
            <button className={styles.arrowBtn} onClick={onBackToModel}>
              ‹
            </button>
            <span>Search Vehicle Variant</span>
            <button className={styles.arrowBtn} onClick={onNextToYear}>
              ›
            </button>
          </div>           

          {/* Search Bar */}
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Vehicle Variant"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Variant List */}
          <div className={styles.variantGrid}>
            {variants
              .filter((v) => v.name.toLowerCase().includes(search.toLowerCase()))
              .map((v, i) => (
                <button
                  key={i}
                  className={styles.variantBtn}
                  onClick={() => onSelectVariant(v.name)}
                >
                  <div className={styles.variantName}>{v.name}</div>
                  <div className={styles.variantInfo}>
                    Weight: {v.weight} | Seating Capacity: {v.seating}
                  </div>
                  <span className={styles.arrow}></span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleVariantDialog;