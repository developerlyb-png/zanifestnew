"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/agentpage/MyCommission.module.css";
import { FiTrendingUp, FiFileText } from "react-icons/fi";

interface CommissionRow {
  _id: string;
  policyNumber: string;
  insuredName?: string;
  insurer?: string;
  lineOfBusiness?: string;
  product?: string;
  premium: number;
  date: string;
  payOutPercent: number | null;
  payOutAmount: number;
  matchedRule: string | null;
}

const fmtInr = (n?: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export default function MyCommission() {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [summary, setSummary] = useState({ totalPayOut: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agent/policy-commissions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows || []);
        if (d.summary) setSummary(d.summary);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.cont}>
      <h2 className={styles.heading}>My Commission</h2>
      <p className={styles.sub}>Your commission earned per policy, based on the Pay In Pay Out rules set by admin.</p>

      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <span className={styles.statIcon}><FiTrendingUp /></span> Total Commission Earned
          </span>
          <span className={styles.statValue}>{fmtInr(summary.totalPayOut)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <span className={styles.statIcon}><FiFileText /></span> Policies
          </span>
          <span className={styles.statValue}>{summary.count}</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Policy No</th>
              <th>Insured Name</th>
              <th>Insurer</th>
              <th>Line Of Business</th>
              <th>Product</th>
              <th>Premium</th>
              <th>Date</th>
              <th>Commission %</th>
              <th>Commission Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.emptyCell} colSpan={9}>
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={9}>
                  No policies found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id}>
                  <td>{r.policyNumber}</td>
                  <td>{r.insuredName || "—"}</td>
                  <td>{r.insurer || "—"}</td>
                  <td>{r.lineOfBusiness || "—"}</td>
                  <td>{r.product || "—"}</td>
                  <td>{fmtInr(r.premium)}</td>
                  <td>{fmtDate(r.date)}</td>
                  <td>{r.payOutPercent !== null ? `${r.payOutPercent}%` : "—"}</td>
                  <td>
                    {r.matchedRule ? (
                      fmtInr(r.payOutAmount)
                    ) : (
                      <span className={styles.pending}>Pending — no rule set yet</span>
                    )}
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
