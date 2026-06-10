"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/VehicleVariantDialog.module.css";
import { FiMapPin, FiSearch } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { BiGasPump } from "react-icons/bi";
import { GiGearStickPattern } from "react-icons/gi";

interface SelectFuelTypeProps {
  onClose: () => void;
  vehicleNumber: string;
  selectedVehicle: string;
  selectedBrand: string;
  selectedModel: string;
  selectedVariant: string;
  selectedFuel: string;
  onBackToModel: () => void;
  onNextToVariant: () => void;
  onSelectFuel: (fuel: string) => void;
}

const fuelTypes = ["Petrol", "Diesel", "CNG", "Electric"];

const SelectFuelType: React.FC<SelectFuelTypeProps> = ({
  onClose,
  vehicleNumber,
  selectedVehicle,
  selectedBrand,
  selectedModel,
  selectedVariant,
  selectedFuel,
  onBackToModel,
  onNextToVariant,
  onSelectFuel,
}) => {
  const [search, setSearch] = useState("");
  const [activeFuel, setActiveFuel] = useState("");

  const filteredFuel = fuelTypes.filter((f) =>
    f.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* Left Panel */}
        <div className={styles.left}>
          <h3 className={styles.leftTitle}>Your Selection</h3>
          <div className={styles.selectionBox}>
            <div className={styles.selectionItem}>
              <FiMapPin className={styles.icon} /> {vehicleNumber}
            </div>
            <div className={styles.selectionItem}>
              <FiMapPin className={styles.icon} /> {selectedVehicle}
            </div>
            <div className={styles.selectionItem}>
              <FaCar className={styles.icon} /> {selectedBrand}
            </div>
            <div className={styles.selectionItem}>
              <FaCar className={styles.icon} /> {selectedModel}
            </div>
            {selectedFuel && (
              <div className={styles.selectionItem}>
                <BiGasPump className={styles.icon} /> {selectedFuel}
              </div>
            )}
            {selectedVariant && (
              <div className={styles.selectionItem}>
                <GiGearStickPattern className={styles.icon} /> {selectedVariant}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className={styles.right}>
          <div className={styles.header} style={{ justifyContent: "center" }}>
            <button className={styles.arrowBtn} onClick={onBackToModel}>
              ‹
            </button>
            <span style={{ flexGrow: 1, textAlign: "center" }}>Select Fuel Type</span>
            <button
              className={styles.arrowBtn}
              onClick={() => {
                if (activeFuel) onNextToVariant();
              }}
            >
              ›
            </button>
          </div>

          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search fuel type"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.variantGrid}>
            {filteredFuel.map((v, i) => (
              <button
                key={i}
                className={`${styles.variantBtn} ${
                  activeFuel === v ? styles.active : ""
                }`}
                onClick={() => {
                  setActiveFuel(v);
                  onSelectFuel(v);
                }}
              >
                <div className={styles.variantName}>{v}</div>
                <span className={styles.arrow}></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectFuelType;
