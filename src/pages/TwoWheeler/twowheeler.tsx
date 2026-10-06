"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/pages/TwoWheeler/twowheel.module.css";
import Image from "next/image";
import scooterImg from "@/assets/motorcycle.png";

import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";

import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/router";

import AOS from "aos";
import "aos/dist/aos.css";

/* =========================
   YEARS
========================= */

const currentYear = new Date().getFullYear();

const years = Array.from(
  { length: 20 },
  (_, i) => currentYear - 1 - i
);

/* =========================
   MAKES
========================= */

const makes = [
  {
    name: "Honda",
    image: require("@/assets/home/hondacar.png"),
  },
  {
    name: "Bajaj",
    image: require("@/assets/home/bajaj logo.png"),
  },
  {
    name: "TVS",
    image: require("@/assets/home/tvs logo.png"),
  },
  {
    name: "Yamaha",
    image: require("@/assets/home/yamaha.png"),
  },
  {
    name: "Hero Motorcorp",
    image: require("@/assets/home/hero (2).png"),
  },
  {
    name: "Royal Enfield",
    image: require("@/assets/home/royal logo.png"),
  },
  {
    name: "Suzuki",
    image: require("@/assets/home/SuzukiLogo (2).png"),
  },
  {
    name: "Mahindra",
    image: require("@/assets/home/Mahindra.png"),
  },
  {
    name: "KTM",
    image: require("@/assets/home/ktm.png"),
  },
  {
    name: "LML",
    image: require("@/assets/home/lml.png"),
  },
  {
    name: "Ola",
    image: require("@/assets/home/ola.png"),
  },
  {
    name: "Harley Davidson",
    image: require("@/assets/home/harley.png"),
  },
];

