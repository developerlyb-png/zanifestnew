"use client";

import React, { useState } from "react";
import styles from "@/styles/pages/carinsurance.module.css";

import { rtoData } from "@/data/rtoData";

export default function Location({
  onClose,
  onSelectVehicle,
}: any) {
  const [state, setState] = useState<string | null>(null);

  return (
    <div className={styles.vehicleModal}>

      <div className={styles.vehicleDialog}>

        {/* =================================================
            LEFT SECTION
        ================================================= */}

        <div className={styles.vehicleLeft}>

          <h2>Your selection</h2>

          <div className={styles.selectedBox}>

            <div className={styles.selectionRow}>

              <span className={styles.locationIcon}>
                ⌖
              </span>

              <span className={styles.locationValue}>
                {state || "Select Registration State"}
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            RIGHT SECTION
        ================================================= */}

        <div className={styles.vehicleRight}>

          <div className={styles.yearHeader}>

            <button
              type="button"
              onClick={() => {
                if (state) {
                  setState(null);
                } else {
                  onClose();
                }
              }}
              className={styles.yearBackBtn}
              aria-label="Go back"
            >
              ‹
            </button>

            <h2>
              {!state
                ? "Select Registration State"
                : "Select RTO Code"}
            </h2>

          </div>


          {/* =================================================
              STATE / RTO GRID
          ================================================= */}

          <div className={styles.locationGrid}>

            {!state &&
              Object.keys(rtoData).map((item) => (
                <button
                  type="button"
                  key={item}
                  className={styles.locationItem}
                  onClick={() => {
                    setState(item);
                  }}
                >
                  <span>{item}</span>

                  <span className={styles.yearArrow}>
                    ›
                  </span>
                </button>
              ))}


            {state &&
              rtoData[state].map((code: string) => (
                <button
                  type="button"
                  key={code}
                  className={styles.locationItem}
                  onClick={() => {
                    onSelectVehicle({
                      state: state,
                      rto: code,
                    });
                  }}
                >
                  <span>{code}</span>

                  <span className={styles.yearArrow}>
                    ›
                  </span>
                </button>
              ))}

          </div>

        </div>

      </div>

    </div>
  );
}