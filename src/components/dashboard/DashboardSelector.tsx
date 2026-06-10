import React, { useEffect, useState } from "react";
import styles from "@/styles/components/dashboard/DashboardSelector.module.css";
import Image from "next/image";

import { FaChevronDown } from "react-icons/fa";

const LIST = [
  { id: 0, name: "Dashboard", image: require("@/assets/dashboard/list/dashboard.png") },
  { id: 1, name: "Profile", image: require("@/assets/dashboard/list/profile.png") },
  { id: 2, name: "My Policy", image: require("@/assets/dashboard/list/policy.png") },
  { id: 3, name: "Claims", image: require("@/assets/dashboard/list/claim.png") },
  { id: 4, name: "KYC", image: require("@/assets/dashboard/list/kyc.png") },
  { id: 5, name: "Get help", image: require("@/assets/dashboard/list/help.png") },
  { id: 6, name: "Reset Password", image: require("@/assets/dashboard/list/profile.png") },

];

function DashboardSelector({
  selected,
  setSelected,
}: {
  selected: number;
  setSelected: any;
}) {
  const [showDropDown, setShowDropDown] = useState<boolean>(false);
  return (
    <>
      <div className={styles.mobileCont}>
        <div
          className={` ${styles.active} ${styles.mobileitem}`}
          onClick={() => {
            setShowDropDown((prev) => !prev);
          }}
          onBlur={() => {
            setShowDropDown(false);
          }}
        >
          <Image
            src={LIST[selected].image}
            alt={LIST[selected].name}
            className={styles.image}
          />
          <div className={styles.name}>{LIST[selected].name}</div>
          <FaChevronDown />
        </div>
        {showDropDown && (
          <div className={styles.dropdown}>
            {LIST.map((item, index) => {
              console.log(item);

              return (
                <div
                  key={item.id}
                  className={`${styles.mobileitem}`}
                  onClick={() => {
                    setSelected(item.id);
                    setShowDropDown(false);
                  }}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    className={styles.image}
                  />
                  <div className={styles.name}>{item.name}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className={styles.cont}>
        {LIST.map((item, index) => {
          console.log(item);

          return (
            <div
              key={item.id}
              className={`${styles.item} ${
                selected == item.id ? styles.active : ""
              }`}
              onClick={() => {
                setSelected(item.id);
              }}
            >
              <Image
                src={item.image}
                alt={item.name}
                className={styles.image}
              />
              <div className={styles.name}>{item.name}</div>
            </div>
          );
        })}
        <Image
          src={require("@/assets/dashboard/list/bottom.png")}
          alt="decoration"
          className={styles.bottomImage}
        />
      </div>
    </>
  );
}

export default DashboardSelector;
