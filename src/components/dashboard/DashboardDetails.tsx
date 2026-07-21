import React, { useEffect, useState } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { FaArrowRight, FaArrowRightLong } from "react-icons/fa6";

import { MdPersonAddAlt } from "react-icons/md";
import { PiCarProfileFill } from "react-icons/pi";

import styles from "@/styles/components/dashboard/DashboardDetails.module.css";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

interface IssuedPolicy {
  _id: string;
  policyType?: string;
  vehicle?: { number?: string; make?: string; model?: string };
  endDate?: string;
  status?: string;
}

const formatExpiry = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "--";

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
  const [policies, setPolicies] = useState<IssuedPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/my-policies", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setPolicies(data.policies || []))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, []);

  const activePolicy = policies[0];

  return (
    <div className={styles.cont}>
      <div className={styles.top}>
        <div className={styles.topLeft}>Hi, {user?.name || "User"}</div>
        <div className={styles.topRight}>
          Active Policy
          <div className={styles.policyButton}>{policies.length}</div>
          <FaArrowRight />
        </div>
      </div>
      <div className={styles.content}>
        {!loading && !activePolicy ? (
          <div className={styles.insuranceItem}>
            <p>No active policy yet — buy one to see it here.</p>
          </div>
        ) : (
          activePolicy && (
            <div className={styles.insuranceItem}>
              <div className={styles.insuranceHead}>
                <Image
                  src={require("@/assets/dashboard/details/1.png")}
                  alt="car"
                  className={styles.insuranceImage}
                />
                <div className={styles.insuranceTitle}>
                  <div className={styles.head}>
                    {activePolicy.policyType || "Car Insurance"}
                  </div>
                  <div className={styles.insuranceText}>
                    Your Policy will expire on{" "}
                    {formatExpiry(activePolicy.endDate)}
                  </div>
                </div>
              </div>
              <div className={styles.insuranceBottom}>
                <div className={styles.insuranceDetails}>
                  <div className={styles.insuranceDetailsTitle}>
                    Expire Date:
                  </div>
                  {formatExpiry(activePolicy.endDate)}
                </div>
                <div className={styles.insuranceDetails}>
                  <div className={styles.insuranceDetailsTitle}>
                    Registration Number:
                  </div>
                  {activePolicy.vehicle?.number || "--"}
                </div>

                <div className={styles.renewButton}>
                  Renew Now <IoIosArrowForward />
                </div>
              </div>
            </div>
          )
        )}
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
