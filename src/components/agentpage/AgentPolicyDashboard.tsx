"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/components/agentpage/AgentPolicyDashboard.module.css";
import {
  FiDownload,
  FiSearch,
  FiPlus,
  FiUploadCloud,
  FiCopy,
  FiColumns,
} from "react-icons/fi";
import AddPolicyForm from "@/components/superadminsidebar/AddPolicyForm";
import BulkUploadModal from "@/components/superadminsidebar/BulkUploadModal";

// Agent-scoped port of superadminsidebar/PolicyDashboard.tsx — same columns,
// filters, presets, column picker and CSV export, backed by the
// agentToken-only /api/agent/policies[-bulk] endpoints instead of the admin
// ones, and without the admin-only click-through detail view.

interface Policy {
  _id: string;
  policyNumber?: string;
  subInsured?: string;
  endorsementNo?: string;
  policyType?: string;
  transactionType?: string;
  insurer?: string;
  pospPartner?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  premium?: number;
  grossPremium?: number;
  commissionAmount?: number | null;
  payoutAmount?: number | null;
  payoutStatus?: string;
  policyDocumentStatus?: string;
  policyRemark?: string;
  reconcile?: string;
  createdAt?: string;
  customer?: { fullName?: string };
}

type Preset = "today" | "thisMonth" | "lastMonth" | "thisYear" | "lastYear" | "custom";
type DateBasis = "startDate" | "createdAt";

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Indian financial year: Apr 1 - Mar 31
function financialYearRange() {
  const today = new Date();
  let fyStartYear = today.getFullYear();
  if (today.getMonth() < 3) fyStartYear -= 1; // Jan-Mar belongs to previous FY
  const from = new Date(fyStartYear, 3, 1);
  const to = new Date(fyStartYear + 1, 2, 31);
  return { from, to };
}

function presetRange(preset: Preset): { from: Date; to: Date } {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

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
    case "thisYear":
      return financialYearRange();
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

const formatDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "--";

const formatDisplayDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : "--";

const formatInr = (n?: number | null) =>
  n == null ? "-" : "₹" + Math.round(n).toLocaleString("en-IN");

const formatInrAbbrev = (n?: number | null) => {
  if (!n) return "₹0";
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "thisYear", label: "This Year" },
  { key: "lastYear", label: "Last Year" },
  { key: "custom", label: "Custom Range" },
];

const bucketFor = (p: Policy) => {
  const t = (p.policyType || "").toLowerCase();
  if (t.includes("car") || t.includes("bike") || t.includes("vehicle") || t.includes("motor"))
    return "Motor";
  if (t.includes("health")) return "Health";
  if (t.includes("life")) return "Life";
  return "Other";
};

type SummaryTone = "blue" | "teal" | "green" | "purple";

