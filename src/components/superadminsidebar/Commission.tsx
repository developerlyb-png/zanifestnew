"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import cs from "@/styles/components/superadminsidebar/Claims.module.css";
import { FiDownload, FiSearch, FiTrendingUp, FiTrendingDown, FiPercent, FiAlertCircle } from "react-icons/fi";

interface CommissionRow {
  _id: string;
  policyNumber: string;
  insuredName?: string;
  agentName?: string;
  insurer?: string;
  lineOfBusiness?: string;
  product?: string;
  premium: number;
  date: string;
  payInPercent: number | null;
  payOutPercent: number | null;
  payInAmount: number;
  payOutAmount: number;
  matchedRule: string | null;
}

const fmtInr = (n?: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export default function Commission() {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [summary, setSummary] = useState({ totalPayIn: 0, totalPayOut: 0, matched: 0, unmatched: 0 });
  const [loading, setLoading] = useState(true);
  const [policySearch, setPolicySearch] = useState("");
  const [agentSearch, setAgentSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/policy-commissions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows || []);
        if (d.summary) setSummary(d.summary);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (policySearch && !r.policyNumber?.toLowerCase().includes(policySearch.toLowerCase())) return false;
        if (agentSearch && !(r.agentName || "").toLowerCase().includes(agentSearch.toLowerCase())) return false;
        return true;
      }),
    [rows, policySearch, agentSearch]
  );

  const exportCsv = () => {
    const header = [
      "Policy No", "Insured Name", "Agent Name", "Insurer", "Line Of Business", "Product",
      "Premium", "Date", "PayIn %", "PayIn Amount", "PayOut %", "PayOut Amount", "Matched Rule",
    ];
    const csvRows = filtered.map((r) => [
      r.policyNumber, r.insuredName || "", r.agentName || "", r.insurer || "", r.lineOfBusiness || "", r.product || "",
      r.premium, fmtDate(r.date), r.payInPercent ?? "", r.payInAmount, r.payOutPercent ?? "", r.payOutAmount, r.matchedRule || "Unmatched",
    ]);
    const csv = [header, ...csvRows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "commission_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Commission</h2>
        <div className={styles.headerActions}>
          <button className={styles.exportSolidBtn} onClick={exportCsv}>
            <FiDownload /> Export
          </button>
        </div>
      </div>

      <div className={cs.statRow}>
        <div className={cs.statCard}>
          <span className={cs.statLabel}>
            <span className={`${cs.statIcon} ${cs.toneBlue}`}><FiTrendingUp /></span> Total PayIn (from Insurers)
          </span>
          <span className={`${cs.statValue} ${cs.toneBlue}`}>{fmtInr(summary.totalPayIn)}</span>
        </div>
        <div className={cs.statCard}>
          <span className={cs.statLabel}>
            <span className={`${cs.statIcon} ${cs.toneGreen}`}><FiTrendingDown /></span> Total PayOut (to Agents)
          </span>
          <span className={`${cs.statValue} ${cs.toneGreen}`}>{fmtInr(summary.totalPayOut)}</span>
        </div>
        <div className={cs.statCard}>
          <span className={cs.statLabel}>
            <span className={`${cs.statIcon} ${cs.toneGray}`}><FiPercent /></span> Net Margin
          </span>
          <span className={`${cs.statValue} ${cs.toneGray}`}>{fmtInr(summary.totalPayIn - summary.totalPayOut)}</span>
        </div>
        <div className={cs.statCard}>
          <span className={cs.statLabel}>
            <span className={`${cs.statIcon} ${cs.toneRed}`}><FiAlertCircle /></span> Matched / Unmatched
          </span>
          <span className={`${cs.statValue} ${cs.toneRed}`}>
            {summary.matched} / {summary.unmatched}
          </span>
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchInput}>
          <FiSearch size={12} />
          <input placeholder="Search policy no" value={policySearch} onChange={(e) => setPolicySearch(e.target.value)} />
        </div>
        <div className={styles.searchInput}>
          <FiSearch size={12} />
          <input placeholder="Search agent name" value={agentSearch} onChange={(e) => setAgentSearch(e.target.value)} />
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 14px" }}>
        Amounts are computed live from your saved Pay In Pay Out rules and each policy&apos;s Premium
        Amount — editing a rule updates this report immediately. Unmatched policies had no saved rule
        that fit their criteria.
      </p>

      <div className={styles.tableWrapper}>
        <table className={styles.table} style={{ minWidth: 1400 }}>
          <thead>
            <tr>
              <th>Policy No</th>
              <th>Insured Name</th>
              <th>Agent Name</th>
              <th>Insurer</th>
              <th>Line Of Business</th>
              <th>Product</th>
              <th>Premium</th>
              <th>Date</th>
              <th>PayIn %</th>
              <th>PayIn Amount</th>
              <th>PayOut %</th>
              <th>PayOut Amount</th>
              <th>Matched Rule</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.emptyCell} colSpan={13}>
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={13}>
                  No policies found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r._id}>
                  <td>{r.policyNumber}</td>
                  <td>{r.insuredName || "—"}</td>
                  <td>{r.agentName || "—"}</td>
                  <td>{r.insurer || "—"}</td>
                  <td>{r.lineOfBusiness || "—"}</td>
                  <td>{r.product || "—"}</td>
                  <td>{fmtInr(r.premium)}</td>
                  <td>{fmtDate(r.date)}</td>
                  <td>{r.payInPercent !== null ? `${r.payInPercent}%` : "—"}</td>
                  <td>{fmtInr(r.payInAmount)}</td>
                  <td>{r.payOutPercent !== null ? `${r.payOutPercent}%` : "—"}</td>
                  <td>{fmtInr(r.payOutAmount)}</td>
                  <td>
                    {r.matchedRule ? (
                      <span className={styles.badgeTeal}>{r.matchedRule}</span>
                    ) : (
                      <span className={styles.badgeAmber}>UNMATCHED</span>
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
