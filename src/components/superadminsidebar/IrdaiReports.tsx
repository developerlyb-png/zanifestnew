"use client";

import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FiBarChart2, FiDownload, FiFileText, FiRefreshCw } from "react-icons/fi";
import * as XLSX from "xlsx";
import styles from "@/styles/components/superadminsidebar/IrdaiReports.module.css";

type GroupBy = "client" | "insurer" | "irdaiGroup" | "claim";
type InsuranceType = "all" | "GI" | "LI";

interface ClientInsurerRow {
  kind: "row" | "total";
  name: string;
  irdaiGroup?: string;
  policyCount: number;
  remuneration: number;
  premium: number;
}

interface IrdaiGroupRow {
  irdaiGroup: string;
  policyCount: number;
  remuneration: number;
  premium: number;
}

interface ClaimRow {
  name: string;
  insurer: string;
  irdaiGroup: string;
  claimNumber: string;
  status: string;
  claimedAmount: number;
  approvedAmount: number;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toInputDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDate = (d: Date) => d.toLocaleDateString("en-GB");
const inr = (n?: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function currentFinancialYear() {
  const today = new Date();
  let fy = today.getFullYear();
  if (today.getMonth() < 3) fy -= 1;
  return { from: new Date(fy, 3, 1), to: new Date(fy + 1, 2, 31) };
}

export default function IrdaiReports() {
  const defaultRange = currentFinancialYear();
  const [insuranceType, setInsuranceType] = useState<InsuranceType>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("client");
  const [fromDate, setFromDate] = useState(toInputDate(defaultRange.from));
  const [toDate, setToDate] = useState(toInputDate(defaultRange.to));

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [resultGroupBy, setResultGroupBy] = useState<GroupBy>("client");
  const [primaryLabel, setPrimaryLabel] = useState("Client Name");
  const [rows, setRows] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [range, setRange] = useState<{ from?: string; to?: string }>({});

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ insuranceType, groupBy, from: fromDate, to: toDate });
      const res = await fetch(`/api/admin/irdai-reports?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to generate report");
      setRows(data.rows || []);
      setTotals(data.totals || null);
      setResultGroupBy(data.groupBy || groupBy);
      setPrimaryLabel(data.primaryLabel || "Client Name");
      setRange({ from: data.from, to: data.to });
      setGenerated(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const rowCount = rows.length;

  const exportToExcel = () => {
    if (!generated || rows.length === 0) {
      toast.error("Generate a report first");
      return;
    }
    setExporting(true);
    try {
      let sheetRows: any[] = [];
      if (resultGroupBy === "claim") {
        sheetRows = (rows as ClaimRow[]).map((r) => ({
          Client: r.name,
          Insurer: r.insurer,
          "IRDAI Group": r.irdaiGroup,
          "Claim Number": r.claimNumber,
          Status: r.status,
          "Claimed Amount": r.claimedAmount,
          "Approved Amount": r.approvedAmount,
        }));
      } else if (resultGroupBy === "irdaiGroup") {
        sheetRows = (rows as IrdaiGroupRow[]).map((r) => ({
          "IRDAI Group": r.irdaiGroup,
          "No of Policy": r.policyCount,
          "Total Remuneration": r.remuneration,
          "Net Premium": r.premium,
        }));
      } else {
        sheetRows = (rows as ClientInsurerRow[]).map((r) => ({
          [primaryLabel]: r.kind === "total" ? `${r.name} - Total` : r.name,
          "IRDAI Group": r.kind === "total" ? "" : r.irdaiGroup,
          "No of Policy": r.policyCount,
          "Total Remuneration": r.remuneration,
          "Net Premium": r.premium,
        }));
      }

      const ws = XLSX.utils.json_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "IRDAI Report");
      XLSX.writeFile(wb, `irdai-report-${resultGroupBy}-${fromDate}-to-${toDate}.xlsx`);
    } catch {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const rangeLabel = useMemo(() => {
    if (!range.from || !range.to) return "";
    return `${fmtDate(new Date(range.from))} to ${fmtDate(new Date(range.to))}`;
  }, [range]);

  return (
    <div className={styles.wrap}>
      <div className={styles.pageHead}>
        <span className={styles.pageIcon}>
          <FiBarChart2 />
        </span>
        <div>
          <h1 className={styles.pageTitle}>IRDAI Reports</h1>
          <p className={styles.pageSub}>Generate and export IRDAI-compliant reports by client, insurer, IRDAI group, or claim.</p>
        </div>
      </div>

      <div className={styles.filterCard}>
        <h3 className={styles.filterCardTitle}>Report Filters</h3>
        <div className={styles.filterGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Insurance Type</label>
            <select className={styles.select} value={insuranceType} onChange={(e) => setInsuranceType(e.target.value as InsuranceType)}>
              <option value="all">All (GI + LI)</option>
              <option value="GI">General Insurance (GI)</option>
              <option value="LI">Life Insurance (LI)</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Group By</label>
            <select className={styles.select} value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
              <option value="client">Client</option>
              <option value="insurer">Insurer</option>
              <option value="irdaiGroup">IRDAI Group</option>
              <option value="claim">Claim</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Start Date</label>
            <input type="date" className={styles.input} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>End Date</label>
            <input type="date" className={styles.input} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        <div className={styles.actionRow}>
          <button type="button" className={styles.btnPrimary} onClick={generateReport} disabled={loading}>
            <FiRefreshCw /> {loading ? "Generating..." : "Generate Report"}
          </button>
          <button type="button" className={styles.btnGhost} onClick={exportToExcel} disabled={exporting || !generated}>
            <FiDownload /> Export to Excel
          </button>
        </div>
      </div>

      {generated && (
        <div className={styles.resultsCard}>
          <div className={styles.resultsHead}>
            <div className={styles.resultsTitle}>
              <span className={styles.resultsTitleIcon}>
                <FiFileText />
              </span>
              Report Results <span className={styles.resultsCount}>({rowCount} rows)</span>
            </div>
            {rangeLabel && <div className={styles.resultsRange}>{rangeLabel}</div>}
          </div>

          {rowCount === 0 ? (
            <div className={styles.emptyState}>No data found for the selected filters.</div>
          ) : resultGroupBy === "claim" ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Insurer</th>
                    <th>IRDAI Group</th>
                    <th>Claim Number</th>
                    <th>Status</th>
                    <th>Claimed Amount</th>
                    <th>Approved Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(rows as ClaimRow[]).map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td>{r.insurer}</td>
                      <td>
                        <span className={`${styles.groupText} ${r.irdaiGroup === "UNMAPPED" ? styles.groupUnmapped : ""}`}>
                          {r.irdaiGroup}
                        </span>
                      </td>
                      <td>{r.claimNumber}</td>
                      <td>
                        <span className={styles.statusPill}>{r.status}</span>
                      </td>
                      <td>{inr(r.claimedAmount)}</td>
                      <td>{inr(r.approvedAmount)}</td>
                    </tr>
                  ))}
                  {totals && (
                    <tr className={styles.grandTotalRow}>
                      <td colSpan={5}>Grand Total</td>
                      <td>{inr(totals.claimedAmount)}</td>
                      <td>{inr(totals.approvedAmount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : resultGroupBy === "irdaiGroup" ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>IRDAI Group</th>
                    <th>No of Policy</th>
                    <th>Total Remuneration</th>
                    <th>Net Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {(rows as IrdaiGroupRow[]).map((r, i) => (
                    <tr key={i}>
                      <td>
                        <span className={`${styles.groupText} ${r.irdaiGroup === "UNMAPPED" ? styles.groupUnmapped : ""}`}>
                          {r.irdaiGroup}
                        </span>
                      </td>
                      <td>{r.policyCount}</td>
                      <td>{inr(r.remuneration)}</td>
                      <td>{inr(r.premium)}</td>
                    </tr>
                  ))}
                  {totals && (
                    <tr className={styles.grandTotalRow}>
                      <td>Grand Total</td>
                      <td>{totals.policyCount}</td>
                      <td>{inr(totals.remuneration)}</td>
                      <td>{inr(totals.premium)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{primaryLabel}</th>
                    <th>IRDAI Group</th>
                    <th>No of Policy</th>
                    <th>Total Remuneration</th>
                    <th>Net Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {(rows as ClientInsurerRow[]).map((r, i) =>
                    r.kind === "total" ? (
                      <tr key={i} className={styles.totalRow}>
                        <td>{r.name} - Total</td>
                        <td></td>
                        <td>{r.policyCount}</td>
                        <td>{inr(r.remuneration)}</td>
                        <td>{inr(r.premium)}</td>
                      </tr>
                    ) : (
                      <tr key={i}>
                        <td>{r.name}</td>
                        <td>
                          <span className={`${styles.groupText} ${r.irdaiGroup === "UNMAPPED" ? styles.groupUnmapped : ""}`}>
                            {r.irdaiGroup}
                          </span>
                        </td>
                        <td>{r.policyCount}</td>
                        <td>{inr(r.remuneration)}</td>
                        <td>{inr(r.premium)}</td>
                      </tr>
                    )
                  )}
                  {totals && (
                    <tr className={styles.grandTotalRow}>
                      <td colSpan={2}>Grand Total</td>
                      <td>{totals.policyCount}</td>
                      <td>{inr(totals.remuneration)}</td>
                      <td>{inr(totals.premium)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
