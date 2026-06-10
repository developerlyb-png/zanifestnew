import React from "react";
import { IoIosArrowForward } from "react-icons/io";
import { FaArrowRight, FaArrowRightLong } from "react-icons/fa6";

import { MdPersonAddAlt } from "react-icons/md";
import { PiCarProfileFill } from "react-icons/pi";

import styles from "@/styles/components/dashboard/DashboardDetails.module.css";
import Image from "next/image";
import { div } from "framer-motion/client";
import { useAuth } from "@/context/AuthContext";

const LIST = [
  {
    id: 0,
    name: "Secure what you love",
    desc: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    icon: <MdPersonAddAlt />,
  },
  {
    id: 1,
    name: "Add Your Vehicle",
    desc: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    icon: <PiCarProfileFill />,
  },
];

function DashboardDetails() {
  const { user } = useAuth();
  return (
    <div className={styles.cont}>
      <div className={styles.top}>
        <div className={styles.topLeft}>Hi, {user?.name || "User"}</div>
        <div className={styles.topRight}>
          Active Policy
          <div className={styles.policyButton}>1</div>
          <FaArrowRight />
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.insuranceItem}>
          <div className={styles.insuranceHead}>
            <Image
              src={require("@/assets/dashboard/details/1.png")}
              alt="car"
              className={styles.insuranceImage}
            />
            <div className={styles.insuranceTitle}>
              <div className={styles.head}>Car Insurance</div>
              <div className={styles.insuranceText}>
                Your Policy will expire on 25 June 2025
              </div>
            </div>
          </div>
          <div className={styles.insuranceBottom}>
            <div className={styles.insuranceDetails}>
              <div className={styles.insuranceDetailsTitle}>Expire Date:</div>
              28 june 2025
            </div>
            <div className={styles.insuranceDetails}>
              <div className={styles.insuranceDetailsTitle}>
                Registration Number:
              </div>
              TN08DF5678
            </div>

            <div className={styles.renewButton}>
              Renew Now <IoIosArrowForward />
            </div>
          </div>
        </div>
        <div>
          {LIST.map((item, index) => {
            return (
              <div key={index} className={styles.option}>
                <div className={styles.icon}>{item.icon}</div>
                <div className={styles.optionCont}>
                  <div className={styles.optionName}>{item.name}</div>
                  <div className={styles.optionDesc}>{item.desc}</div>
                </div>
                <div className={styles.rightArrowDiv}>
                  <FaArrowRightLong />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DashboardDetails;