export default function TwoWheeler() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<
    "years" | "makes" | "models" | "variants" | "vehicleDetails"
  >("years");

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  const [models, setModels] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  const [selectedVariant, setSelectedVariant] = useState("");

  const [idvData, setIdvData] = useState<any>(null);

  const [showOtherModels, setShowOtherModels] =
    useState(false);

  const [engineNumber, setEngineNumber] =
    useState("");

  const [chassisNumber, setChassisNumber] =
    useState("");

  /* =========================
     COMMON HEADER
  ========================= */

  const StepHeader = ({
    title,
    onBack,
  }: {
    title: string;
    onBack: () => void;
  }) => {
    return (
      <div className={styles.stepHeader}>
        <button
          type="button"
          className={styles.headerBackButton}
          onClick={onBack}
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>

        <h2 className={styles.headerTitle}>
          {title}
        </h2>
      </div>
    );
  };

  /* =========================
     LOAD VAHAN DATA
  ========================= */

  const loadVehicleFromVahan = async (rc: any) => {
    try {
      setLoading(true);

      localStorage.setItem(
        "vahanExtra",
        JSON.stringify(rc)
      );

      setEngineNumber(rc.engine || "");
      setChassisNumber(rc.chassis || "");

      setSelectedYear(
        rc.year?.split("/")[1] || ""
      );

      const makeName = (
        rc.brand || ""
      ).toUpperCase();

      setSelectedMake(makeName);

      /* MODEL API */

      const modelRes = await fetch(
        `/api/sbi/2w/master/model?make=${encodeURIComponent(
          makeName
        )}`
      );

      const modelJson = await modelRes.json();

      const modelList = Array.isArray(modelJson)
        ? modelJson
        : modelJson.data || [];

      setModels(modelList);

      console.log(
        "MODEL LIST FOR",
        makeName,
        ">>>",
        modelList
      );

      if (!modelList.length) {
        setStep("makes");
        return;
      }

      const rcModel = String(
        rc.model || ""
      )
        .toUpperCase()
        .replace(/\(.*?\)/g, "")
        .replace(/\+/g, "PLUS")
        .replace(/XTEC/g, "")
        .replace(/HERO HONDA/g, "")
        .replace(/HERO/g, "")
        .replace(/HONDA/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const matchedModel = modelList.find(
        (x: any) => {
          const apiModel = String(
            x.model
          )
            .toUpperCase()
            .replace(/\+/g, "PLUS")
            .replace(/\s+/g, " ")
            .trim();

          return (
            apiModel === rcModel ||
            apiModel.startsWith(rcModel) ||
            rcModel.startsWith(apiModel) ||
            apiModel.includes(rcModel) ||
            rcModel.includes(apiModel)
          );
        }
      );

      if (!matchedModel) {
        setStep("models");
        return;
      }

      setSelectedModel(
        matchedModel.model
      );

      /* VARIANT API */

      const variantRes = await fetch(
        `/api/sbi/2w/master/variant?make=${encodeURIComponent(
          makeName
        )}&model=${encodeURIComponent(
          matchedModel.model
        )}`
      );

      const variantJson =
        await variantRes.json();

      const variantList =
        Array.isArray(variantJson)
          ? variantJson
          : variantJson.data || [];

      setVariants(variantList);

      if (!variantList.length) {
        setStep("variants");
        return;
      }

      const matchedVariant =
        variantList.find((x: any) =>
          String(x.variant)
            .toUpperCase()
            .includes(
              String(
                rc.model
              ).toUpperCase()
            )
        ) || variantList[0];

      setSelectedVariant(
        matchedVariant.variant
      );

      /* IDV API */

      const idvRes = await fetch(
        `/api/sbi/2w/master/idv?make=${encodeURIComponent(
          makeName
        )}&model=${encodeURIComponent(
          matchedModel.model
        )}&variant=${encodeURIComponent(
          matchedVariant.variant
        )}&idvCity=MUMBAI`
      );

      const idvJson =
        await idvRes.json();

      setIdvData(idvJson.data);

      /* RTO API */

      const rtoRes = await fetch(
        `/api/sbi/2w/master/rto?idvCity=MUMBAI`
      );

      const rtoJson =
        await rtoRes.json();

      if (
        Array.isArray(rtoJson) &&
        rtoJson[0]
      ) {
        localStorage.setItem(
          "selectedRto",
          JSON.stringify(rtoJson[0])
        );
      }

      setStep("vehicleDetails");
    } catch (e) {
      console.log(
        "LOAD VEHICLE ERROR >>>",
        e
      );

      setStep("makes");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     EFFECTS
  ========================= */

  useEffect(() => {
    const rc = localStorage.getItem(
      "bikeRcDetails"
    );

    if (rc) {
      loadVehicleFromVahan(
        JSON.parse(rc)
      );
    }
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [step]);

  return (
    <div className={styles.pageWrapper}>
      <UserDetails />

      <Navbar />

      <div className={styles.container}>

        {/* =========================
            LEFT SECTION
        ========================= */}

        <div className={styles.leftSection}>
          <div className={styles.imageWrapper}>
            <Image
              src={scooterImg}
              alt="Scooter"
              className={styles.image}
              priority
            />
          </div>
        </div>

        {/* =========================
            RIGHT SECTION
        ========================= */}

        <div className={styles.rightSection}>

          {/* =========================
              YEARS
          ========================= */}

          {step === "years" && (
            <div data-aos="fade-left">

              <StepHeader
                title="When did you buy your Bike/Scooter?"
                onBack={() =>
                  router.back()
                }
              />

              <div
                className={
                  styles.yearGrid
                }
              >

                <div
                  className={
                    styles.yearButton
                  }
                  onClick={() => {
                    setSelectedYear(
                      String(currentYear)
                    );

                    localStorage.setItem(
                      "isNewBike",
                      "true"
                    );

                    setStep("makes");
                  }}
                >
                  Brand New Bike ›
                </div>

                {years.map(
                  (year) => (
                    <button
                      key={year}
                      className={
                        styles.yearButton
                      }
                      onClick={() => {
                        setSelectedYear(
                          String(year)
                        );

                        localStorage.setItem(
                          "isNewBike",
                          "false"
                        );

                        setStep("makes");
                      }}
                    >
                      {year}
                    </button>
                  )
                )}

              </div>
            </div>
          )}

          {/* =========================
              MAKES
          ========================= */}

          {step === "makes" && (
            <div
              data-aos="fade-left"
              className={
                styles.makesWrapper
              }
            >

              <StepHeader
                title="Select Two Wheeler Make"
                onBack={() =>
                  setStep("years")
                }
              />

              {/* SEARCH */}

              <div
                className={
                  styles.searchBox
                }
              >
                <input
                  type="text"
                  placeholder="Search two wheeler make"
                  className={
                    styles.searchInput
                  }
                />

                {/* <span
                  className={
                    styles.searchIcon
                  }
                >
                  🔍
                </span> */}
              </div>

              {/* POPULAR MAKES */}

              <p
                className={
                  styles.popularTitle
                }
              >
                Popular Makes

                <span
                  className={
                    styles.titleLine
                  }
                ></span>
              </p>

              {/* MAKE GRID */}

              <div
                className={
                  styles.grid
                }
              >

                {makes.map(
                  (make, index) => (
                    <div
                      key={index}
                      className={
                        styles.makeCard
                      }
                      onClick={async () => {
                        try {
                          setLoading(true);

                          const makeName =
                            make.name.toUpperCase();

                          setSelectedMake(
                            makeName
                          );

                          const res =
                            await fetch(
                              `/api/sbi/2w/master/model?make=${encodeURIComponent(
                                makeName
                              )}`
                            );

                          const data =
                            await res.json();

                          console.log(
                            "MODEL DATA",
                            data
                          );

                          if (
                            Array.isArray(
                              data
                            )
                          ) {
                            setModels(
                              data
                            );
                          } else if (
                            Array.isArray(
                              data.data
                            )
                          ) {
                            setModels(
                              data.data
                            );
                          } else {
                            setModels(
                              []
                            );
                          }

                          setStep(
                            "models"
                          );
                        } catch (
                          error
                        ) {
                          console.log(
                            "MAKE ERROR",
                            error
                          );

                          setModels(
                            []
                          );

                          setStep(
                            "models"
                          );
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >

                      {/* LOGO */}

                      <div
                        className={
                          styles.makeImageWrapper
                        }
                      >
                        <Image
                          src={
                            make.image
                          }
                          alt={`${make.name} logo`}
                          width={60}
                          height={45}
                          className={
                            styles.makeIcon
                          }
                        />
                      </div>

                      {/* NAME */}

                      <span
                        className={
                          styles.makeText
                        }
                      >
                        {make.name}
                      </span>

                    </div>
                  )
                )}

              </div>

              {/* SEARCH OTHER */}

              <p
                className={
                  styles.searchText
                }
              >
                Can't find your bike's make?
                <span>
                  {" "}
                  Click here to search
                </span>
              </p>

            </div>
          )}

          {/* =========================
              MODELS
          ========================= */}

          {step === "models" && (
            <div
              data-aos="fade-left"
              className={
                styles.modelsWrapper
              }
            >

              <StepHeader
                title="Select Two Wheeler Model"
                onBack={() =>
                  setStep("makes")
                }
              />

              <input
                type="text"
                placeholder={`Search ${selectedMake} two wheeler model`}
                className={
                  styles.searchInput
                }
              />

              <p
                className={
                  styles.sectionTitle
                }
              >
                Popular models
              </p>

              <div
                className={
                  styles.grids
                }
              >

                {Array.isArray(
                  models
                ) &&
                  models
                    .slice(0, 6)
                    .map(
                      (
                        item: any,
                        index: number
                      ) => (
                        <div
                          key={index}
                          className={
                            styles.modelCard
                          }
                          onClick={async () => {
                            setSelectedModel(
                              item.model
                            );

                            const res =
                              await fetch(
                                `/api/sbi/2w/master/variant?make=${encodeURIComponent(
                                  selectedMake
                                )}&model=${encodeURIComponent(
                                  item.model
                                )}`
                              );

                            const data =
                              await res.json();

                            setVariants(
                              Array.isArray(
                                data
                              )
                                ? data
                                : data.data ||
                                  []
                            );

                            setStep(
                              "variants"
                            );
                          }}
                        >
                          {item.model}
                        </div>
                      )
                    )}

              </div>

              <p
                className={
                  styles.sectionTitle
                }
                onClick={() =>
                  setShowOtherModels(
                    !showOtherModels
                  )
                }
                style={{
                  cursor:
                    "pointer",
                }}
              >
                Other models
              </p>

              {/* OTHER MODELS POPUP */}

              {showOtherModels && (
                <div
                  className={
                    styles.modalOverlay
                  }
                  onClick={() =>
                    setShowOtherModels(
                      false
                    )
                  }
                >

                  <div
                    className={
                      styles.modelPopup
                    }
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >

                    <div
                      className={
                        styles.popupHeader
                      }
                    >

                      <h3>
                        Other Models
                      </h3>

                      <button
                        type="button"
                        onClick={() =>
                          setShowOtherModels(
                            false
                          )
                        }
                      >
                        ×
                      </button>

                    </div>

                    <div
                      className={
                        styles.grids
                      }
                    >

                      {Array.isArray(
                        models
                      ) &&
                        models
                          .slice(6)
                          .map(
                            (
                              item: any,
                              index: number
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className={
                                  styles.modelCard
                                }
                                onClick={async () => {
                                  setSelectedModel(
                                    item.model
                                  );

                                  const res =
                                    await fetch(
                                      `/api/sbi/2w/master/variant?make=${encodeURIComponent(
                                        selectedMake
                                      )}&model=${encodeURIComponent(
                                        item.model
                                      )}`
                                    );

                                  const data =
                                    await res.json();

                                  setVariants(
                                    Array.isArray(
                                      data
                                    )
                                      ? data
                                      : data.data ||
                                        []
                                  );

                                  setShowOtherModels(
                                    false
                                  );

                                  setStep(
                                    "variants"
                                  );
                                }}
                              >
                                {
                                  item.model
                                }
                              </div>
                            )
                          )}

                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* =========================
              VARIANTS
          ========================= */}

          {step === "variants" && (
            <div
              data-aos="fade-left"
              className={
                styles.modelsWrapper
              }
            >

              <StepHeader
                title="Select Variant"
                onBack={() =>
                  setStep("models")
                }
              />

              <div
                className={
                  styles.grids
                }
              >

                {variants.map(
                  (
                    item: any,
                    index: number
                  ) => (
                    <div
                      key={index}
                      className={
                        styles.modelCard
                      }
                      onClick={async () => {

                        setSelectedVariant(
                          item.variant
                        );

                        const vehicleNo =
                          (
                            localStorage.getItem(
                              "vehicleNumber"
                            ) || ""
                          )
                            .toUpperCase()
                            .replace(
                              /[^A-Z0-9]/g,
                              ""
                            );

                        let idvCity =
                          "AHMEDABAD";

                        if (
                          vehicleNo.startsWith(
                            "MH"
                          )
                        ) {
                          idvCity =
                            "MUMBAI";
                        } else if (
                          vehicleNo.startsWith(
                            "DL"
                          )
                        ) {
                          idvCity =
                            "DELHI";
                        } else if (
                          vehicleNo.startsWith(
                            "GJ"
                          )
                        ) {
                          idvCity =
                            "AHMEDABAD";
                        }

                        /* IDV */

                        const res =
                          await fetch(
                            `/api/sbi/2w/master/idv?make=${encodeURIComponent(
                              selectedMake
                            )}&model=${encodeURIComponent(
                              selectedModel
                            )}&variant=${encodeURIComponent(
                              item.variant
                            )}&idvCity=${idvCity}`
                          );

                        const result =
                          await res.json();

                        console.log(
                          "IDV DATA",
                          result
                        );

                        setIdvData(
                          result.data
                        );

                        /* RTO */

                        const rtoRes =
                          await fetch(
                            `/api/sbi/2w/master/rto?idvCity=${idvCity}`
                          );

                        const rtoResult =
                          await rtoRes.json();

                        const selectedRto =
                          Array.isArray(
                            rtoResult
                          )
                            ? rtoResult[0]
                            : rtoResult
                                ?.data?.[0];

                        if (
                          selectedRto
                        ) {
                          localStorage.setItem(
                            "selectedRto",
                            JSON.stringify(
                              selectedRto
                            )
                          );
                        }

                        const isNew =
                          localStorage.getItem(
                            "isNewBike"
                          );

                        if (
                          isNew === "true"
                        ) {

                          const vehicleData =
                            {
                              year:
                                selectedYear,

                              make:
                                selectedMake,

                              model:
                                selectedModel,

                              variant:
                                item.variant,

                              registrationNumber:
                                "",

                              idv:
                                result.data
                                  ?.idvAmount
                                  ?.upto1Year ||
                                "",

                              fuelType:
                                result.data
                                  ?.fuelType ||
                                "",

                              capacity:
                                result.data
                                  ?.capacity ||
                                "",

                              seatingCapacity:
                                result.data
                                  ?.seatingCapacity ||
                                "",

                              exShowroomPrice:
                                result.data
                                  ?.exShowroomPrice ||
                                "",

                              rto:
                                JSON.parse(
                                  localStorage.getItem(
                                    "selectedRto"
                                  ) ||
                                    "{}"
                                ),

                              isNewBike:
                                "true",

                              engineNumber:
                                "",

                              chassisNumber:
                                "",
                            };

                          localStorage.setItem(
                            "selectedBikeData",
                            JSON.stringify(
                              vehicleData
                            )
                          );

                          router.push(
                            "./twowheeler5"
                          );

                        } else {

                          setStep(
                            "vehicleDetails"
                          );

                        }
                      }}
                    >
                      {item.variant}
                    </div>
                  )
                )}

              </div>
            </div>
          )}

          {/* =========================
              VEHICLE DETAILS
          ========================= */}

          {step ===
            "vehicleDetails" && (
            <div
              data-aos="fade-left"
              className={
                styles.modelsWrapper
              }
            >

              <StepHeader
                title="Enter Vehicle Details"
                onBack={() =>
                  setStep("variants")
                }
              />

              <input
                type="text"
                placeholder="Engine Number"
                className={
                  styles.searchInput
                }
                value={
                  engineNumber
                }
                onChange={(e) =>
                  setEngineNumber(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="Chassis Number"
                className={
                  styles.searchInput
                }
                value={
                  chassisNumber
                }
                onChange={(e) =>
                  setChassisNumber(
                    e.target.value
                  )
                }
              />

              {/* =========================
                  ONLY BUTTON CHANGED
              ========================= */}

              <button
                type="button"
                className={
                  styles.continueButton
                }
                onClick={() => {

                  const storedRto =
                    localStorage.getItem(
                      "selectedRto"
                    );

                  let rto = {};

                  try {

                    if (
                      storedRto &&
                      storedRto !==
                        "undefined" &&
                      storedRto !==
                        "null"
                    ) {
                      rto =
                        JSON.parse(
                          storedRto
                        );
                    }

                  } catch (err) {

                    console.error(
                      "Invalid selectedRto:",
                      storedRto
                    );

                    rto = {};
                  }

                  const vehicleData =
                    {
                      year:
                        selectedYear,

                      make:
                        selectedMake,

                      model:
                        selectedModel,

                      variant:
                        selectedVariant,

                      idv:
                        idvData
                          ?.idvAmount
                          ?.upto1Year,

                      fuelType:
                        idvData
                          ?.fuelType,

                      capacity:
                        idvData
                          ?.capacity,

                      seatingCapacity:
                        idvData
                          ?.seatingCapacity,

                      exShowroomPrice:
                        idvData
                          ?.exShowroomPrice,

                      registrationNumber:
                        localStorage.getItem(
                          "vehicleNumber"
                        ),

                      isNewBike:
                        localStorage.getItem(
                          "isNewBike"
                        ),

                      engineNumber,

                      chassisNumber,

                      rto,
                    };

                  console.log(
                    "FINAL SAVE BIKE DATA",
                    vehicleData
                  );

                  localStorage.setItem(
                    "selectedBikeData",
                    JSON.stringify(
                      vehicleData
                    )
                  );

                  router.push(
                    "./twowheeler5"
                  );
                }}
              >
                Continue
              </button>

            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}