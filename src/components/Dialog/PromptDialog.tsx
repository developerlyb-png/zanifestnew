"use client";

import React from "react";
import styles from "@/styles/pages/dialog.module.css";

interface PromptDialogProps {
  open: boolean;
  onLogin: () => void;
  onRegister: () => void;
  onCancel: () => void;
}

export default function PromptDialog({
  open,
  onLogin,
  onRegister,
  onCancel,
}: PromptDialogProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <h2 className={styles.title}>Login / Register to continue</h2>
        {/* <p className={styles.subtitle}>You must sign in to view plans</p> */}

        <div className={styles.buttonGroup}>
          <button className={styles.primaryBtn} onClick={onLogin}>
            Login
          </button>

          <button className={styles.secondaryBtn} onClick={onRegister}>
            Register
          </button>

          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