const TONE_CLASS: Record<SummaryTone, string> = {
  blue: styles.toneBlue,
  teal: styles.toneTeal,
  green: styles.toneGreen,
  purple: styles.tonePurple,
};

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  tone: SummaryTone;
  breakdown: { label: string; value: React.ReactNode }[];
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, title, value, tone, breakdown }) => (
  <div className={`${styles.card} ${TONE_CLASS[tone]}`}>
    <p className={styles.cardTitle}>
      <span className={styles.iconBadge}>{icon}</span> {title}
    </p>
    <div className={styles.cardBody}>
      <span className={styles.cardValue}>{value}</span>
      <div className={styles.cardBreakdown}>
        {breakdown.map((b) => (
          <div key={b.label} className={styles.breakdownItem}>
            <span className={styles.breakdownLabel}>{b.label}</span>
            <span className={styles.breakdownValue}>{b.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

interface ColumnFilters {
  insuredName: string;
  productName: string;
  transactionType: string;
  insurer: string;
  pospPartner: string;
  policyNoSearch: string;
  endorsementSearch: string;
}

const EMPTY_FILTERS: ColumnFilters = {
  insuredName: "",
  productName: "",
  transactionType: "",
  insurer: "",
  pospPartner: "",
  policyNoSearch: "",
  endorsementSearch: "",
};

type ColumnKey =
  | "insuredName"
  | "subInsured"
  | "policyNo"
  | "endorsementNo"
  | "productName"
  | "transactionType"
  | "insurer"
  | "pospPartner"
  | "status"
  | "startDate"
  | "endDate"
  | "policyMonth"
  | "premiumAmount"
  | "grossPremium"
  | "commissionAmount"
  | "payoutAmount"
  | "payoutStatus"
  | "policyDocStatus"
  | "policyRemark"
  | "reconcile";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "insuredName", label: "Insured Name" },
  { key: "subInsured", label: "Sub-Insured" },
  { key: "policyNo", label: "Policy No." },
  { key: "endorsementNo", label: "Endorsement No." },
  { key: "productName", label: "Product Name" },
  { key: "transactionType", label: "Business Type" },
  { key: "insurer", label: "Insurer" },
  { key: "pospPartner", label: "Agent Name" },
  { key: "status", label: "Status" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "policyMonth", label: "Policy Month" },
  { key: "premiumAmount", label: "Premium Amount" },
  { key: "grossPremium", label: "Gross Premium" },
  { key: "commissionAmount", label: "Commission Amount" },
  { key: "payoutAmount", label: "Payout Amount" },
  { key: "payoutStatus", label: "Payout Status" },
  { key: "policyDocStatus", label: "Policy Document Status" },
  { key: "policyRemark", label: "Policy Remark" },
  { key: "reconcile", label: "Reconcile" },
];

const FILLER_KEYS: ColumnKey[] = [
  "status",
  "startDate",
  "endDate",
  "policyMonth",
  "premiumAmount",
  "grossPremium",
  "commissionAmount",
  "payoutAmount",
  "payoutStatus",
  "policyDocStatus",
  "policyRemark",
  "reconcile",
];

const ALL_COLUMNS_VISIBLE: Record<ColumnKey, boolean> = COLUMNS.reduce((acc, c) => {
  acc[c.key] = true;
  return acc;
}, {} as Record<ColumnKey, boolean>);

function AgentPolicyDashboard() {
  const [preset, setPreset] = useState<Preset>("thisYear");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [dateBasis, setDateBasis] = useState<DateBasis>("startDate");
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ColumnFilters>(EMPTY_FILTERS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(ALL_COLUMNS_VISIBLE);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);
  const [fixedAgent, setFixedAgent] = useState<{ id: string; name: string } | null>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const syncingScrollRef = useRef<"top" | "table" | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setShowColumnPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (syncingScrollRef.current === "table") return;
    syncingScrollRef.current = "top";
    if (tableWrapperRef.current) tableWrapperRef.current.scrollLeft = e.currentTarget.scrollLeft;
    syncingScrollRef.current = null;
  };

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (syncingScrollRef.current === "top") return;
    syncingScrollRef.current = "table";
    if (topScrollRef.current) topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    syncingScrollRef.current = null;
  };

  useEffect(() => {
    fetch("/api/agent/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const a = data?.agent;
        if (a) {
          const name = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || a.email;
          setFixedAgent({ id: a._id, name });
        }
      })
      .catch(() => setFixedAgent(null));
  }, []);

  const setFilter = (key: keyof ColumnFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const toggleColumn = (key: ColumnKey) =>
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));

  const uniqueValues = (key: "policyType" | "transactionType" | "insurer" | "pospPartner") =>
    Array.from(new Set(policies.map((p) => p[key]).filter(Boolean))) as string[];

  const uniqueNames = () =>
    Array.from(new Set(policies.map((p) => p.customer?.fullName).filter(Boolean))) as string[];

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      if (filters.insuredName && p.customer?.fullName !== filters.insuredName) return false;
      if (filters.productName && p.policyType !== filters.productName) return false;
      if (filters.transactionType && p.transactionType !== filters.transactionType) return false;
      if (filters.insurer && p.insurer !== filters.insurer) return false;
      if (filters.pospPartner && p.pospPartner !== filters.pospPartner) return false;
      if (
        filters.policyNoSearch &&
        !(p.policyNumber || "").toLowerCase().includes(filters.policyNoSearch.toLowerCase())
      )
        return false;
      if (
        filters.endorsementSearch &&
        !(p.endorsementNo || "").toLowerCase().includes(filters.endorsementSearch.toLowerCase())
      )
        return false;
      return true;
    });
  }, [policies, filters]);

  // Keeps the top scrollbar's width matched to the table's actual scrollable
  // width. Reads scrollWidth off the wrapper (the element that actually
  // scrolls) rather than the <table>'s ResizeObserver contentRect, which can
  // under-report on a border-collapse table — this is what really has to
  // match for the two scrollbars to represent the same scroll range.
  useEffect(() => {
    const tableEl = tableRef.current;
    const wrapperEl = tableWrapperRef.current;
    if (!tableEl || !wrapperEl) return;
    const update = () => setTableScrollWidth(wrapperEl.scrollWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(tableEl);
    return () => ro.disconnect();
  }, [visibleColumns, filteredPolicies]);

  const range = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { from: new Date(customFrom), to: new Date(customTo) };
    }
    return presetRange(preset);
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      dateField: dateBasis,
    });
    fetch(`/api/agent/policies?${params.toString()}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setPolicies(data.policies || []))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, [range, dateBasis, refreshKey]);

  const summary = useMemo(() => {
    const buckets = ["Motor", "Health", "Life", "Other"] as const;
    const counts: Record<string, number> = { Motor: 0, Health: 0, Life: 0, Other: 0 };
    for (const p of policies) counts[bucketFor(p)] += 1;
    return { buckets, totalPolicies: policies.length, counts };
  }, [policies]);

  const sumByBucket = (list: Policy[], key: "grossPremium" | "commissionAmount" | "payoutAmount") => {
    const buckets = ["Motor", "Health", "Life", "Other"] as const;
    const sums: Record<string, number> = { Motor: 0, Health: 0, Life: 0, Other: 0 };
    let total = 0;
    for (const p of list) {
      const val = p[key] || 0;
      sums[bucketFor(p)] += val;
      total += val;
    }
    return { buckets, total, sums };
  };

  const premiumSummary = useMemo(() => sumByBucket(policies, "grossPremium"), [policies]);
  const commissionSummary = useMemo(() => sumByBucket(policies, "commissionAmount"), [policies]);
  const payoutSummary = useMemo(() => sumByBucket(policies, "payoutAmount"), [policies]);

  const exportCsv = () => {
    const visible = COLUMNS.filter((c) => visibleColumns[c.key]);
    const headers = visible.map((c) => c.label);
    const rows = filteredPolicies.map((p) => {
      const cellFor: Record<ColumnKey, string | number> = {
        insuredName: p.customer?.fullName || "",
        subInsured: p.subInsured || "",
        policyNo: p.policyNumber || "",
        endorsementNo: p.endorsementNo || "",
        productName: p.policyType || "",
        transactionType: p.transactionType || "",
        insurer: p.insurer || "",
        pospPartner: p.pospPartner || "",
        status: p.status || "",
        startDate: formatDate(p.startDate),
        endDate: formatDate(p.endDate),
        policyMonth: p.startDate
          ? new Date(p.startDate).toLocaleDateString("en-US", { month: "long" })
          : "",
        premiumAmount: p.premium ?? "",
        grossPremium: p.grossPremium ?? "",
        commissionAmount: p.commissionAmount ?? "",
        payoutAmount: p.payoutAmount ?? "",
        payoutStatus: p.payoutStatus || "",
        policyDocStatus: p.policyDocumentStatus || "",
        policyRemark: p.policyRemark || "",
        reconcile: p.reconcile || "",
      };
      return visible.map((c) => cellFor[c.key]);
    });
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_policies_${toIso(range.from)}_to_${toIso(range.to)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleFillerCount = FILLER_KEYS.filter((k) => visibleColumns[k]).length;
  const visibleColumnCount = COLUMNS.filter((c) => visibleColumns[c.key]).length;

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>My Policies</h2>
        <div className={styles.headerActions}>
          <button className={styles.outlineBtn} onClick={() => setShowBulkUpload(true)}>
            <FiUploadCloud /> Bulk Upload
          </button>
          <button className={styles.primaryBtn} onClick={() => setShowAddForm((v) => !v)}>
            <FiPlus /> {showAddForm ? "Close" : "Add Policy"}
          </button>
        </div>
      </div>

      {showBulkUpload && (
        <BulkUploadModal
          submitEndpoint="/api/agent/policies-bulk"
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {showAddForm ? (
        <AddPolicyForm
          submitEndpoint="/api/agent/policies"
          fixedAgent={fixedAgent ?? undefined}
          onCancel={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      ) : (
        <>
          <div className={styles.summaryRow}>
            <SummaryCard
              icon={<FiCopy />}
              title="Total Policies"
              value={summary.totalPolicies}
              tone="blue"
              breakdown={summary.buckets.map((b) => ({ label: b, value: summary.counts[b] }))}
            />
            <SummaryCard
              icon="₹"
              title="Total Gross Premium"
              value={formatInrAbbrev(premiumSummary.total)}
              tone="teal"
              breakdown={premiumSummary.buckets.map((b) => ({
                label: b,
                value: formatInrAbbrev(premiumSummary.sums[b]),
              }))}
            />
            <SummaryCard
              icon="₹"
              title="Total Commission"
              value={formatInrAbbrev(commissionSummary.total)}
              tone="green"
              breakdown={commissionSummary.buckets.map((b) => ({
                label: b,
                value: formatInrAbbrev(commissionSummary.sums[b]),
              }))}
            />
            <SummaryCard
              icon="₹"
              title="Total Payout"
              value={formatInrAbbrev(payoutSummary.total)}
              tone="purple"
              breakdown={payoutSummary.buckets.map((b) => ({
                label: b,
                value: formatInrAbbrev(payoutSummary.sums[b]),
              }))}
            />
          </div>

          <div className={styles.filterRow}>
            <div className={styles.presets}>
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  className={`${styles.presetBtn} ${preset === p.key ? styles.presetBtnActive : ""}`}
                  onClick={() => setPreset(p.key)}
                >
                  {p.label}
                </button>
              ))}
              {preset === "custom" && (
                <>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </>
              )}
            </div>
            <div className={styles.filterRowRight}>
              <button className={styles.exportSolidBtn} onClick={exportCsv}>
                <FiDownload /> Export
              </button>
              <div className={styles.columnPickerWrapper} ref={columnPickerRef}>
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
                          onChange={() => toggleColumn(c.key)}
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.viewByRow}>
            <span className={styles.viewByLabel}>View Data By</span>
            <div className={styles.viewByToggle}>
              <button
                className={`${styles.viewByBtn} ${dateBasis === "startDate" ? styles.viewByBtnActive : ""}`}
                onClick={() => setDateBasis("startDate")}
              >
                Policy Effective Date
              </button>
              <button
                className={`${styles.viewByBtn} ${dateBasis === "createdAt" ? styles.viewByBtnActive : ""}`}
                onClick={() => setDateBasis("createdAt")}
              >
                System Entry Date
              </button>
            </div>
            <span className={styles.rangeText}>
              Showing data from {formatDate(toIso(range.from))} to {formatDate(toIso(range.to))}
            </span>
          </div>

          <div className={styles.topScroll} ref={topScrollRef} onScroll={handleTopScroll}>
            <div style={{ width: tableScrollWidth, height: 1 }} />
          </div>

          <div className={styles.tableWrapper} ref={tableWrapperRef} onScroll={handleTableScroll}>
            <table className={styles.table} ref={tableRef}>
              <thead>
                <tr>
                  {COLUMNS.filter((c) => visibleColumns[c.key]).map((c) => (
                    <th key={c.key} className={c.key === "insuredName" ? styles.stickyCol : undefined}>
                      {c.label}
                    </th>
                  ))}
                </tr>
                <tr className={styles.filterHeaderRow}>
                  {visibleColumns.insuredName && (
                    <td className={styles.stickyCol}>
                      <select
                        className={styles.selectInput}
                        value={filters.insuredName}
                        onChange={(e) => setFilter("insuredName", e.target.value)}
                      >
                        <option value="">Select</option>
                        {uniqueNames().map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {visibleColumns.subInsured && <td className={styles.dashCell}>—</td>}
                  {visibleColumns.policyNo && (
                    <td>
                      <div className={styles.searchInput}>
                        <FiSearch size={12} />
                        <input
                          placeholder="Search"
                          value={filters.policyNoSearch}
                          onChange={(e) => setFilter("policyNoSearch", e.target.value)}
                        />
                      </div>
                    </td>
                  )}
                  {visibleColumns.endorsementNo && (
                    <td>
                      <div className={styles.searchInput}>
                        <FiSearch size={12} />
                        <input
                          placeholder="Search"
                          value={filters.endorsementSearch}
                          onChange={(e) => setFilter("endorsementSearch", e.target.value)}
                        />
                      </div>
                    </td>
                  )}
                  {visibleColumns.productName && (
                    <td>
                      <select
                        className={styles.selectInput}
                        value={filters.productName}
                        onChange={(e) => setFilter("productName", e.target.value)}
                      >
                        <option value="">Select</option>
                        {uniqueValues("policyType").map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {visibleColumns.transactionType && (
                    <td>
                      <select
                        className={styles.selectInput}
                        value={filters.transactionType}
                        onChange={(e) => setFilter("transactionType", e.target.value)}
                      >
                        <option value="">Select</option>
                        {uniqueValues("transactionType").map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {visibleColumns.insurer && (
                    <td>
                      <select
                        className={styles.selectInput}
                        value={filters.insurer}
                        onChange={(e) => setFilter("insurer", e.target.value)}
                      >
                        <option value="">Select</option>
                        {uniqueValues("insurer").map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {visibleColumns.pospPartner && (
                    <td>
                      <select
                        className={styles.selectInput}
                        value={filters.pospPartner}
                        onChange={(e) => setFilter("pospPartner", e.target.value)}
                      >
                        <option value="">Select</option>
                        {uniqueValues("pospPartner").map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {visibleFillerCount > 0 && <td colSpan={visibleFillerCount}></td>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className={styles.emptyCell}>
                      Loading policies...
                    </td>
                  </tr>
                ) : filteredPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className={styles.emptyCell}>
                      No policies match this date range/filters.
                    </td>
                  </tr>
                ) : (
                  filteredPolicies.map((p) => (
                    <tr key={p._id}>
                      {visibleColumns.insuredName && (
                        <td className={styles.stickyCol}>{p.customer?.fullName || "--"}</td>
                      )}
                      {visibleColumns.subInsured && <td>{p.subInsured || "--"}</td>}
                      {visibleColumns.policyNo && <td>{p.policyNumber || "--"}</td>}
                      {visibleColumns.endorsementNo && <td>{p.endorsementNo || "-"}</td>}
                      {visibleColumns.productName && <td>{p.policyType || "--"}</td>}
                      {visibleColumns.transactionType && <td>{p.transactionType || "--"}</td>}
                      {visibleColumns.insurer && <td>{p.insurer || "--"}</td>}
                      {visibleColumns.pospPartner && <td>{p.pospPartner || "--"}</td>}
                      {visibleColumns.status && <td>{p.status || "--"}</td>}
                      {visibleColumns.startDate && <td>{formatDisplayDate(p.startDate)}</td>}
                      {visibleColumns.endDate && <td>{formatDisplayDate(p.endDate)}</td>}
                      {visibleColumns.policyMonth && (
                        <td>
                          {p.startDate
                            ? new Date(p.startDate).toLocaleDateString("en-US", { month: "long" })
                            : "--"}
                        </td>
                      )}
                      {visibleColumns.premiumAmount && <td>{formatInr(p.premium)}</td>}
                      {visibleColumns.grossPremium && <td>{formatInr(p.grossPremium)}</td>}
                      {visibleColumns.commissionAmount && <td>{formatInr(p.commissionAmount)}</td>}
                      {visibleColumns.payoutAmount && <td>{formatInr(p.payoutAmount)}</td>}
                      {visibleColumns.payoutStatus && (
                        <td>
                          <span className={styles.badgeTeal}>{p.payoutStatus || "PENDING"}</span>
                        </td>
                      )}
                      {visibleColumns.policyDocStatus && (
                        <td>
                          <span className={styles.badgeTeal}>
                            {p.policyDocumentStatus || "Pending"}
                          </span>
                        </td>
                      )}
                      {visibleColumns.policyRemark && <td>{p.policyRemark || "-"}</td>}
                      {visibleColumns.reconcile && (
                        <td>
                          <span className={styles.badgeAmber}>{p.reconcile || "No"}</span>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default AgentPolicyDashboard;
