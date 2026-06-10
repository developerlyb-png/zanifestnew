import Image from "next/image";
import React from "react";

import styles from "@/styles/components/dashboard/DashboardClaims.module.css";
import { LuUser } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";

function DashboardClaims() {
  const { user } = useAuth();
  return (
    <div className={styles.cont}>
      
        <div>
          Hi, {user?.name || "User"} <LuUser />
        </div>
      
      <div className={styles.inner}>
        <div className={styles.item}>
          <div className={styles.imageCont}>
            <Image
              src={require("@/assets/dashboard/details/1.png")}
              alt="car"
              className={styles.image}
            />
          </div>
          <div className={styles.middle}>
            <p className={styles.top}>Car Insurance</p>
            <div>
              <p className={styles.make}>Maruti Suzuki</p>
              <p className={styles.number}>TN08GH8767</p>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.expire}>
              <p className={styles.grey}>Plan Type : </p>
              <p> Comprehesive Special Inspection</p>
            </div>
            <div className={styles.expire}>
              <p className={styles.grey}>IDV : </p>
              <p>$2800</p>
            </div>
          </div>
        </div>
        <div className={styles.item}>
          <div className={styles.imageCont}>
            <Image
              src={require("@/assets/dashboard/details/1.png")}
              alt="car"
              className={styles.image}
            />
          </div>
          <div className={styles.middle}>
            <p className={styles.top}>Car Insurance</p>
            <div>
              <p className={styles.make}>Maruti Suzuki</p>
              <p className={styles.number}>TN08GH8767</p>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.expire}>
              <p className={styles.grey}>Plan Type : </p>
              <p> Comprehesive Special Inspection</p>
            </div>
            <div className={styles.expire}>
              <p className={styles.grey}>IDV : </p>
              <p>$2800</p>
            </div>
          </div>
        </div>
        <div className={styles.item}>
          <div className={styles.imageCont}>
            <Image
              src={require("@/assets/dashboard/details/1.png")}
              alt="car"
              className={styles.image}
            />
          </div>
          <div className={styles.middle}>
            <p className={styles.top}>Car Insurance</p>
            <div>
              <p className={styles.make}>Maruti Suzuki</p>
              <p className={styles.number}>TN08GH8767</p>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.expire}>
              <p className={styles.grey}>Plan Type : </p>
              <p> Comprehesive Special Inspection</p>
            </div>
            <div className={styles.expire}>
              <p className={styles.grey}>IDV : </p>
              <p>$2800</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardClaims;
