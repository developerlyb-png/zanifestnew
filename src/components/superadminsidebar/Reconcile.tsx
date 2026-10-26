"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiColumns, FiDownload, FiPlus, FiSearch } from "react-icons/fi";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import rc from "@/styles/components/superadminsidebar/Reconcile.module.css";
import NewReconciliation from "./NewReconciliation";
import ReconciliationDetailView from "./ReconciliationDetailView";

interface BatchRow {
  _id: string;
  batchNo: number;
  insurerName: string;
  reconciledBy?: string;
  createdAt: string;
  matchedCount: number;
  mismatchedCount: number;
  missingInMisCount: number;
  missingInCsCount: number;
}

type Preset = "today" | "thisMonth" | "lastMonth" | "thisYear" | "lastYear" | "custom";

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const fmtRowDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, ${d
    .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    .toLowerCase()}`;
};

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

type ColumnKey = "batchId" | "insurer" | "reconciledBy" | "date" | "matched" | "mismatched" | "missingMis" | "missingCs";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "batchId", label: "Batch ID" },
  { key: "insurer", label: "Insurance Company" },
  { key: "reconciledBy", label: "Reconciled By" },
  { key: "date", label: "Date" },
  { key: "matched", label: "Matched" },
  { key: "mismatched", label: "Mismatched" },
  { key: "missingMis", label: "Missing in MIS" },
  { key: "missingCs", label: "Missing in CS" },
];

const DEFAULT_VISIBLE = COLUMNS.reduce((acc, c) => {
  acc[c.key] = true;
  return acc;
}, {} as Record<ColumnKey, boolean>);

export default function Reconcile() {
  const [view, setView] = useState<"list" | "new" | "detail">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewBatch, setPreviewBatch] = useState<any>(null);

  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [preset, setPreset] = useState<Preset>("thisYear");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [batchSearch, setBatchSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [reconciledByFilter, setReconciledByFilter] = useState("");

  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const range = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { from: new Date(customFrom), to: new Date(`${customTo}T23:59:59`) };
    }
    return presetRange(preset);
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    if (view !== "list") return;
    setLoading(true);
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() });
    fetch(`/api/admin/reconcile-batches?${params.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setBatches(d.batches || []))
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, [range, refreshKey, view]);

  const reconcilers = useMemo(() => Array.from(new Set(batches.map((b) => b.reconciledBy).filter(Boolean))) as string[], [batches]);

  const filtered = useMemo(
    () =>
      batches.filter((b) => {
        if (batchSearch && !String(b.batchNo).includes(batchSearch.trim())) return false;
        if (companySearch && !b.insurerName?.toLowerCase().includes(companySearch.toLowerCase())) return false;
        if (reconciledByFilter && b.reconciledBy !== reconciledByFilter) return false;
        return true;
      }),
    [batches, batchSearch, companySearch, reconciledByFilter]
  );

  const visible = filtered.slice(0, rowsPerPage);
  const visibleCount = COLUMNS.filter((c) => visibleColumns[c.key]).length;

  const exportCsv = () => {
    const cols = COLUMNS.filter((c) => visibleColumns[c.key]);
    const rows = filtered.map((b) =>
      cols.map((col) => {
        switch (col.key) {
          case "batchId":
            return b.batchNo;
          case "insurer":
            return b.insurerName;
          case "reconciledBy":
            return b.reconciledBy || "";
          case "date":
            return fmtRowDate(b.createdAt);
          case "matched":
            return b.matchedCount;
          case "mismatched":
            return b.mismatchedCount;
          case "missingMis":
            return b.missingInMisCount;
          case "missingCs":
            return b.missingInCsCount;
          default:
            return "";
        }
      })
    );
    const csv = [cols.map((c) => c.label), ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `reconciliation_history_${fmtDate(range.from).replace(/\//g, "-")}_to_${fmtDate(range.to).replace(/\//g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (view === "new") {
    return (
      <div className={styles.cont}>
        <NewReconciliation
          onCancel={() => setView("list")}
          onCreated={(id) => {
            setActiveId(id);
            setPreviewBatch(null);
            setView("detail");
            setRefreshKey((k) => k + 1);
          }}
          onPreview={(batch) => {
            setPreviewBatch(batch);
            setActiveId(null);
            setView("detail");
          }}
        />
      </div>
    );
  }

  if (view === "detail" && (activeId || previewBatch)) {
    return (
      <div className={styles.cont}>
        <ReconciliationDetailView
          batchId={activeId || undefined}
          previewBatch={previewBatch || undefined}
          onBack={() => {
            setView("list");
            setPreviewBatch(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Reconcile Dashboard</h2>
        <div className={styles.headerActions}>
          <button className={styles.primaryBtn} onClick={() => setView("new")}>
            <FiPlus /> New Reconcile
          </button>
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
        <div className={styles.filterRowRight}>
          <button className={styles.exportSolidBtn} onClick={exportCsv}>
            <FiDownload /> Export
          </button>
          <div className={styles.columnPickerWrapper}>
            <button className={styles.outlineBtn} onClick={() => setShowColumnPicker((v) => !v)}>
              <FiColumns /> Filter Columns
            </button>
            {showColumnPicker && (
              <div className={styles.columnPickerDropdown}>
                {COLUMNS.map((c) => (
                  <label key={c.key} className={styles.columnPickerItem}>
                    <input
                      type="checkbox"
                      checked={visibleColumns[c.key]}
                      onChange={() => setVisibleColumns((p) => ({ ...p, [c.key]: !p[c.key] }))}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 700, margin: "6px 0 2px" }}>Reconciliation History</h3>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>View all previous reconciliation runs and their results</p>

      <div className={styles.tableWrapper}>
        <table className={styles.table} style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              {COLUMNS.filter((c) => visibleColumns[c.key]).map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
            <tr className={styles.filterHeaderRow}>
              {visibleColumns.batchId && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search Batch ID..." value={batchSearch} onChange={(e) => setBatchSearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.insurer && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search company..." value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.reconciledBy && (
                <td>
                  <select className={styles.selectInput} value={reconciledByFilter} onChange={(e) => setReconciledByFilter(e.target.value)}>
                    <option value="">All</option>
                    {reconcilers.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
              )}
              {visibleColumns.date && <td className={styles.dashCell}>—</td>}
              {visibleColumns.matched && <td className={styles.dashCell}>—</td>}
              {visibleColumns.mismatched && <td className={styles.dashCell}>—</td>}
              {visibleColumns.missingMis && <td className={styles.dashCell}>—</td>}
              {visibleColumns.missingCs && <td className={styles.dashCell}>—</td>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleCount} className={styles.emptyCell}>
                  Loading reconciliation history...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={visibleCount} className={styles.emptyCell}>
                  No reconciliation runs found.
                </td>
              </tr>
            ) : (
              visible.map((b) => (
                <tr key={b._id}>
                  {visibleColumns.batchId && <td>{b.batchNo}</td>}
                  {visibleColumns.insurer && (
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveId(b._id);
                          setPreviewBatch(null);
                          setView("detail");
                        }}
                        style={{ color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                      >
                        {b.insurerName}
                      </button>
                    </td>
                  )}
                  {visibleColumns.reconciledBy && <td>{b.reconciledBy || "—"}</td>}
                  {visibleColumns.date && <td>{fmtRowDate(b.createdAt)}</td>}
                  {visibleColumns.matched && (
                    <td>
                      <span className={`${rc.pill} ${rc.pillMatched}`}>{b.matchedCount}</span>
                    </td>
                  )}
                  {visibleColumns.mismatched && (
                    <td>
                      <span className={`${rc.pill} ${rc.pillMismatched}`}>{b.mismatchedCount}</span>
                    </td>
                  )}
                  {visibleColumns.missingMis && (
                    <td>
                      <span className={`${rc.pill} ${rc.pillMissingMis}`}>{b.missingInMisCount}</span>
                    </td>
                  )}
                  {visibleColumns.missingCs && (
                    <td>
                      <span className={`${rc.pill} ${rc.pillMissingCs}`}>{b.missingInCsCount}</span>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className={styles.tableFooter}>
          <span>Rows per page:</span>
          <select className={styles.rowsPerPageSelect} value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
