"use client";
import React, { useState } from "react";
import Image from "next/image";
import styles from "@/styles/pages/cardetailsdialog.module.css";

interface ChooseVehicleDialogProps {
  onClose: () => void;
  onSelectVehicle: (vehicle: string) => void;
  onBackToInfo: () => void;
  onNextToBrand: () => void;
}

const cities = [
  "Delhi",
  "Gurgaon",
  "Noida",
  "Faridabad",
  "Ghaziabad",
  "Meerut",
  "Agra",
  "Lucknow",
  "Kanpur",
  "Prayagraj",
  "Varanasi",
  "Aligarh",
];

const ChoosecarDialog: React.FC<ChooseVehicleDialogProps> = ({
  onClose,
  onSelectVehicle,
  onBackToInfo,
  onNextToBrand,
}) => {
  const [active, setActive] = useState("");

  // Function to handle city selection
  const handleSelectCity = (city: string) => {
    setActive(city);
    onSelectVehicle(city);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* Left Image */}
        <div className={styles.left}>
          <Image
            src={require("@/assets/pageImages/blackcar.png")}
            alt="car Image"
            className={styles.image}
          />
        </div>

        {/* Right Content */}
        <div className={styles.right}>
          <div className={styles.header}>
            <button className={styles.arrowBtn} onClick={onBackToInfo}>
              ‹
            </button>
            <span>Select City</span>
            <button
              className={styles.arrowBtn}
              onClick={() => {
                // Right arrow works only if a city is selected
                if (active) {
                  onNextToBrand();
                } else {
                  alert("Please select a city first!");
                }
              }}
            >
              ›
            </button>
          </div>

          <div className={styles.vehicleGrid}>
            {cities.map((v) => (
              <button
                key={v}
                onClick={() => handleSelectCity(v)}
                className={`${styles.vehicleBtn} ${
                  active === v ? styles.active : ""
                }`}
              >
                <span>{v}</span>
              </button>
            ))}
          </div>

          <div className={styles.otherType}>
            <a href="#">Other Vehicle Type</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChoosecarDialog;
