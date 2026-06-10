
"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/VehicleBrandDialog.module.css";
import { FiArrowLeft, FiSearch, FiEdit2, FiMapPin } from "react-icons/fi";
import { FaTruck } from "react-icons/fa";

const brands = [
  "ASHOK LEYLAND",
  "TATA MOTORS LTD",
  "MAHINDRA AND MAHINDRA",
  "EICHER MOTORS",
  "BAJAJ",
  "MAHINDRA NAVISTAR",
  "BHARAT BENZ",
  "VE COMMERCIAL VEHICLES LTD",
  "SWARAJ MAZDA",
  "FORCE MOTORS",
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
  onSelectBrand,
    onBackToChooseVehicle,
  onNextToVehicleModel,
}) => {
  const [search, setSearch] = useState("");

  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* Left Panel */}
        <div className={styles.leftPanel}>
          <h3>Your selection</h3>

          {/* Vehicle Number */}
          <div className={styles.selectionBox}>
            <div className={styles.selectionItem}>
              <FiMapPin className={styles.icon} />
              <span>{vehicleNumber}</span>
            </div>
          </div>

          {/* Selected Vehicle */}
          <div className={styles.selectionBox}>
            <div className={styles.selectionItem}>
              <FaTruck className={styles.icon} />
              <span>{selectedVehicle}</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className={styles.rightPanel}>
          <div className={styles.header}>
            <button className={styles.arrowBtn} onClick={onBackToChooseVehicle}>
              ‹
            </button>
            <span>Search Vehicle Brand</span>
            <button className={styles.arrowBtn} onClick={onNextToVehicleModel}>
              ›
            </button>            
          </div>

          {/* Search */}
          <div className={styles.searchBox}>
            <FiSearch size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Vehicle Brand"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Brand List */}
          <div className={styles.brandGrid}>
            {filteredBrands.map((brand, idx) => (
              <button
                key={idx}
                className={styles.brandBtn}
                onClick={() => onSelectBrand(brand)} 
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