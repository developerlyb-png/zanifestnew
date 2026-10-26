"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import cs from "@/styles/components/superadminsidebar/Claims.module.css";
import cc from "@/styles/components/superadminsidebar/Commission.module.css";
import { FiCalendar, FiDownload, FiSearch, FiTrendingUp, FiTrendingDown, FiPercent, FiAlertCircle } from "react-icons/fi";

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

type Preset = "today" | "thisMonth" | "lastMonth" | "thisYear" | "lastYear" | "custom";

const fmtInr = (n?: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const pad = (n: number) => String(n).padStart(2, "0");
const fmtRangeDate = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

function financialYearRange() {
  const today = new Date();
  let fy = today.getFullYear();
  if (today.getMonth() < 3) fy -= 1;
  return { from: new Date(fy, 3, 1), to: new Date(fy + 1, 2, 31, 23, 59, 59) };
}

function presetRange(preset: Preset): { from: Date; to: Date } {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case "today":
      return { from: startOfToday, to: endOfToday };
    case "thisMonth":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfToday };
    case "lastMonth":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      };
    case "lastYear": {
      const { from } = financialYearRange();
      return { from: new Date(from.getFullYear() - 1, 3, 1), to: new Date(from.getFullYear(), 2, 31, 23, 59, 59) };
    }
    default:
      return financialYearRange();
  }
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "thisYear", label: "This Year" },
  { key: "lastYear", label: "Last Year" },
  { key: "custom", label: "Custom Range" },
];

export default function Commission() {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [summary, setSummary] = useState({ totalPayIn: 0, totalPayOut: 0, matched: 0, unmatched: 0 });
  const [loading, setLoading] = useState(true);
  const [policySearch, setPolicySearch] = useState("");
  const [agentSearch, setAgentSearch] = useState("");

  const [preset, setPreset] = useState<Preset>("thisYear");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [payInMin, setPayInMin] = useState("");
  const [payInMax, setPayInMax] = useState("");
  const [payOutMin, setPayOutMin] = useState("");
  const [payOutMax, setPayOutMax] = useState("");

  const range = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { from: new Date(customFrom), to: new Date(`${customTo}T23:59:59`) };
    }
    return presetRange(preset);
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() });
    fetch(`/api/admin/policy-commissions?${params.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows || []);
        if (d.summary) setSummary(d.summary);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [range]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (policySearch && !r.policyNumber?.toLowerCase().includes(policySearch.toLowerCase())) return false;
        if (agentSearch && !(r.agentName || "").toLowerCase().includes(agentSearch.toLowerCase())) return false;
        if (payInMin && r.payInAmount < Number(payInMin)) return false;
        if (payInMax && r.payInAmount > Number(payInMax)) return false;
        if (payOutMin && r.payOutAmount < Number(payOutMin)) return false;
        if (payOutMax && r.payOutAmount > Number(payOutMax)) return false;
        return true;
      }),
    [rows, policySearch, agentSearch, payInMin, payInMax, payOutMin, payOutMax]
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
    a.download = `commission_report_${fmtRangeDate(range.from)}_to_${fmtRangeDate(range.to)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${styles.cont} ${cc.commissionPage}`}>
      <div className={styles.headerRow}>
        <h2 className={`${styles.heading} ${cc.commissionHeading}`}>Commission</h2>
        <div className={styles.headerActions}>
          <button className={`${styles.exportSolidBtn} ${cc.exportButton}`} onClick={exportCsv}>
            <FiDownload /> Export
          </button>
        </div>
      </div>

      <div className={`${cs.statRow} ${cc.commissionStats}`}>
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
        <div className={styles.presets}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              className={`${styles.presetBtn} ${preset === p.key ? styles.presetBtnActive : ""}`}
              onClick={() => setPreset(p.key)}
            >
              {p.key === "custom" && <FiCalendar style={{ marginRight: 6 }} />}
              {p.label}
            </button>
          ))}
          {preset === "custom" && (
            <>
              <input type="date" className={styles.dateInput} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <input type="date" className={styles.dateInput} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </>
          )}
        </div>
      </div>

      <div className={`${styles.filterRow} ${cc.commissionFilters}`}>
        <div className={`${styles.searchInput} ${cc.commissionSearch}`}>
          <FiSearch size={12} />
          <input placeholder="Search policy no" value={policySearch} onChange={(e) => setPolicySearch(e.target.value)} />
        </div>
        <div className={`${styles.searchInput} ${cc.commissionSearch}`}>
          <FiSearch size={12} />
          <input placeholder="Search agent name" value={agentSearch} onChange={(e) => setAgentSearch(e.target.value)} />
        </div>
        <input
          type="number"
          className={styles.dateInput}
          placeholder="Min PayIn (Inward)"
          value={payInMin}
          onChange={(e) => setPayInMin(e.target.value)}
        />
        <input
          type="number"
          className={styles.dateInput}
          placeholder="Max PayIn (Inward)"
          value={payInMax}
          onChange={(e) => setPayInMax(e.target.value)}
        />
        <input
          type="number"
          className={styles.dateInput}
          placeholder="Min PayOut (Outward)"
          value={payOutMin}
          onChange={(e) => setPayOutMin(e.target.value)}
        />
        <input
          type="number"
          className={styles.dateInput}
          placeholder="Max PayOut (Outward)"
          value={payOutMax}
          onChange={(e) => setPayOutMax(e.target.value)}
        />
      </div>

      <p className={cc.commissionNote}>
        Amounts are computed live from your saved Pay In Pay Out rules and each policy&apos;s Premium
        Amount — editing a rule updates this report immediately. Unmatched policies had no saved rule
        that fit their criteria.
      </p>

      <div className={`${styles.tableWrapper} ${cc.commissionTableWrapper}`}>
        <table className={`${styles.table} ${cc.commissionTable}`} style={{ minWidth: 1400 }}>
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
