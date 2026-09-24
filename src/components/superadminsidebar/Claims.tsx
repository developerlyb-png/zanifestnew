"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import cs from "@/styles/components/superadminsidebar/Claims.module.css";
import { FiDownload, FiUpload, FiSearch, FiColumns, FiCalendar, FiBox, FiPackage, FiXCircle, FiArchive } from "react-icons/fi";
import CreateClaim from "./CreateClaim";
import ClaimDetailView from "./ClaimDetailView";
import ClaimBulkUploadModal from "./ClaimBulkUploadModal";
import { CLAIM_STATUSES, REJECTED_STATUSES, CLOSED_STATUSES, statusColor } from "@/constants/claims";
import { CLAIM_TYPES } from "@/constants/claims";

interface ClaimRow {
  _id: string;
  claimNumber: string;
  claimType: string;
  status: string;
  policyNumber: string;
  insuredName?: string;
  dateOfLoss?: string;
  claimedAmount?: number;
  approvedAmount?: number;
  createdBy?: string;
  updatedAt?: string;
}

type Preset = "today" | "thisMonth" | "lastMonth" | "thisYear" | "lastYear" | "custom";

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Indian financial year: Apr 1 - Mar 31
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
      return {
        from: new Date(from.getFullYear() - 1, 3, 1),
        to: new Date(from.getFullYear(), 2, 31, 23, 59, 59),
      };
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

type ColumnKey =
  | "claimNo"
  | "claimType"
  | "status"
  | "policyNo"
  | "insured"
  | "dateOfLoss"
  | "claimedAmount"
  | "approvedAmount"
  | "createdBy"
  | "lastUpdated";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "claimNo", label: "Claim No." },
  { key: "claimType", label: "Claim Type" },
  { key: "status", label: "Status" },
  { key: "policyNo", label: "Policy No" },
  { key: "insured", label: "Insured Name" },
  { key: "dateOfLoss", label: "Date of Loss" },
  { key: "claimedAmount", label: "Claimed Amount" },
  { key: "approvedAmount", label: "Approved Amount" },
  { key: "createdBy", label: "Created By" },
  { key: "lastUpdated", label: "Last Updated" },
];

