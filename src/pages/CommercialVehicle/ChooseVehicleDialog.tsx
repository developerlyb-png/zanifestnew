"use client";
import React, { useState } from "react";
import Image from "next/image";
import vehicle from "@/assets/CommercialVehicle/Layer 1.png";
import styles from "@/styles/pages/CommercialVehicle/choosevehicledialog.module.css";

// React Icons
import { FaTruck, FaTractor, FaBus } from "react-icons/fa";
import { MdElectricRickshaw, MdDirectionsBus } from "react-icons/md";
import { PiVanFill } from "react-icons/pi";
import { GiMineTruck } from "react-icons/gi";
import { TbBus } from "react-icons/tb";
import { RiMotorbikeFill } from "react-icons/ri";
import { BiLoader } from "react-icons/bi";

interface ChooseVehicleDialogProps {
  onClose: () => void;
  onSelectVehicle: (vehicle: string) => void;
  onBackToInfo: () => void;   
  onNextToBrand: () => void;  

}

const vehicles = [
  { label: "Pickup & Delivery Van", icon: <PiVanFill size={45} /> },
  { label: "Auto-Rickshaw", icon: <RiMotorbikeFill size={45} /> },
  { label: "Electric Rickshaw", icon: <MdElectricRickshaw size={45} /> },
  { label: "3 Wheeler Loader", icon: <BiLoader size={45} /> },
  { label: "Truck", icon: <FaTruck size={45} /> },
  { label: "Tipper", icon: <GiMineTruck size={45} /> },
  { label: "Tempo & Traveller", icon: <MdDirectionsBus size={45} /> },
  { label: "Agricultural Tractor", icon: <FaTractor size={45} /> },
  { label: "School Bus", icon: <TbBus size={45} /> },
  { label: "Passenger Bus", icon: <FaBus size={45} /> },
  { label: "Ecart", icon: <RiMotorbikeFill size={45} /> },
  { label: "Goods Carrying Tractor", icon: <FaTruck size={45} /> },
];

const ChooseVehicleDialog: React.FC<ChooseVehicleDialogProps> = ({
  onClose,
  onSelectVehicle,
  onBackToInfo,
  onNextToBrand,
  
}) => {
  const [active, setActive] = useState("Truck");

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* Left Image */}
        <div className={styles.left}>
          <Image src={vehicle} alt="Vehicle" className={styles.vehicleImg} />
        </div>

        {/* Right Content */}
        <div className={styles.right}>
          <div className={styles.header}>
            <button className={styles.arrowBtn} onClick={onBackToInfo}>
              ‹
            </button>
            <span>Choose the type of your vehicle</span>
            <button className={styles.arrowBtn} onClick={onNextToBrand}>
              ›
            </button>  
          </div>

          <div className={styles.vehicleGrid}>
            {vehicles.map((v) => (
              <button
                key={v.label}
                onClick={() => {
                  setActive(v.label);
                  onSelectVehicle(v.label);
                }}
                className={active === v.label ? styles.active : ""}
              >
                {v.icon}
                <span>{v.label}</span>
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

export default ChooseVehicleDialog;