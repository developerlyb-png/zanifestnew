import React, { useEffect, useState } from "react";

import styles from "@/styles/components/dashboard/DashboardPolicies.module.css";
import Image from "next/image";
import { LuUser } from "react-icons/lu";

import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

interface IssuedPolicy {
  _id: string;
  policyNumber?: string;
  policyType?: string;
  insurer?: string;
  status?: string;
  premium?: number;
  startDate?: string;
  endDate?: string;
  vehicle?: { number?: string; make?: string; model?: string };
  customer?: { fullName?: string; email?: string; mobile?: string };
}

const formatDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "--";

const formatInr = (n?: number) =>
  n == null ? "--" : "₹" + Math.round(n).toLocaleString("en-IN");

function DashboardPolicies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<IssuedPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/my-policies", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setPolicies(data.policies || []))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.cont}>
      <div className={styles.greeting}>
        Hi, {user?.name || "User"} <LuUser />
      </div>
      <div className={styles.inner}>
        {loading ? (
          <p className={styles.empty}>Loading your policies...</p>
        ) : policies.length === 0 ? (
          <p className={styles.empty}>No policies yet — buy one!</p>
        ) : (
          policies.map((policy) => {
            const isExpanded = expandedId === policy._id;
            return (
              <div className={styles.card} key={policy._id}>
                <div className={styles.item}>
                  <div className={styles.imageCont}>
                    <Image
                      src={require("@/assets/dashboard/details/1.png")}
                      alt="car"
                      className={styles.image}
                    />
                  </div>
                  <div className={styles.middle}>
                    <p className={styles.top}>
                      {policy.policyType || "Car Insurance"}
                    </p>
                    <div>
                      <p className={styles.make}>
                        {[policy.vehicle?.make, policy.vehicle?.model]
                          .filter(Boolean)
                          .join(" ") || "--"}
                      </p>
                      <p className={styles.number}>
                        {policy.vehicle?.number || "--"}
                      </p>
                    </div>
                  </div>
                  <div className={styles.right}>
                    <div className={styles.expire}>
                      <p className={styles.red}>Expire </p>
                      <p> on {formatDate(policy.endDate)}</p>
                    </div>
                    <button
                      className={styles.more}
                      onClick={() =>
                        setExpandedId(isExpanded ? null : policy._id)
                      }
                    >
                      {isExpanded ? "See Less" : "See More"}{" "}
                      {isExpanded ? (
                        <FaChevronDown size={10} />
                      ) : (
                        <FaChevronRight size={10} />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.details}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Policy No.</span>
                      <span className={styles.detailValue}>
                        {policy.policyNumber || "--"}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Insurer</span>
                      <span className={styles.detailValue}>
                        {policy.insurer || "--"}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Premium</span>
                      <span className={styles.detailValue}>
                        {formatInr(policy.premium)}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Status</span>
                      <span className={styles.statusBadge}>
                        {policy.status || "--"}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Start Date</span>
                      <span className={styles.detailValue}>
                        {formatDate(policy.startDate)}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Policy Holder</span>
                      <span className={styles.detailValue}>
                        {policy.customer?.fullName || "--"}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Email</span>
                      <span className={styles.detailValue}>
                        {policy.customer?.email || "--"}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Mobile</span>
                      <span className={styles.detailValue}>
                        {policy.customer?.mobile || "--"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default DashboardPolicies;
