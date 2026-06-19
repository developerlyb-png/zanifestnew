"use client";

import React, { useState } from "react";
import styles from "@/styles/pages/carinsurance.module.css";

import { rtoData } from "@/pages/src/data/rtoData";

export default function Location({ onClose, onSelectVehicle }: any) {
  const [state, setState] = useState<string | null>(null);

  return (
    <div className={styles.locationOverlay}>
      <div className={styles.locationBox}>
        <div className={styles.locationHeader}>
          <button onClick={onClose} className={styles.backBtn}>
            ‹
          </button>

          <h2>{!state ? "Select Registration State" : "Select RTO Code"}</h2>
        </div>

        <div className={styles.locationGrid}>
          {/* STATE LIST */}

          {!state &&
            Object.keys(rtoData).map((item) => (
              <button
                key={item}
                className={styles.locationItem}
                onClick={() => {
                  setState(item);
                }}
              >
                {item}
              </button>
            ))}

          {/* RTO LIST */}

          {state &&
            rtoData[state].map((code: string) => (
              <button
                key={code}
                className={styles.locationItem}
                onClick={() => {
                  onSelectVehicle({
                    state: state,

                    rto: code,
                  });
                }}
              >
                {code}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
