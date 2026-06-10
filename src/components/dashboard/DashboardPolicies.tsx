import React from "react";

import styles from "@/styles/components/dashboard/DashboardPolicies.module.css";
import Image from "next/image";
import { LuUser } from "react-icons/lu";

import { FaChevronRight } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

function DashboardPolicies() {
  const { user } = useAuth();

  return (
    <div className={styles.cont}>
      <div className={styles.greeting}>
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
              <p className={styles.red}>Expire </p>
              <p> on 28 June 2025</p>
            </div>
            <button className={styles.more}>
              See More <FaChevronRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPolicies;
