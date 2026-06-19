"use client";

import React, { useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/VehicleInfoDialog.module.css";

import { FiEdit2, FiMapPin } from "react-icons/fi";
import { FaTruck, FaCar } from "react-icons/fa";
import { BsCalendarDate, BsFuelPumpDiesel } from "react-icons/bs";

import { GiGearStickPattern } from "react-icons/gi";
import { useRouter } from "next/navigation";

interface VehicleInfoDialogProps {
  onClose: () => void;

  oncommercialvehicle1: () => void;

  onChooseVehicle: () => void;

  onChooseBrand: () => void;

  onChooseModel: () => void;

  onChooseFuelVariant: () => void;

  onChooseYear: () => void;

  vehicleNumber: string;

  selectedVehicle: string | null;

  selectedBrand: string | null;

  selectedModel: string | null;

  selectedVariant: string | null;

  selectedFuel?: string | null;

  selectedYear: number | null;

  // ZUNO RTO (optional)
selectedLocation?: any;
  onUpdateData: (data: {
    vehicle?: string;

    brand?: string;

    model?: string;

    variant?: string;

    fuel?: string;

    year?: number;
  }) => void;
}

const VehicleInfoDialog: React.FC<VehicleInfoDialogProps> = ({
  onClose,

  onChooseVehicle,

  onChooseBrand,

  onChooseModel,

  onChooseFuelVariant,

  onChooseYear,

  oncommercialvehicle1,

  vehicleNumber,

  selectedVehicle,

  selectedBrand,

  selectedModel,

  selectedVariant,

  selectedFuel,

  selectedYear,

  selectedLocation,
}) => {
  const [fullName, setFullName] = useState("");

  const [mobile, setMobile] = useState("+91 ");

  const router = useRouter();

  // NAME FORMAT

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

      .toLowerCase()

      .replace(
        /\b\w/g,

        (char) => char.toUpperCase(),
      );

    setFullName(value);
  };

  // MOBILE

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prefix = "+91 ";

    let input = e.target.value;

    if (!input.startsWith(prefix)) {
      input = prefix;
    }

    const digitsOnly = input

      .substring(prefix.length)

      .replace(/\D/g, "");

    setMobile(prefix + digitsOnly.slice(0, 10));
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* LEFT */}

        <div className={styles.left}>
          <h3 className={styles.heading}>✅ We have found your vehicle</h3>

          <div className={styles.infoBox}>
            {/* VEHICLE NUMBER */}

            <div className={styles.item}>
              <FiMapPin className={styles.icon} />

              <span>
  {
    vehicleNumber !== "NEW VEHICLE"
    ? vehicleNumber
    : selectedLocation?.rto || "NEW VEHICLE"
  }
</span>

              <FiEdit2
                className={styles.editIcon}
                onClick={oncommercialvehicle1}
              />
            </div>

            {/* YEAR */}

            <div className={styles.item}>
              <BsCalendarDate className={styles.icon} />

              <span>{selectedYear}</span>

              <FiEdit2 className={styles.editIcon} onClick={onChooseYear} />
            </div>

            {/* BRAND */}

            <div className={styles.item}>
              <FaTruck className={styles.icon} />

              <span>{selectedBrand}</span>

              <FiEdit2 className={styles.editIcon} onClick={onChooseBrand} />
            </div>

            {/* MODEL */}

            <div className={styles.item}>
              <FaCar className={styles.icon} />

              <span>{selectedModel}</span>

              <FiEdit2 className={styles.editIcon} onClick={onChooseModel} />
            </div>

            {/* FUEL */}

            <div className={styles.item}>
              <BsFuelPumpDiesel className={styles.icon} />

              <span>{selectedFuel}</span>

              <FiEdit2
                className={styles.editIcon}
                onClick={onChooseFuelVariant}
              />
            </div>

            {/* VARIANT */}

            <div className={styles.item}>
              <GiGearStickPattern className={styles.icon} />

              <span>{selectedVariant}</span>

              <FiEdit2
                className={styles.editIcon}
                onClick={onChooseFuelVariant}
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}

        <div className={styles.right}>
          <h3 className={styles.heading}>Almost done! Just one last step</h3>

          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={handleFullNameChange}
            className={styles.input}
          />

          <input
            type="tel"
            placeholder="Enter mobile number"
            value={mobile}
            onChange={handleMobileChange}
            className={styles.input}
            autoComplete="tel"
            maxLength={14}
          />

          {mobile.length === 14 && <span className={styles.check}>✔</span>}

          <button
            className={styles.viewBtn}
            onClick={() => {
              router.push("/CommercialVehicle/CommercialVehicle5");
            }}
          >
            View prices
          </button>

          <p className={styles.terms}>
            By clicking on 'View prices', you agree to our{" "}
            <a href="#">Privacy Policy</a> & <a href="#">Terms of Use</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VehicleInfoDialog;
