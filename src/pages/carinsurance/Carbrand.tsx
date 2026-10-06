"use client";

import React, { useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/VehicleBrandDialog.module.css";
import {
  FiArrowLeft,
  FiSearch,
  FiMapPin,
} from "react-icons/fi";

/* =========================================================
   BRAND LOGOS
   Location:
   src/assets/brand-logo/
========================================================= */

import hondaLogo from "../../assets/brand-logo/honda.png";
import hyundaiLogo from "../../assets/brand-logo/hyundai.png";
import mahindraLogo from "../../assets/brand-logo/mahindra.png";
import nissanLogo from "../../assets/brand-logo/nissan.png";
import marutiLogo from "../../assets/brand-logo/suzuki.png";
import tataLogo from "../../assets/brand-logo/tata.png";
import skodaLogo from "../../assets/brand-logo/skoda.png";
import toyotaLogo from "../../assets/brand-logo/toyota.png";
import renaultLogo from "../../assets/brand-logo/renault.png";



/* =========================================================
   BRANDS
========================================================= */

const brands = [
  {
    name: "Mahindra",
    logo: mahindraLogo,
  },
  {
    name: "Maruti Suzuki",
    logo: marutiLogo,
  },
  {
    name: "Tata Motors",
    logo: tataLogo,
  },
  {
    name: "Hyundai",
    logo: hyundaiLogo,
  },
  {
    name: "Skoda",
    logo: skodaLogo,
  },
  {
    name: "Toyota",
    logo: toyotaLogo,
  },
  {
    name: "Honda",
    logo: hondaLogo,
  },
  {
    name: "Renault",
    logo: renaultLogo,
  },
  {
    name: "Nissan",
    logo: nissanLogo,
  },
];


/* =========================================================
   PROPS
========================================================= */

interface VehicleBrandDialogProps {
  onClose: () => void;

  vehicleNumber: string;

  selectedVehicle: string;

  selectedYear: number | null;

  selectedLocation: any;

  onBackToChooseVehicle: () => void;

  onNextToVehicleModel: () => void;

  onSelectBrand: (brand: string) => void;
}


/* =========================================================
   COMPONENT
========================================================= */

const VehicleBrandDialog: React.FC<
  VehicleBrandDialogProps
> = ({
  onClose = () => {},

  vehicleNumber = "",

  selectedVehicle = "",

  selectedYear = null,

  selectedLocation = null,

  onBackToChooseVehicle = () => {},

  onNextToVehicleModel = () => {},

  onSelectBrand = () => {},
}) => {

  /* =======================================================
     STATES
  ======================================================= */

  const [search, setSearch] = useState("");

  const [activeBrand, setActiveBrand] = useState("");


  /* =======================================================
     FILTER BRANDS
  ======================================================= */

  const filteredBrands = brands.filter((brand) =>
    brand.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );


  /* =======================================================
     SELECT BRAND
  ======================================================= */

  const handleBrandSelect = (brand: string) => {

    setActiveBrand(brand);

    onSelectBrand(brand);
  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className={styles.overlay}>

      <div className={styles.dialog}>

        {/* =================================================
            LEFT PANEL
        ================================================= */}

        <div className={styles.leftPanel}>

          <h3>
            Your selection
          </h3>


          <div className={styles.selectionBox}>

            {/* LOCATION */}

            <div className={styles.selectionItem}>

              <FiMapPin
                className={styles.icon}
              />

              <span>
                {selectedLocation?.rto
                  ? selectedLocation.rto
                  : vehicleNumber?.substring(0, 4) || ""}
              </span>

            </div>


            {/* YEAR */}

            <div className={styles.selectionItem}>

              <span className={styles.calendarIcon}>
                📅
              </span>

              <span>
                {selectedYear
                  ? selectedYear
                  : new Date().getFullYear()}
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            RIGHT PANEL
        ================================================= */}

        <div className={styles.rightPanel}>


          {/* =================================================
              HEADER
          ================================================= */}

          <div className={styles.header}>


            {/* BACK */}

            <button
              type="button"
              className={styles.arrowBtn}
              onClick={onBackToChooseVehicle}
              aria-label="Back"
            >
              <FiArrowLeft />
            </button>


            {/* TITLE */}

            <span>
              Search Car Brand
            </span>


            {/* NEXT */}

            <button
              type="button"
              className={`${styles.arrowBtn} ${
                !activeBrand
                  ? styles.disabledArrow
                  : ""
              }`}
              onClick={() => {

                if (activeBrand) {
                  onNextToVehicleModel();
                }

              }}
              disabled={!activeBrand}
              aria-label="Next"
            >
              ›
            </button>

          </div>


          {/* =================================================
              SEARCH
          ================================================= */}

          <div className={styles.searchBox}>

            <FiSearch
              size={18}
              className={styles.searchIcon}
            />


            <input
              type="text"
              placeholder="Search Car Brand"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>


          {/* =================================================
              POPULAR TITLE
          ================================================= */}

          <div className={styles.popularTitle}>
            Popular car brands
          </div>


          {/* =================================================
              BRAND GRID
          ================================================= */}

          <div className={styles.brandGrid}>

            {filteredBrands.length > 0 ? (

              filteredBrands.map((brand) => (

                <button
                  type="button"
                  key={brand.name}
                  className={`${styles.brandCard} ${
                    activeBrand === brand.name
                      ? styles.active
                      : ""
                  }`}
                  onClick={() =>
                    handleBrandSelect(
                      brand.name
                    )
                  }
                >

                  {/* LOGO */}

                  <div className={styles.logoBox}>

                    <img
                      src={brand.logo.src}
                      alt={`${brand.name} logo`}
                      className={styles.brandLogo}
                    />

                  </div>


                  {/* BRAND NAME */}

                  <div className={styles.brandName}>
                    {brand.name}
                  </div>

                </button>

              ))

            ) : (

              <div className={styles.noResults}>
                No car brand found
              </div>

            )}

          </div>


          {/* =================================================
              OTHER MANUFACTURER
          ================================================= */}

          <button
            type="button"
            className={styles.otherManufacturer}
          >
            Other Manufacturer
          </button>


        </div>

      </div>

    </div>
  );
};


export default VehicleBrandDialog;