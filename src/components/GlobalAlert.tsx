// components/GlobalAlert.tsx
"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/components/GlobalAlert.module.css";
import logo from "@/assets/logo.png";
import Image from "next/image";

let alertCallback: (() => void) | null = null;

export function showGlobalAlert(msg: string, cb?: () => void) {
  window.alert(msg);
  alertCallback = cb || null;
}

export default function GlobalAlert() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (msg: string) => {
      setMessage(msg);

      setTimeout(() => {
        setMessage(null);
        if (alertCallback) {
          alertCallback();
          alertCallback = null;
        }
      }, 2000); // ⏱ 2 seconds
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  if (!message) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.dialog}>
        {/* 🔥 Logo Center Top */}
        <div className={styles.logoWrapper}>
          <Image src={logo} alt="Zanifest Logo" width={80} height={80} />
        </div>

        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
