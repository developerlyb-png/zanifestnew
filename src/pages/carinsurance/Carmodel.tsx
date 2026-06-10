"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/VehicleModelDialog.module.css";
import { FiMapPin, FiSearch } from "react-icons/fi";
import { FaCar } from "react-icons/fa";

interface VehicleModelDialogProps {
  onClose: () => void;
  vehicleNumber: string;
  selectedVehicle: string;
  selectedBrand: string;
  onSelectModel: (model: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const models = ["Swift", "WagonR", "Baleno", "Dezire", "Ertiga", "Ciaz", "Alto"];

const VehicleModelDialog: React.FC<VehicleModelDialogProps> = ({
  onClose,
  vehicleNumber,
  selectedVehicle,
  selectedBrand,
  onSelectModel,
  onBack,
  onNext,
}) => {
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState("");

  const filteredModels = models.filter((m) =>
    m.toLowerCase().includes(search.toLowerCase())
  );

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
              <FiMapPin className={styles.icon} /> {selectedVehicle}
            </div>
            <div className={styles.selectionItem}>
              <FaCar className={styles.icon} /> {selectedBrand}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.right}>
          <div className={styles.header}>
            <button className={styles.arrowBtn} onClick={onBack}>
              ‹
            </button>
            <span>Search car Model</span>
            <button
              className={styles.arrowBtn}
              onClick={() => {
                if (activeModel) onNext();
              }}
            >
              ›
            </button>
          </div>

          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search car Model"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.modelsGrid}>
            {filteredModels.map((model, i) => (
              <button
                key={i}
                className={`${styles.modelBtn} ${
                  activeModel === model ? styles.active : ""
                }`}
                onClick={() => {
                  setActiveModel(model);
                  onSelectModel(model);
                }}
              >
                {model}
                <span className={styles.arrow}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleModelDialog;
