"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "@/styles/components/GlobalAlert.module.css";
import logo from "@/assets/logo.png";
import { humanizeErrorMessage } from "@/utils/friendlyError";

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
      // Raw technical errors (e.g. a server's E11000 text) become a readable
      // sentence; ordinary alert text passes through unchanged.
      const text = humanizeErrorMessage(msg);
      setMessage(text);
      // Longer messages stay up long enough to read (2s minimum, 7s max).
      const ms = Math.min(7000, Math.max(2000, text.length * 45));
      setTimeout(() => {
        setMessage(null);
        if (alertCallback) {
          alertCallback();
          alertCallback = null;
        }
      }, ms);
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
