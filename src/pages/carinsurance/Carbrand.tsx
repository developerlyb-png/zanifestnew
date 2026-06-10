"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/VehicleBrandDialog.module.css";
import { FiArrowLeft, FiSearch, FiMapPin } from "react-icons/fi";

const brands = [
  "Maruti Suzuki",
  "Hyundai",
  "Tata Motors",
  "Mahindra",
  "Honda",
  "Skoda",
  "Renault",
  "TOYOTA",
  "Nissan",
];

interface VehicleBrandDialogProps {
  onClose: () => void;
  vehicleNumber: string;
  selectedVehicle: string;
  onBackToChooseVehicle: () => void;
  onNextToVehicleModel: () => void;
  onSelectBrand: (brand: string) => void;
}

const VehicleBrandDialog: React.FC<VehicleBrandDialogProps> = ({
  onClose,
  vehicleNumber,
  selectedVehicle,
  onBackToChooseVehicle,
  onNextToVehicleModel,
  onSelectBrand,
}) => {
  const [search, setSearch] = useState("");
  const [activeBrand, setActiveBrand] = useState("");

  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* Left Panel */}
        <div className={styles.leftPanel}>
          <h3>Your selection</h3>
          <div className={styles.selectionBox}>
            <div className={styles.selectionItem}>
              <FiMapPin className={styles.icon} /> {vehicleNumber}
            </div>
            <div className={styles.selectionItem}>
              <FiMapPin className={styles.icon} /> {selectedVehicle}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className={styles.rightPanel}>
          <div className={styles.header}>
            <button className={styles.arrowBtn} onClick={onBackToChooseVehicle}>
              ‹
            </button>
            <span>Search Car Brand</span>
            <button
              className={styles.arrowBtn}
              onClick={() => {
                if (activeBrand) onNextToVehicleModel();
              }}
            >
              ›
            </button>
          </div>

          <div className={styles.searchBox}>
            <FiSearch size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search car Brand"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.brandGrid}>
            {filteredBrands.map((brand, idx) => (
              <button
                key={idx}
                className={`${styles.brandBtn} ${
                  activeBrand === brand ? styles.active : ""
                }`}
                onClick={() => {
                  setActiveBrand(brand);
                  onSelectBrand(brand);
                }}
              >
                {brand}
                <span>›</span>
              </button>
            ))}
          </div>

          <div className={styles.otherManufacturer}>Other Manufacturer</div>
        </div>
      </div>
    </div>
  );
};

export default VehicleBrandDialog;
