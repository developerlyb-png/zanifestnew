"use client";
import React, { useState, useEffect } from "react";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import styles from "@/styles/pages/carinsurance.module.css";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";
import { useRouter } from "next/router";
import AOS from "aos";

// ✅ Dialog imports
import ChoosecarDialog from "./Location";
import VehicleBrandDialog from "./Carbrand";
import VehicleModelDialog from "./Carmodel";
import VehicleVariantDialog from "./CarVariant";
import VehicleInfoDialog from "./CarInfoDialog";
import SelectFuelType from "./Selectfueltype";

function Carinsurance() {
  const router = useRouter();
  const [carNumber, setCarNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<
    | "none"
    | "chooseVehicle"
    | "chooseBrand"
    | "chooseModel"
    | "selectfueltype"
    | "chooseVariant"
    | "vehicleInfo"
  >("none");

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedFuel, setSelectedFuel] = useState<string | null>(null);
  const [rcDetails, setRcDetails] = useState<any>(null);

  // ✅ Popup
  const [showPopup, setShowPopup] = useState(false);

  // Page scroll + AOS
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  /** ✅ Call backend → RC verification */
  const handleRCVerify = async () => {
    const reg = carNumber.toUpperCase().trim();

    // ✅ Basic RC format validation
    const regex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
    if (!regex.test(reg)) {
      alert("⚠ Enter valid vehicle number (Example: DL10AB1234)");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/vehicle/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_number: reg }),
      });

      const data = await res.json();
      console.log("RC VERIFY RESPONSE:", data);

      if (data?.status === "SUCCESS") {
        setRcDetails(data?.data);

        const modelName = data?.data?.maker_model;
        if (modelName) {
          setSelectedVehicle(modelName);
          setSelectedBrand(modelName.split(" ")[0] ?? null);
          setSelectedModel(modelName);
        }

        // ✅ Show Popup
        setShowPopup(true);
      } else {
        alert(data?.message || "Could not fetch vehicle details. Select manually.");
        setStep("chooseVehicle");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Try again.");
    }

    setLoading(false);
  };

  return (
    <div>
      <UserDetails />
      <Navbar />

      {/* MAIN SECTION */}
      <div className={styles.cont}>
        <div className={styles.imageCont}>
          <Image
            src={require("@/assets/pageImages/blackcar.png")}
            alt="car Image"
            className={styles.image}
          />
        </div>

        <div className={styles.bottom} data-aos="fade-left">
          <p className={styles.heading}>
            Compare & <b className={styles.bold}>save upto 90%</b> on car insurance
          </p>

          <div className={styles.form}>
            <input
              type="text"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
              placeholder="Enter car number (eg - DL10AB1234)"
              className={styles.input}
            />

            <button
              className={styles.button}
              disabled={loading}
              onClick={handleRCVerify}
            >
              {loading ? "Checking..." : <>View Prices <FaArrowRight /></>}
            </button>

            <div className={styles.newCar}>
              Brand new car?{" "}
              <button
                onClick={() => setStep("chooseVehicle")}
                className={styles.linkBtn}
              >
                click here
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* ✅ POPUP UI */}
      {showPopup && rcDetails && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: "420px",
              background: "white",
              borderRadius: "12px",
              padding: "20px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginBottom: "10px" }}>Vehicle Details</h2>

            <div
              style={{
                background: "#f3f3f3",
                borderRadius: "10px",
                padding: "12px",
              }}
            >
              {Object.entries(rcDetails).map(([key, value]) => (
                <p key={key} style={{ marginBottom: 6 }}>
                  <b>{key.replace(/_/g, " ").toUpperCase()}:</b> {String(value)}
                </p>
              ))}
            </div>

            <button
              style={{
                marginTop: "15px",
                background: "#111f4d",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              onClick={() => setShowPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ✅ ALL DIALOG FLOWS */}
      {step === "chooseVehicle" && (
        <ChoosecarDialog
          onClose={() => setStep("none")}
          onSelectVehicle={(vehicle) => {
            setSelectedVehicle(vehicle);
            setSelectedBrand(null);
            setSelectedModel(null);
            setSelectedFuel(null);
            setSelectedVariant(null);
            setStep("chooseBrand");
          }}
          onBackToInfo={() => setStep("none")}
          onNextToBrand={() => setStep("chooseBrand")}
        />
      )}

      {step === "chooseBrand" && (
        <VehicleBrandDialog
          onClose={() => setStep("none")}
          vehicleNumber={carNumber || "NEW VEHICLE"}
          selectedVehicle={selectedVehicle || ""}
          onSelectBrand={(brand) => {
            setSelectedBrand(brand);
            setSelectedModel(null);
            setSelectedFuel(null);
            setSelectedVariant(null);
            setStep("chooseModel");
          }}
          onBackToChooseVehicle={() => setStep("chooseVehicle")}
          onNextToVehicleModel={() => setStep("chooseModel")}
        />
      )}

      {step === "chooseModel" && (
        <VehicleModelDialog
          onClose={() => setStep("none")}
          vehicleNumber={carNumber || "NEW VEHICLE"}
          selectedVehicle={selectedVehicle || ""}
          selectedBrand={selectedBrand || ""}
          onSelectModel={(model) => {
            setSelectedModel(model);
            setSelectedFuel(null);
            setSelectedVariant(null);
            setStep("selectfueltype");
          }}
          onBack={() => setStep("chooseBrand")}
          onNext={() => setStep("selectfueltype")}
        />
      )}

      {step === "selectfueltype" && (
        <SelectFuelType
          onClose={() => setStep("none")}
          vehicleNumber={carNumber || "NEW VEHICLE"}
          selectedVehicle={selectedVehicle || ""}
          selectedBrand={selectedBrand || ""}
          selectedModel={selectedModel || ""}
          selectedVariant={selectedVariant || ""}
          selectedFuel={selectedFuel || ""}
          onBackToModel={() => setStep("chooseModel")}
          onSelectFuel={(fuel) => {
            setSelectedFuel(fuel);
            setStep("chooseVariant");
          }}
          onNextToVariant={() => setStep("chooseVariant")}
        />
      )}

      {step === "chooseVariant" && (
        <VehicleVariantDialog
          onClose={() => setStep("none")}
          vehicleNumber={carNumber || "NEW VEHICLE"}
          selectedVehicle={selectedVehicle || ""}
          selectedBrand={selectedBrand || ""}
          selectedModel={selectedModel || ""}
          selectedFuel={selectedFuel || ""}
          onBackToModel={() => setStep("selectfueltype")}
          onSelectVariant={(variant) => {
            setSelectedVariant(variant);
            setStep("vehicleInfo");
          }}
        />
      )}

      {step === "vehicleInfo" && (
        <VehicleInfoDialog
          onClose={() => setStep("none")}
          vehicleNumber={carNumber || "NEW VEHICLE"}
          selectedVehicle={selectedVehicle}
          selectedBrand={selectedBrand}
          selectedModel={selectedModel}
          selectedVariant={selectedVariant}
          selectedFuel={selectedFuel}
          onUpdateData={(data) => {
            if (data.vehicle) setSelectedVehicle(data.vehicle);
            if (data.brand) setSelectedBrand(data.brand);
            if (data.model) setSelectedModel(data.model);
            if (data.variant) setSelectedVariant(data.variant);
            if (data.fuel) setSelectedFuel(data.fuel);
          }}
          oncommercialvehicle1={() => setStep("chooseVehicle")}
          onChooseVehicle={() => setStep("chooseBrand")}
          onChooseBrand={() => setStep("chooseModel")}
          onChooseModel={() => setStep("selectfueltype")}
          onChooseFuelVariant={() => setStep("chooseVariant")}
          onChooseYear={() => {}}
          selectedYear={null}
        />
      )}
    </div>
  );
}

export default Carinsurance;
