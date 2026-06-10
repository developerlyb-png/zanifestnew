"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/VehicleVariantDialog.module.css";
import { FiMapPin, FiSearch } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { BsFuelPumpDiesel } from "react-icons/bs";

interface VehicleVariantDialogProps {
  onClose: () => void;
  vehicleNumber: string;
  selectedVehicle: string;
  selectedBrand: string;
  selectedModel: string;
  selectedFuel: string;
  onBackToModel: () => void;
  onSelectVariant: (variant: string) => void;
}

const variants = ["LXI", "VXI", "ZXI", "ZXI Plus", "VXI AT"];

const VehicleVariantDialog: React.FC<VehicleVariantDialogProps> = ({
  onClose,
  vehicleNumber,
  selectedVehicle,
  selectedBrand,
  selectedModel,
  selectedFuel,
  onBackToModel,
  onSelectVariant,
}) => {
  const [search, setSearch] = useState("");
  const [activeVariant, setActiveVariant] = useState("");

  const filteredVariants = variants.filter((v) =>
    v.toLowerCase().includes(search.toLowerCase())
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
                <BsFuelPumpDiesel className={styles.icon} /> {selectedFuel}
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
            <span style={{ flexGrow: 1, textAlign: "center" }}>Select Vehicle Variant</span>
          </div>

          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Vehicle Variant"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.variantGrid}>
            {filteredVariants.map((v, i) => (
              <button
                key={i}
                className={`${styles.variantBtn} ${
                  activeVariant === v ? styles.active : ""
                }`}
                onClick={() => {
                  setActiveVariant(v);
                  onSelectVariant(v);
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

export default VehicleVariantDialog;
