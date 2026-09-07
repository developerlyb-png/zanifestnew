"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/pospmanagement.module.css";

interface PospRow {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  kycStatus: string;
  trainingCompleted: boolean;
  assessmentCompleted: boolean;
}

// "reviewed" is the status an admin's "accept" action actually sets on an
// agent (see reviewAgent.ts) — it reads to the admin as "Approved" the same
// way the approval email already calls it, so both statuses map to the same
// pill here rather than showing an internal-only status name.
const kycLabel = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "rejected") return "REJECTED";
  if (s === "pending") return "PENDING";
  return "APPROVED";
};

const kycTone = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "rejected") return styles.pillRed;
  if (s === "pending") return styles.pillYellow;
  return styles.pillGreen;
};

export default function PospManagement() {
  const [rows, setRows] = useState<PospRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [phoneSearch, setPhoneSearch] = useState("");
  const [infoSearch, setInfoSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [trainingFilter, setTrainingFilter] = useState("");
  const [assessmentFilter, setAssessmentFilter] = useState("");

  useEffect(() => {
    axios
      .get("/api/admin/posp-management")
      .then((res) => setRows(res.data?.agents || []))
      .catch((err) => console.error("Failed to load POSP partners", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (phoneSearch && !(r.phone || "").toLowerCase().includes(phoneSearch.toLowerCase())) {
        return false;
      }
      if (infoSearch) {
        const q = infoSearch.toLowerCase();
        if (!(r.name || "").toLowerCase().includes(q) && !(r.email || "").toLowerCase().includes(q)) {
          return false;
        }
      }
      if (kycFilter && (r.kycStatus || "pending").toLowerCase() !== kycFilter) return false;
      if (trainingFilter && String(r.trainingCompleted) !== trainingFilter) return false;
      if (assessmentFilter && String(r.assessmentCompleted) !== assessmentFilter) return false;
      return true;
    });
  }, [rows, phoneSearch, infoSearch, kycFilter, trainingFilter, assessmentFilter]);

  return (
    <div className={styles.container}>
      <p className={styles.summary}>
        Showing {filtered.length} of {rows.length} POSP Partners
      </p>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>
                <div className={styles.thLabel}>Phone</div>
                <input
                  className={styles.searchInput}
                  placeholder="Search phone"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                />
              </th>
              <th className={styles.th}>
                <div className={styles.thLabel}>POSP Info</div>
                <input
                  className={styles.searchInput}
                  placeholder="Search email / name"
                  value={infoSearch}
                  onChange={(e) => setInfoSearch(e.target.value)}
                />
              </th>
              <th className={styles.th}>
                <div className={styles.thLabel}>KYC Status</div>
                <select
                  className={styles.selectInput}
                  value={kycFilter}
                  onChange={(e) => setKycFilter(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </th>
              <th className={styles.th}>
                <div className={styles.thLabel}>Training Completed</div>
                <select
                  className={styles.selectInput}
                  value={trainingFilter}
                  onChange={(e) => setTrainingFilter(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </th>
              <th className={styles.th}>
                <div className={styles.thLabel}>Assessment Completed</div>
                <select
                  className={styles.selectInput}
                  value={assessmentFilter}
                  onChange={(e) => setAssessmentFilter(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.emptyCell} colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={5}>
                  No POSP partners found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r._id} className={styles.row}>
                  <td className={styles.td}>
                    <span className={styles.phone}>{r.phone || "—"}</span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.infoLine}>
                      <b>Name:</b> {r.name || "—"}
                    </div>
                    <div className={styles.infoLine}>
                      <b>Email:</b> {r.email || "—"}
                    </div>
                    <div className={styles.infoLine}>
                      <b>Address:</b> {r.address || "—"}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.pill} ${kycTone(r.kycStatus)}`}>
                      {kycLabel(r.kycStatus)}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.pill} ${r.trainingCompleted ? styles.pillGreen : styles.pillGray}`}>
                      {r.trainingCompleted ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.pill} ${r.assessmentCompleted ? styles.pillGreen : styles.pillGray}`}>
                      {r.assessmentCompleted ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
