"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "@/styles/components/GlobalAlert.module.css";
import logo from "@/assets/logo.png";

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
      }, 2000);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  if (!message) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.toast} role="alert" aria-live="assertive">
        <span className={styles.accent} aria-hidden="true" />
        <span className={styles.logoWrapper}>
          <Image src={logo} alt="Zanifest Insurance" width={190} height={55} />
        </span>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
