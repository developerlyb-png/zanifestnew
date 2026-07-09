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
import RtoDialog from "@/pages/CommercialVehicle/RtoDialog";

// ---------- ONE consistent RTO shape everywhere ----------
export interface CvRtoDetails {
  rtoLocationName: string;
  rtoStateCode: number;
  rtoCityOrDistrict: string;
  idvCity: string;
  clusterZone: string;
  carZone: string;
  rtoZone: string;
}

const mapRto = (rto: any): CvRtoDetails => ({
  rtoLocationName: rto.rtoLocationName || rto.rtolocation || "",
  rtoStateCode: Number(rto.rtoStateCode ?? rto.statecode ?? 0),
  rtoCityOrDistrict: rto.rtoCityOrDistrict || rto.rtocityordistrict || "",
  idvCity: rto.idvCity || rto.idvcity || rto.idv_city || rto.city || "",
  clusterZone: rto.clusterZone || rto.clusterzone || "",
  carZone: rto.carZone || rto.carzone || "",
  rtoZone: "Except E Cart",
});

// ---------- text matching: RC strings vs Zuno master lists ----------
const norm = (s: string) =>
  String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const bestMatch = (target: string, candidates: string[]): string | null => {
  const t = norm(target);
  if (!t || !candidates.length) return null;

  const exact = candidates.find((c) => norm(c) === t);
  if (exact) return exact;

  const contains = candidates.find(
    (c) => t.includes(norm(c)) || norm(c).includes(t)
  );
  if (contains) return contains;

  const tWords = new Set(t.split(" "));
  let best: string | null = null;
  let bestScore = 0;
  for (const c of candidates) {
    let score = 0;
    for (const w of norm(c).split(" "))
      if (tWords.has(w) && w.length > 1) score++;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return bestScore > 0 ? best : null;
};

const guessVehicleType = (vehicleClass: string): string => {
  const v = norm(vehicleClass);
  if (v.includes("BUS") || v.includes("PASSENGER")) return "Bus";
  return "Truck";
};

const yearFromRegDate = (d: string): number | null => {
  const m = String(d || "").match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
};

const CommercialVehicle1: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    | "vehicleInfo"
    | "chooseVehicle"
    | "vehicleBrand"
    | "vehicleModel"
    | "vehicleVariant"
    | "yearDialog"
    | "CommercialVehicle1"
    | "rtoDialog"
    | null
  >(null);

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("Truck");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedRto, setSelectedRto] = useState<CvRtoDetails | null>(null);
  const [vehicleIdvDetails, setVehicleIdvDetails] = useState<any>(null);
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState("");

  const fetchIdvDetails = async (
    rto: CvRtoDetails,
    make?: string | null,
    model?: string | null,
    variant?: string | null
  ) => {
    try {
      const params = new URLSearchParams({
        make: String(make ?? selectedBrand),
        model: String(model ?? selectedModel),
        variant: String(variant ?? selectedVariant),
        city: rto.idvCity,
      });
      const res = await fetch(`/api/zuno/cv/idv?${params}`);
      const data = await res.json();
      console.log("CV IDV DETAILS", data);
      setVehicleIdvDetails(data);
      localStorage.setItem("cvIdvDetails", JSON.stringify(data));
    } catch (error) {
      console.log("IDV ERROR", error);
    }
  };

  const saveCvVehicle = (opts: {
    year: number | null;
    rto: CvRtoDetails | null;
    make?: string | null;
    model?: string | null;
    variant?: string | null;
  }) => {
    localStorage.setItem(
      "cvVehicle",
      JSON.stringify({
        vehicleNumber: vehicleNumber || "Brand New",
        claimInLastYearPolicy: "N",
        yearOfPurchase: opts.year ? String(opts.year) : "",
        make: opts.make ?? selectedBrand,
        model: opts.model ?? selectedModel,
        varient: opts.variant ?? selectedVariant,
        rtoDetails: opts.rto, // ALWAYS the real RTO, never hardcoded null
      })
    );
  };

  // ---------- resolve full Zuno RTO row ----------
  // Zuno's RTO API searches by CITY name (/rto/{CITY}) and returns rows like
  // {"rtolocation":"MH-01","statecode":"13","idvcity":"MUMBAI",...}.
  // Strategy: try city candidates from the RC (reg authority, address),
  // then pick the row whose rtolocation matches the vehicle's RTO code.
  const CITY_ALIASES: Record<string, string[]> = {
    DELHI: ["NEW DELHI", "DELHI NCR", "NCR"],
    BANGALORE: ["BENGALURU"],
    BENGALURU: ["BANGALORE"],
    BOMBAY: ["MUMBAI"],
    MADRAS: ["CHENNAI"],
    CALCUTTA: ["KOLKATA"],
    GURGAON: ["GURUGRAM"],
    GURUGRAM: ["GURGAON"],
  };

  // Guaranteed fallback: RTO code prefix -> major cities of that state,
  // in Zuno's naming. Used when RC address fields yield nothing usable.
  const STATE_PREFIX_CITIES: Record<string, string[]> = {
    DL: ["NEW DELHI", "DELHI", "DELHI NCR"],
    MH: ["MUMBAI", "PUNE", "NAGPUR"],
    KA: ["BANGALORE", "BENGALURU", "MYSORE"],
    TN: ["CHENNAI", "COIMBATORE"],
    UP: ["LUCKNOW", "NOIDA", "KANPUR", "GHAZIABAD"],
    HR: ["GURUGRAM", "GURGAON", "FARIDABAD"],
    GJ: ["AHMEDABAD", "SURAT", "VADODARA"],
    RJ: ["JAIPUR", "JODHPUR"],
    WB: ["KOLKATA"],
    TS: ["HYDERABAD"],
    TG: ["HYDERABAD"],
    AP: ["VIJAYAWADA", "VISAKHAPATNAM"],
    MP: ["BHOPAL", "INDORE"],
    PB: ["LUDHIANA", "CHANDIGARH", "AMRITSAR"],
    CH: ["CHANDIGARH"],
    KL: ["KOCHI", "ERNAKULAM", "THIRUVANANTHAPURAM"],
    BR: ["PATNA"],
    JH: ["RANCHI", "JAMSHEDPUR"],
    OD: ["BHUBANESWAR"],
    OR: ["BHUBANESWAR"],
    AS: ["GUWAHATI"],
    UK: ["DEHRADUN"],
    CG: ["RAIPUR"],
    HP: ["SHIMLA"],
    JK: ["JAMMU", "SRINAGAR"],
    GA: ["PANAJI", "GOA"],
  };

  const resolveRtoFromRc = async (
    regNo: string,
    rc?: any
  ): Promise<CvRtoDetails | null> => {
    try {
      // RTO code: prefer RC's rto_code, else parse from reg number
      let rtoCode = String(rc?.rtoCode || "")
        .toUpperCase()
        .replace(/[-\s]/g, "");
      if (!rtoCode) {
        const m = String(regNo)
          .toUpperCase()
          .replace(/[-\s]/g, "")
          .match(/^([A-Z]{2})(\d{1,2})/);
        if (m) rtoCode = `${m[1]}${m[2].padStart(2, "0")}`;
      }

      // Build city candidates from RC data.
      // FIRST try the RTO code itself — the endpoint may match rtolocation
      // ("DL-01") directly, which is the most precise lookup possible.
      const rawCandidates: string[] = [];
      if (rtoCode.length >= 3) {
        rawCandidates.push(
          `${rtoCode.slice(0, 2)}-${rtoCode.slice(2)}` // "DL-01"
        );
        rawCandidates.push(rtoCode); // "DL01"
      }
      const pushWords = (s: string) => {
        const n = norm(s);
        if (!n) return;
        const words = n.split(" ");
        rawCandidates.push(n); // full string
        rawCandidates.push(words[words.length - 1]); // last word
        if (words.length >= 2)
          rawCandidates.push(words.slice(-2).join(" ")); // last two words
      };
      if (rc?.addressDistrict) pushWords(rc.addressDistrict);
      if (rc?.addressCity) pushWords(rc.addressCity);
      if (rc?.registeredAt) pushWords(rc.registeredAt);
      if (rc?.addressState) rawCandidates.push(norm(rc.addressState));

      // Expand aliases (DELHI -> NEW DELHI, etc.) and dedupe
      const candidates: string[] = [];
      for (const c of rawCandidates) {
        if (c && !candidates.includes(c)) candidates.push(c);
        for (const alias of CITY_ALIASES[c] || []) {
          if (!candidates.includes(alias)) candidates.push(alias);
        }
      }

      // Final fallback tier: major cities for the RTO code's state prefix
      const statePrefix = rtoCode.slice(0, 2);
      for (const city of STATE_PREFIX_CITIES[statePrefix] || []) {
        if (!candidates.includes(city)) candidates.push(city);
      }

      console.log("RTO CANDIDATES:", candidates, "code:", rtoCode);

      for (const city of candidates) {
        const res = await fetch(
          `/api/zuno/cv/rto-by-city?city=${encodeURIComponent(city)}`
        );
        if (!res.ok) continue; // 404 = city not in Zuno master, try next
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        if (!list.length) continue;

        // Prefer the exact RTO by code: "DL-01" vs our "DL01"
        const hit =
          list.find(
            (r: any) =>
              norm(r.rtolocation || "").replace(/[-\s]/g, "") === rtoCode
          ) || list[0];

        console.log("RTO RESOLVED via city:", city, "->", hit.rtolocation);
        return mapRto(hit);
      }

      console.log("RTO RESOLVE: no city candidate matched", candidates);
      return null;
    } catch (e) {
      console.log("RTO RESOLVE ERROR", e);
      return null;
    }
  };

  // ============================================================
  // MAIN: View Prices -> RC lookup (with pending polling) ->
  // match Zuno masters -> resolve RTO -> vehicleInfo dialog
  // ============================================================
  const checkVehicle = async () => {
    const regNo = vehicleNumber.toUpperCase().replace(/[-\s]/g, "");

    if (!/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{3,4}$/.test(regNo)) {
      alert("Enter a valid vehicle number (e.g. DL01LAG8279)");
      return;
    }

    setIsNewVehicle(false);
    setFetching(true);
    setFetchStatus("Fetching vehicle details...");

    try {
      // ---- 1) RC lookup (server retries once internally on pending) ----
      // No frontend polling loop anymore: each poll would submit ANOTHER
      // order to RechargeKit. If it's still pending, VAHAN is slow — let
      // the user choose between waiting or filling details manually.
      const res = await fetch("/api/vahan/cv/cv-rc-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: regNo }),
      });
      const rcJson: any = await res.json();

      if (rcJson?.pending) {
        const fillManually = window.confirm(
          "The vehicle registry is slow right now.\n\n" +
            "Press OK to fill your vehicle details manually, or " +
            "Cancel to try fetching again in a minute."
        );
        if (fillManually) {
          setActiveSection("chooseVehicle");
        }
        return;
      }

      if (!rcJson?.success) {
        // RC truly not found / invalid -> manual selection
        alert(
          rcJson?.message ||
            "Could not fetch vehicle details. Please select manually."
        );
        setActiveSection("chooseVehicle");
        return;
      }

      const rc = rcJson.data;
      console.log("RC VEHICLE CLASS", rc.vehicleClass);

      // Save RC classification for correct quote rating (GCV vs PCV) and
      // for fullQuote/policy fields (chassis, engine, real reg date).
      localStorage.setItem(
        "cvRcDetails",
        JSON.stringify({
          vehicleClass: rc.vehicleClass, // e.g. "GOODS CARRIER"
          vehicleCategory: rc.vehicleCategory, // e.g. "LGV" / "HGV"
          grossWeight: rc.grossWeight, // e.g. "7490"
          seatingCapacity: rc.seatingCapacity,
          fuelType: rc.fuelType,
          registrationDate: rc.registrationDate, // real date, not year-03-03
          chassisNumber: rc.chassisNumber,
          engineNumber: rc.engineNumber,
          permitType: rc.permitType,
          previousInsurer: rc.previousInsurer,
          insuranceUpto: rc.insuranceUpto,
        })
      );

      // ---- 2) Vehicle type from RC class ----
      const vType = guessVehicleType(rc.vehicleClass);
      setSelectedVehicle(vType);

      // ---- 3+4) Resolve MAKE + MODEL together via the /model endpoint ----
      // Zuno's CV API has NO /make endpoint (only /model, /variant, /idv).
      // Instead: clean the RC manufacturer name and probe /model with a few
      // candidates — a non-empty model list means the make is valid, and we
      // get the model list in the same call.
      setFetchStatus("Matching your vehicle...");

      const cleaned = norm(rc.makerDescription).replace(
        /\b(LTD|LIMITED|PVT|PRIVATE|COMPANY|CO)\b/g,
        ""
      );
      const words = cleaned.split(" ").filter(Boolean);

      // e.g. "ASHOK LEYLAND LTD" -> try "ASHOK LEYLAND", then "ASHOK"
      const candidates = Array.from(
        new Set(
          [
            words.join(" "),
            words.slice(0, 3).join(" "),
            words.slice(0, 2).join(" "),
            words[0] || "",
          ].filter(Boolean)
        )
      );

      let matchedMake: string | null = null;
      let modelList: string[] = [];

      for (const candidate of candidates) {
        const modelRes = await fetch(
          `/api/zuno/cv/model?make=${encodeURIComponent(candidate)}`
        );
        if (!modelRes.ok) continue;
        const modelJson = await modelRes.json();
        const list: string[] = (Array.isArray(modelJson)
          ? modelJson
          : modelJson.data || []
        ).map((x: any) => x.model || x);

        if (list.length > 0) {
          matchedMake = candidate;
          modelList = list;
          break;
        }
      }

      if (!matchedMake) {
        alert("Couldn't identify the brand automatically. Please select it.");
        setActiveSection("vehicleBrand");
        return;
      }
      setSelectedBrand(matchedMake);

      const matchedModel = bestMatch(rc.makerModel, modelList);
      if (!matchedModel) {
        alert(`Found ${matchedMake}. Please select the model.`);
        setActiveSection("vehicleModel");
        return;
      }
      setSelectedModel(matchedModel);

      // ---- 5) Match VARIANT (seating capacity from RC first) ----
      const variantRes = await fetch(
        `/api/zuno/cv/variant?make=${encodeURIComponent(
          matchedMake
        )}&model=${encodeURIComponent(matchedModel)}`
      );
      const variantJson = await variantRes.json();
      const variantList: string[] = (Array.isArray(variantJson)
        ? variantJson
        : variantJson.data || []
      ).map((x: any) => x.variant || x);

      let matchedVariant: string | null = null;

      // Trucks: match by GVW (RC gives gross_vehicle_weight, variants look
      // like "GVW 7450"). Exact number first, then nearest within 5%.
      const gvw = Number(String(rc.grossWeight).replace(/\D/g, ""));
      if (gvw > 0) {
        const gvwVariants = variantList
          .map((v) => {
            const m = v.match(/GVW\s*(\d+)/i);
            return m ? { v, w: Number(m[1]) } : null;
          })
          .filter(Boolean) as { v: string; w: number }[];

        const exact = gvwVariants.find((x) => x.w === gvw);
        if (exact) {
          matchedVariant = exact.v;
        } else if (gvwVariants.length) {
          const nearest = gvwVariants.reduce((a, b) =>
            Math.abs(a.w - gvw) < Math.abs(b.w - gvw) ? a : b
          );
          if (Math.abs(nearest.w - gvw) / gvw <= 0.05) {
            matchedVariant = nearest.v; // within 5% -> accept
          }
        }
      }

      // Buses: match by seating capacity
      if (!matchedVariant && rc.seatingCapacity) {
        const seats = Number(rc.seatingCapacity);
        // Zuno variants: "25 +1 SEATER DELUXE 26(STR)" — total seats = 26
        matchedVariant =
          variantList.find((v) => {
            const total = v.match(/(\d+)\s*\(?STR\)?/i);
            const plus = v.match(/^(\d+)\s*\+\s*1/);
            const plain = v.match(/^(\d+)\s*SEATER/i);
            return (
              (total && Number(total[1]) === seats) ||
              (plus && Number(plus[1]) + 1 === seats) ||
              (plain && Number(plain[1]) === seats)
            );
          }) || null;
      }
      if (!matchedVariant && variantList.length === 1) {
        matchedVariant = variantList[0];
      }
      if (!matchedVariant) {
        alert(`Found ${matchedMake} ${matchedModel}. Please pick the variant.`);
        setActiveSection("vehicleVariant");
        return;
      }
      setSelectedVariant(matchedVariant);

      // ---- 6) Year from RC registration date ----
      const year = yearFromRegDate(rc.registrationDate);
      if (year) setSelectedYear(year);

      // ---- 7) Full RTO — city candidates from RC, matched by rto_code ----
      const rto = await resolveRtoFromRc(regNo, rc);
      if (rto) {
        setSelectedRto(rto);
        localStorage.setItem("cvRtoDetails", JSON.stringify(rto));
        await fetchIdvDetails(rto, matchedMake, matchedModel, matchedVariant);
      }

      // ---- 8) Save payload + route to the right step ----
      saveCvVehicle({
        year,
        rto,
        make: matchedMake,
        model: matchedModel,
        variant: matchedVariant,
      });

      if (!rto) {
        setActiveSection("rtoDialog"); // only missing piece
      } else if (!year) {
        setActiveSection("yearDialog");
      } else {
        setActiveSection("vehicleInfo"); // fully auto-filled
      }
    } catch (err) {
      console.log("CHECK VEHICLE ERROR", err);
      alert("Something went wrong. Please select your vehicle manually.");
      setActiveSection("chooseVehicle");
    } finally {
      setFetching(false);
      setFetchStatus("");
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.wrapper}>
        <div className={styles.container}>
          {/* Left Section */}
          <div className={styles.left}>
            <span className={styles.badge}>GET POLICY IN JUST 2 MINUTES</span>
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
              Brand new vehicle?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsNewVehicle(true);
                  setVehicleNumber("Brand New");
                  setSelectedBrand(null);
                  setSelectedModel(null);
                  setSelectedVariant(null);
                  setSelectedYear(null);
                  setSelectedRto(null);
                  setActiveSection("chooseVehicle");
                }}
              >
                Click here
              </a>
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
              onClick={checkVehicle}
              disabled={fetching}
            >
              {fetching ? fetchStatus || "Fetching..." : "View Prices"}
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
          onChooseRto={() => setActiveSection("rtoDialog")}
          vehicleNumber={vehicleNumber}
          selectedVehicle={selectedVehicle}
          selectedBrand={selectedBrand}
          selectedModel={selectedModel}
          selectedVariant={selectedVariant}
          selectedYear={selectedYear}
          selectedRto={selectedRto}
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
            setSelectedModel(null);
            setSelectedVariant(null);
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
            setSelectedVariant(null);
            setActiveSection("vehicleVariant");
          }}
        />
      )}

      {activeSection === "vehicleVariant" && selectedBrand && selectedModel && (
        <VehicleVariantDialog
          onBackToModel={() => setActiveSection("vehicleModel")}
          onNextToYear={() => setActiveSection("yearDialog")}
          onClose={() => setActiveSection(null)}
          vehicleNumber={vehicleNumber}
          selectedVehicle={selectedVehicle}
          selectedBrand={selectedBrand}
          selectedModel={selectedModel}
          onSelectVariant={async (variant) => {
            setSelectedVariant(variant);
            if (isNewVehicle) {
              // brand new -> no reg no -> must ask RTO
              setActiveSection("rtoDialog");
            } else if (!selectedRto) {
              // registered vehicle in manual fallback -> try auto RTO first
              const rto = await resolveRtoFromRc(vehicleNumber);
              if (rto) {
                setSelectedRto(rto);
                localStorage.setItem("cvRtoDetails", JSON.stringify(rto));
                setActiveSection("yearDialog");
              } else {
                setActiveSection("rtoDialog");
              }
            } else {
              setActiveSection("yearDialog");
            }
          }}
        />
      )}

      {activeSection === "rtoDialog" &&
        selectedBrand &&
        selectedModel &&
        selectedVariant && (
          <RtoDialog
            onBack={() => setActiveSection("vehicleVariant")}
            onClose={() => setActiveSection(null)}
            vehicleNumber={vehicleNumber}
            selectedVehicle={selectedVehicle}
            selectedBrand={selectedBrand}
            selectedModel={selectedModel}
            selectedVariant={selectedVariant}
            onSelectRto={async (rto) => {
              const mapped = mapRto(rto);
              setSelectedRto(mapped);
              localStorage.setItem("cvRtoDetails", JSON.stringify(mapped));
              if (selectedYear) {
                saveCvVehicle({ year: selectedYear, rto: mapped });
              }
              await fetchIdvDetails(mapped);
              setActiveSection(selectedYear ? "vehicleInfo" : "yearDialog");
            }}
          />
        )}

      {activeSection === "yearDialog" &&
        selectedBrand &&
        selectedModel &&
        selectedVariant && (
          <YearDialog
            onBack={() => setActiveSection("vehicleVariant")}
            onClose={() => setActiveSection(null)}
            vehicleNumber={vehicleNumber}
            selectedVehicle={selectedVehicle}
            selectedBrand={selectedBrand}
            selectedModel={selectedModel}
            selectedVariant={selectedVariant}
            onSelectYear={(year) => {
              setSelectedYear(year);
              // FIX: always save the real RTO (was: isNewVehicle ? selectedRto : null)
              saveCvVehicle({ year, rto: selectedRto });
              setActiveSection("vehicleInfo");
            }}
          />
        )}
      <Footer />
    </>
  );
};

export default CommercialVehicle1;