import React, { useEffect } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/pages/bikeinsurance.module.css";
import UserDetails from "@/components/ui/UserDetails";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Image from "next/image";
import AOS from "aos";
import "aos/dist/aos.css";

import {
  MdOutlineKeyboardDoubleArrowRight,
  MdKeyboardArrowRight,
} from "react-icons/md";

import { FaArrowRight } from "react-icons/fa6";

// Normalize messy RC manufacturer names to Zuno's expected make.
// Order matters: check HERO before HONDA (Hero Honda contains both).
function normalizeBrand(raw: string) {
  const b = (raw || "").toUpperCase().replace(/\s+/g, " ").trim();
  if (b.includes("HERO")) return "HERO";
  if (b.includes("HONDA")) return "HONDA";
  if (b.includes("BAJAJ")) return "BAJAJ";
  if (b.includes("TVS")) return "TVS";
  if (b.includes("YAMAHA")) return "YAMAHA";
  if (b.includes("SUZUKI")) return "SUZUKI";
  if (b.includes("ENFIELD")) return "ROYAL ENFIELD";
  if (b.includes("KTM")) return "KTM";
  if (b.includes("MAHINDRA")) return "MAHINDRA";
  if (b.includes("OLA")) return "OLA";
  if (b.includes("HARLEY")) return "HARLEY DAVIDSON";
  if (b.includes("LML")) return "LML";
  return b; // fallback: cleaned-up original
}

function bikeinsurance() {
  const router = useRouter();
  const [carNumber, setCarNumber] = React.useState("");

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <div>
      <UserDetails />
      <Navbar />
      <div className={styles.cont}>
        <div className={styles.imageCont}>
          <Image
            src={require("@/assets/pageImages/scooter.png")}
            alt="car Image"
            className={styles.image}
          />
        </div>
        <div data-aos="fade-right">
          <h1 className={styles.headings}>TWO - WHEELER INSURANCE</h1>
          <div className={styles.bottom}>
            <p className={styles.heading}>
              Bike Insurance in<b className={styles.bold}> 60 seconds</b>
            </p>

            <div className={styles.path}>
              <section>
                <p>Bike No.</p>
              </section>
              <section>
                <MdOutlineKeyboardDoubleArrowRight />
              </section>
              <section>
                <p>Select Plan</p>
              </section>
              <section>
                <MdOutlineKeyboardDoubleArrowRight />
              </section>
              <section>
                <p>Policy Issued</p>
              </section>
            </div>

            <div className={styles.form}>
              <input
                type="text"
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
                placeholder="Your bike number ex - DL-10-CB-1234"
                className={styles.input}
              />

              <button
                className={styles.button}
                onClick={async () => {
                  try {
                    if (!carNumber) {
                      alert("Enter bike number");
                      return;
                    }

                    const res = await fetch("/api/vahan/rc-check", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ registrationNumber: carNumber }),
                    });

                    const data = await res.json();
                    console.log("BIKE RC FULL >>>", data);

                    if (!data.success) {
                      alert(data.message || "RC not found");
                      return;
                    }

                    // API returns the vehicle under `vehicle`
                    const rc = data.vehicle;
                    console.log("RC VEHICLE OBJECT >>>", rc);

                    if (!rc) {
                      alert("Vehicle data missing from RC response");
                      return;
                    }

                    const vehicle = {
                      registrationNumber:
                        rc.number || rc.reg_no || carNumber,

                      brand: normalizeBrand(
                        rc.brand || rc.vehicle_manufacturer_name || ""
                      ),

                      model: (rc.model || "")
                        .toUpperCase()
                        .replace(/\s+/g, " ")
                        .trim(),

                      engine: rc.engine || "",
                      chassis: rc.chassis || "",
                      year: rc.year || "",
                      fuel: rc.fuel || rc.type || "",
                      seatingCapacity:
                        rc.seatingCapacity || rc.vehicle_seat_capacity || "",
                      capacity:
                        rc.cc || rc.capacity || rc.vehicle_cubic_capacity || "",
                      registrationDate: rc.regDate || rc.reg_date || "",
                      ownerName: rc.ownerName || rc.owner_name || "",
                    };

                    console.log("NORMALIZED VEHICLE >>>", vehicle);

                    localStorage.setItem(
                      "bikeRcDetails",
                      JSON.stringify(vehicle)
                    );

                    localStorage.setItem(
                      "vehicleNumber",
                      vehicle.registrationNumber
                    );

                    console.log("SAVED, REDIRECTING...");
                    router.push("./twowheeler");
                  } catch (err) {
                    console.log("CHECK PRICES ERROR >>>", err);
                    alert(
                      "Something went wrong: " + (err as any)?.message
                    );
                  }
                }}
              >
                Check Prices
              </button>
            </div>

            <p>
              By clicking, I agree to{" "}
              <b className={styles.policy}>terms & conditions</b> and{" "}
              <b className={styles.policy}>privacy policy</b>
            </p>

            <button className={styles.transparentButton}>
              Brand new Bike <MdKeyboardArrowRight />
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default bikeinsurance;