const ALL_VISIBLE = COLUMNS.reduce((acc, c) => {
  acc[c.key] = true;
  return acc;
}, {} as Record<ColumnKey, boolean>);

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtInr = (n?: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function Claims() {
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [preset, setPreset] = useState<Preset>("thisYear");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [claimNoSearch, setClaimNoSearch] = useState("");
  const [insuredSearch, setInsuredSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");

  const [visibleColumns, setVisibleColumns] = useState(ALL_VISIBLE);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowColumnPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const range = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { from: new Date(customFrom), to: new Date(`${customTo}T23:59:59`) };
    }
    return presetRange(preset);
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() });
    fetch(`/api/admin/claims?${params.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setClaims(d.claims || []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, [range, refreshKey]);

  const stats = useMemo(() => {
    const rejected = claims.filter((c) => REJECTED_STATUSES.includes(c.status)).length;
    const closed = claims.filter((c) => CLOSED_STATUSES.includes(c.status)).length;
    return { total: claims.length, rejected, closed, open: claims.length - rejected - closed };
  }, [claims]);

  const creators = useMemo(
    () => Array.from(new Set(claims.map((c) => c.createdBy).filter(Boolean))) as string[],
    [claims]
  );

  const filtered = useMemo(
    () =>
      claims.filter((c) => {
        if (claimNoSearch && !c.claimNumber.toLowerCase().includes(claimNoSearch.toLowerCase())) return false;
        if (insuredSearch && !(c.insuredName || "").toLowerCase().includes(insuredSearch.toLowerCase())) return false;
        if (typeFilter && c.claimType !== typeFilter) return false;
        if (statusFilter && c.status !== statusFilter) return false;
        if (createdByFilter && c.createdBy !== createdByFilter) return false;
        return true;
      }),
    [claims, claimNoSearch, insuredSearch, typeFilter, statusFilter, createdByFilter]
  );

  const exportCsv = () => {
    const visible = COLUMNS.filter((c) => visibleColumns[c.key]);
    const rows = filtered.map((c) => {
      const cell: Record<ColumnKey, string | number> = {
        claimNo: c.claimNumber,
        claimType: c.claimType,
        status: c.status,
        policyNo: c.policyNumber,
        insured: c.insuredName || "",
        dateOfLoss: fmtDate(c.dateOfLoss),
        claimedAmount: c.claimedAmount || 0,
        approvedAmount: c.approvedAmount || 0,
        createdBy: c.createdBy || "",
        lastUpdated: fmtDate(c.updatedAt),
      };
      return visible.map((col) => cell[col.key]);
    });
    const csv = [visible.map((c) => c.label), ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `claims_${toIso(range.from)}_to_${toIso(range.to)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleCount = COLUMNS.filter((c) => visibleColumns[c.key]).length;

  if (selectedId) {
    return (
      <div className={styles.cont}>
        <ClaimDetailView
          claimId={selectedId}
          onBack={() => {
            setSelectedId(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className={styles.cont}>
        <CreateClaim
          onCancel={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Claims Dashboard</h2>
        <div className={styles.filterRowRight}>
          <button className={styles.outlineBtn} onClick={() => setShowBulk(true)}>
            <FiUpload /> Bulk Upload
          </button>
          <button className={styles.exportSolidBtn} onClick={exportCsv}>
            <FiDownload /> Export
          </button>
          <div className={styles.columnPickerWrapper} ref={pickerRef}>
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
          <button className={styles.primaryBtn} onClick={() => setShowCreate(true)}>
            + Add New Claim
          </button>
        </div>
      </div>

      {showBulk && (
        <ClaimBulkUploadModal
          onClose={() => setShowBulk(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      <div className={cs.statRow}>
        <div className={cs.statCard}>
          <span className={cs.statLabel}>
            <span className={`${cs.statIcon} ${cs.toneBlue}`}><FiBox /></span> Total Claims
          </span>
          <span className={`${cs.statValue} ${cs.toneBlue}`}>{stats.total}</span>
        </div>
        <div className={cs.statCard}>
          <span className={cs.statLabel}>
            <span className={`${cs.statIcon} ${cs.toneGreen}`}><FiPackage /></span> Open Claims
          </span>
          <span className={`${cs.statValue} ${cs.toneGreen}`}>{stats.open}</span>
        </div>
        <div className={cs.statCard}>
          <span className={cs.statLabel}>
            <span className={`${cs.statIcon} ${cs.toneRed}`}><FiXCircle /></span> Rejected Claims
          </span>
          <span className={`${cs.statValue} ${cs.toneRed}`}>{stats.rejected}</span>
        </div>
        <div className={cs.statCard}>
          <span className={cs.statLabel}>
            <span className={`${cs.statIcon} ${cs.toneGray}`}><FiArchive /></span> Closed Claims
          </span>
          <span className={`${cs.statValue} ${cs.toneGray}`}>{stats.closed}</span>
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

      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
        Showing data from <b style={{ color: "#111827" }}>{fmtDate(range.from.toISOString())}</b> to{" "}
        <b style={{ color: "#111827" }}>{fmtDate(range.to.toISOString())}</b>
      </p>

      <div className={styles.tableWrapper}>
        <table className={styles.table} style={{ minWidth: 1200 }}>
          <thead>
            <tr>
              {COLUMNS.filter((c) => visibleColumns[c.key]).map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
            <tr className={styles.filterHeaderRow}>
              {visibleColumns.claimNo && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search claim no" value={claimNoSearch} onChange={(e) => setClaimNoSearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.claimType && (
                <td>
                  <select className={styles.selectInput} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">All</option>
                    {CLAIM_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
              )}
              {visibleColumns.status && (
                <td>
                  <select className={styles.selectInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All</option>
                    {CLAIM_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              )}
              {visibleColumns.policyNo && <td className={styles.dashCell}>—</td>}
              {visibleColumns.insured && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search insured" value={insuredSearch} onChange={(e) => setInsuredSearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.dateOfLoss && <td className={styles.dashCell}>—</td>}
              {visibleColumns.claimedAmount && <td className={styles.dashCell}>—</td>}
              {visibleColumns.approvedAmount && <td className={styles.dashCell}>—</td>}
              {visibleColumns.createdBy && (
                <td>
                  <select className={styles.selectInput} value={createdByFilter} onChange={(e) => setCreatedByFilter(e.target.value)}>
                    <option value="">All</option>
                    {creators.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </td>
              )}
              {visibleColumns.lastUpdated && <td className={styles.dashCell}>—</td>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleCount} className={styles.emptyCell}>Loading claims...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={visibleCount} className={styles.emptyCell}>No claims found.</td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c._id}>
                  {visibleColumns.claimNo && (
                    <td>
                      <button className={cs.claimLink} onClick={() => setSelectedId(c._id)}>
                        {c.claimNumber}
                      </button>
                    </td>
                  )}
                  {visibleColumns.claimType && <td>{c.claimType}</td>}
                  {visibleColumns.status && (
                    <td>
                      <span
                        className={cs.statusPill}
                        style={{ background: statusColor(c.status).bg, color: statusColor(c.status).fg }}
                      >
                        {c.status}
                      </span>
                    </td>
                  )}
                  {visibleColumns.policyNo && <td>{c.policyNumber}</td>}
                  {visibleColumns.insured && <td>{c.insuredName || "—"}</td>}
                  {visibleColumns.dateOfLoss && <td>{fmtDate(c.dateOfLoss)}</td>}
                  {visibleColumns.claimedAmount && <td>{fmtInr(c.claimedAmount)}</td>}
                  {visibleColumns.approvedAmount && <td>{fmtInr(c.approvedAmount)}</td>}
                  {visibleColumns.createdBy && <td>{c.createdBy || "—"}</td>}
                  {visibleColumns.lastUpdated && <td>{fmtDate(c.updatedAt)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
