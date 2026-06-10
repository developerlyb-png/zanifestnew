"use client";
import React from "react";
import styles from "@/styles/loader.module.css";

export default function Loader() {
  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loader}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
