"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/commercialvehicle1.module.css";
import Image from "next/image";
import vehicle from "@/assets/CommercialVehicle/Layer 1.png";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import VehicleInfoDialog from "@/pages/CommercialVehicle/VehicleInfoDialog";
import ChooseVehicleDialog from "@/pages/CommercialVehicle/ChooseVehicleDialog";
import VehicleBrandDialog from "@/pages/CommercialVehicle/VehicleBrandDialog";
import VehicleModelDialog from "@/pages/CommercialVehicle/VehicleModelDialog";
import VehicleVariantDialog from "@/pages/CommercialVehicle/VehicleVariantDialog";
import YearDialog from "@/pages/CommercialVehicle/YearDialog";

const CommercialVehicle1: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    | "vehicleInfo"
    | "chooseVehicle"
    | "vehicleBrand"
    | "vehicleModel"
    | "vehicleVariant"
    | "yearDialog"
    |"CommercialVehicle1"
    | null
  >(null);

  // ✅ Selection states
  const [vehicleNumber, setVehicleNumber] = useState("DL01LAG8279");
  const [selectedVehicle, setSelectedVehicle] = useState("Truck");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(
    "TATA MOTORS LTD"
  );
  const [selectedModel, setSelectedModel] = useState<string | null>("LPT 709");
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    "g DCR39HSD 85B6M5 TT - CNG"
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(2022);

  return (
    <>
      <Navbar />

      {/* Main Section */}
      <div className={styles.wrapper}>
        <div className={styles.container}>
          {/* Left Section */}
          <div className={styles.left}>
            <span className={styles.badge}>GET POLICY IN 2 MINUTES</span>
            <h2 className={styles.title}>
              Commercial Vehicle Insurance <br />
              starting at <span className={styles.price}>₹3,139</span>
            </h2>
            <input
              type="text"
              placeholder="Enter Vehicle Number: (eg. DL-10-CB-1234)"
              className={styles.input}
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
            <p className={styles.linkText}>
              Brand new vehicle? <a href="#">Click here</a>
            </p>
          </div>

          {/* Right Section */}
          <div className={styles.right}>
            <Image
              src={vehicle}
              alt="Commercial Vehicle"
              className={styles.truckImg}
            />
            <button
              className={styles.button}
              onClick={() => setActiveSection("vehicleInfo")}
            >
              View Prices
            </button>
          </div>
        </div>
      </div>

      {/* Dialog Handling */}
      {activeSection === "vehicleInfo" && (
        <VehicleInfoDialog
          onClose={() => setActiveSection(null)}
          oncommercialvehicle1={() => setActiveSection("CommercialVehicle1")}
          onChooseVehicle={() => setActiveSection("chooseVehicle")}
          onChooseBrand={() => setActiveSection("vehicleBrand")}
          onChooseModel={() => setActiveSection("vehicleModel")}
          onChooseFuelVariant={() => setActiveSection("vehicleVariant")}
          onChooseYear={() => setActiveSection("yearDialog")}
          vehicleNumber={vehicleNumber}
          selectedVehicle={selectedVehicle}
          selectedBrand={selectedBrand}
          selectedModel={selectedModel}
          selectedVariant={selectedVariant}
          selectedYear={selectedYear}
          onUpdateData={(data) => {
            if (data.vehicle) setSelectedVehicle(data.vehicle);
            if (data.brand) setSelectedBrand(data.brand);
            if (data.model) setSelectedModel(data.model);
            if (data.variant) setSelectedVariant(data.variant);
            if (data.year) setSelectedYear(data.year);
          }}
        />
      )}
      {activeSection === "chooseVehicle" && (
        <ChooseVehicleDialog
          onClose={() => setActiveSection(null)}
          onSelectVehicle={(v) => {
            setSelectedVehicle(v);
            setActiveSection("vehicleBrand");
          }}
          onBackToInfo={() => setActiveSection("vehicleInfo")}
          onNextToBrand={() => setActiveSection("vehicleBrand")}
        />
      )}

      {activeSection === "vehicleBrand" && (
        <VehicleBrandDialog
          onClose={() => setActiveSection(null)}
          onBackToChooseVehicle={() => setActiveSection("chooseVehicle")} 
          onNextToVehicleModel={() => setActiveSection("vehicleModel")}
          vehicleNumber={vehicleNumber}
          selectedVehicle={selectedVehicle}
          onSelectBrand={(brand) => {
            setSelectedBrand(brand);
            setActiveSection("vehicleModel");
          }}
        />
      )}

      {activeSection === "vehicleModel" && selectedBrand && (
        <VehicleModelDialog
          onBack={() => setActiveSection("vehicleBrand")}
          onNext={() => setActiveSection("vehicleVariant")}
          onClose={() => setActiveSection(null)}
          vehicleNumber={vehicleNumber}
          selectedVehicle={selectedVehicle}
          selectedBrand={selectedBrand}
          onSelectModel={(model) => {
            setSelectedModel(model);
            setActiveSection("vehicleVariant");
          }}
        />
      )}

      {activeSection === "vehicleVariant" && selectedBrand && selectedModel && (
        <VehicleVariantDialog
          onBackToModel={() => setActiveSection("vehicleModel")} // 👈 back
          onNextToYear={() => setActiveSection("yearDialog")}
          onClose={() => setActiveSection(null)}
          vehicleNumber={vehicleNumber}
          selectedVehicle={selectedVehicle}
          selectedBrand={selectedBrand}
          selectedModel={selectedModel}
          onSelectVariant={(variant) => {
            setSelectedVariant(variant);
            setActiveSection("yearDialog");
          }}
        />
      )}

      {activeSection === "yearDialog" &&
        selectedBrand &&
        selectedModel &&
        selectedVariant && (
          <YearDialog
            onBack={() => setActiveSection("vehicleVariant")} // 👈 go back
            onClose={() => setActiveSection(null)}
            vehicleNumber={vehicleNumber}
            selectedVehicle={selectedVehicle}
            selectedBrand={selectedBrand}
            selectedModel={selectedModel}
            selectedVariant={selectedVariant}
            onSelectYear={(year) => {
              setSelectedYear(year);
              setActiveSection("vehicleInfo");
            }}
          />
        )}

      <Footer />
    </>
  );
};

export default CommercialVehicle1;
