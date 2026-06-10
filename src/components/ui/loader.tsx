"use client";
import React from "react";
import styles from "@/styles/components/ui/Loader.module.css";
import Image from "next/image";
import loader from "@/assets/logo.png";

export default function Loader() {
  return (
    <div className={styles.loaderWrapper}>
      <Image
        src={loader}
        alt="Loading..."
        className={styles.logo}
        priority
      />
    </div>
  );
}
