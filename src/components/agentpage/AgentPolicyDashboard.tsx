"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/components/agentpage/AgentPolicyDashboard.module.css";
import {
  FiDownload,
  FiSearch,
  FiPlus,
  FiUploadCloud,
  FiColumns,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiInbox,
  FiEdit2,
  FiTrash2,
  FiFileText,
  FiTrendingUp,
  FiTrendingDown,
  FiPercent,
} from "react-icons/fi";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import AddPolicyForm from "@/components/superadminsidebar/AddPolicyForm";
import BulkUploadModal from "@/components/superadminsidebar/BulkUploadModal";
import PolicyDetailView from "@/components/superadminsidebar/PolicyDetailView";
import EditRejectedPolicyModal from "./EditRejectedPolicyModal";

// Agent-scoped port of superadminsidebar/PolicyDashboard.tsx — same columns,
// filters, presets, column picker and CSV export, backed by the
// agentToken-only /api/agent/policies[-bulk] endpoints instead of the admin
// ones, and without the admin-only click-through detail view.

export interface Policy {
  _id: string;
  policyNumber?: string;
  subInsured?: string;
  endorsementNo?: string;
  policyType?: string;
  lineOfBusiness?: string;
  product?: string;
  policyTypeStructure?: string;
  transactionType?: string;
  insurer?: string;
  pospPartner?: string;
  status?: string;
  adminApprovalStatus?: string;
  adminApprovalRemark?: string;
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
  customer?: { fullName?: string; email?: string; mobile?: string; address?: string };
  policyDocuments?: { data: string; fileName: string }[];
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

type StatTone = "blue" | "teal" | "green" | "purple";

const STAT_ICON_TONE_CLASS: Record<StatTone, string> = {
  blue: styles.statIconBlue,
  teal: styles.statIconTeal,
  green: styles.statIconGreen,
  purple: styles.statIconPurple,
};

const ChangePill: React.FC<{ current: number; previous: number }> = ({ current, previous }) => {
  if (previous === 0) {
    if (current === 0) return null;
    return (
      <span className={`${styles.changePill} ${styles.changePillUp}`}>
        <FiTrendingUp size={11} /> New
      </span>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span className={`${styles.changePill} ${up ? styles.changePillUp : styles.changePillDown}`}>
      {up ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />} {Math.abs(pct).toFixed(1)}%
    </span>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  tone: StatTone;
  label: string;
  subtitle: string;
  value: React.ReactNode;
  current: number;
  previous: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, tone, label, subtitle, value, current, previous }) => (
  <div className={styles.statCard}>
    <div className={styles.statCardTop}>
      <span className={`${styles.statCardIcon} ${STAT_ICON_TONE_CLASS[tone]}`}>{icon}</span>
      <span className={styles.statCardLabel}>{label}</span>
    </div>
    <p className={styles.statCardSubtitle}>{subtitle}</p>
    <div className={styles.statCardValueRow}>
      <span className={styles.statCardValue}>{value}</span>
      <ChangePill current={current} previous={previous} />
    </div>
  </div>
);

const SalesTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className={styles.chartTooltip}>
      <div className={styles.chartTooltipDate}>{label}</div>
      <div className={styles.chartTooltipValue}>{formatInrAbbrev(payload[0].value)}</div>
    </div>
  );
};

const ApprovalBadge: React.FC<{ status?: string }> = ({ status }) => {
  const value = status || "Pending";
  if (value === "Approved") {
    return (
      <span className={`${styles.approvalBadge} ${styles.approvalApproved}`}>
        <FiCheckCircle size={12} /> Approved
      </span>
    );
  }
  if (value === "Rejected") {
    return (
      <span className={`${styles.approvalBadge} ${styles.approvalRejected}`}>
        <FiXCircle size={12} /> Rejected
      </span>
    );
  }
  return (
    <span className={`${styles.approvalBadge} ${styles.approvalPending}`}>
      <FiClock size={12} /> Pending
    </span>
  );
};

const PendingPoliciesPanel: React.FC<{
  policies: Policy[];
  loading: boolean;
  onBack: () => void;
  onUpdated: (updated: Policy) => void;
  onDeleted: (id: string) => void;
}> = ({ policies, loading, onBack, onUpdated, onDeleted }) => {
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (policy: Policy) => {
    if (!window.confirm(`Delete rejected policy "${policy.policyNumber || ""}"? This can't be undone.`)) {
      return;
    }
    setDeletingId(policy._id);
    try {
      const res = await fetch(`/api/agent/policies/${policy._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to delete policy");
        return;
      }
      onDeleted(policy._id);
    } catch (err) {
      console.error("Delete policy failed", err);
      alert("Failed to delete policy");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.pendingPanel}>
      <button type="button" className={styles.backLink} onClick={onBack}>
        <FiArrowLeft /> Back to My Policies
      </button>

      <div className={styles.pendingPanelTitleRow}>
        <div>
          <h3 className={styles.pendingPanelTitle}>Pending Approval</h3>
          <p className={styles.pendingPanelHint}>
            Policies you've submitted stay here until an admin reviews them. Once approved,
            they'll move automatically into My Policies. Rejected ones can be edited and
            resubmitted, or deleted.
          </p>
        </div>
      </div>

      <div className={styles.pendingTableWrapper}>
        <table className={styles.pendingTable}>
          <thead>
            <tr>
              <th>Policy No.</th>
              <th>Insured Name</th>
              <th>Line of Business</th>
              <th>Insurer</th>
              <th>Premium</th>
              <th>Submitted On</th>
              <th>Status</th>
              <th>Admin Remark</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className={styles.pendingEmptyState}>
                  Loading...
                </td>
              </tr>
            ) : policies.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.pendingEmptyState}>
                  <FiInbox size={28} />
                  <span>No pending or rejected policies right now.</span>
                </td>
              </tr>
            ) : (
              policies.map((p) => (
                <tr key={p._id}>
                  <td>{p.policyNumber || "--"}</td>
                  <td>{p.customer?.fullName || "--"}</td>
                  <td>{p.policyType || "--"}</td>
                  <td>{p.insurer || "--"}</td>
                  <td>{formatInr(p.premium)}</td>
                  <td>{formatDisplayDate(p.createdAt)}</td>
                  <td>
                    <ApprovalBadge status={p.adminApprovalStatus} />
                  </td>
                  <td className={styles.remarkCell}>
                    {p.adminApprovalStatus && p.adminApprovalStatus !== "Pending"
                      ? p.adminApprovalRemark || "--"
                      : "--"}
                  </td>
                  <td>
                    {p.adminApprovalStatus === "Rejected" ? (
                      <div className={styles.pendingRowActions}>
                        <button
                          type="button"
                          className={styles.pendingActionBtn}
                          onClick={() => setEditingPolicy(p)}
                          title="Edit & resubmit"
                          aria-label="Edit & resubmit"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.pendingActionBtn} ${styles.pendingActionBtnDanger}`}
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p._id}
                          title="Delete"
                          aria-label="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      "--"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingPolicy && (
        <EditRejectedPolicyModal
          policy={editingPolicy}
          onClose={() => setEditingPolicy(null)}
          onResubmitted={(updated) => {
            onUpdated(updated);
            setEditingPolicy(null);
          }}
        />
      )}
    </div>
  );
};

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
  | "reconcile"
  | "uploadPdf";

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
  { key: "uploadPdf", label: "Upload PDF" },
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
  "uploadPdf",
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
  const [showPendingView, setShowPendingView] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(ALL_COLUMNS_VISIBLE);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);
  const [fixedAgent, setFixedAgent] = useState<{ id: string; name: string } | null>(null);
  const [uploadingPdfId, setUploadingPdfId] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const pdfInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [salesChartWidth, setSalesChartWidth] = useState(0);
  const salesChartRoRef = useRef<ResizeObserver | null>(null);
  // A callback ref (not a plain useRef + effect) so the ResizeObserver gets
  // re-attached every time this div mounts — it unmounts/remounts whenever
  // the view switches away from and back to the main policy list.
  const salesChartWrapRef = useCallback((node: HTMLDivElement | null) => {
    salesChartRoRef.current?.disconnect();
    salesChartRoRef.current = null;
    if (node) {
      setSalesChartWidth(node.clientWidth);
      const ro = new ResizeObserver(() => setSalesChartWidth(node.clientWidth));
      ro.observe(node);
      salesChartRoRef.current = ro;
    }
  }, []);
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

  // A policy only shows up in the main "My Policies" table once an admin
  // has approved it — anything still pending review, or rejected, lives in
  // the separate Pending Policies panel instead until it's approved and
  // "moves" over here.
  const approvedPolicies = useMemo(
    () => policies.filter((p) => (p.adminApprovalStatus || "Pending") === "Approved"),
    [policies]
  );
  const pendingPolicies = useMemo(
    () => policies.filter((p) => (p.adminApprovalStatus || "Pending") !== "Approved"),
    [policies]
  );

  const uniqueValues = (key: "policyType" | "transactionType" | "insurer" | "pospPartner") =>
    Array.from(new Set(approvedPolicies.map((p) => p[key]).filter(Boolean))) as string[];

  const uniqueNames = () =>
    Array.from(new Set(approvedPolicies.map((p) => p.customer?.fullName).filter(Boolean))) as string[];

  const filteredPolicies = useMemo(() => {
    return approvedPolicies.filter((p) => {
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
  }, [approvedPolicies, filters]);

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

  // The immediately preceding period of the same length as the selected
  // range, fetched purely to power the top cards' "vs. last period" pills.
  const prevRange = useMemo(() => {
    const durationMs = Math.max(1, range.to.getTime() - range.from.getTime());
    const prevTo = new Date(range.from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);
    return { from: prevFrom, to: prevTo };
  }, [range]);

  const [prevPolicies, setPrevPolicies] = useState<Policy[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({
      from: prevRange.from.toISOString(),
      to: prevRange.to.toISOString(),
      dateField: dateBasis,
    });
    fetch(`/api/agent/policies?${params.toString()}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setPrevPolicies(data.policies || []))
      .catch(() => setPrevPolicies([]));
  }, [prevRange, dateBasis, refreshKey]);

  const prevPremiumTotal = useMemo(
    () => prevPolicies.reduce((sum, p) => sum + (p.grossPremium || 0), 0),
    [prevPolicies]
  );
  const prevCommissionTotal = useMemo(
    () => prevPolicies.reduce((sum, p) => sum + (p.commissionAmount || 0), 0),
    [prevPolicies]
  );
  const prevPayoutTotal = useMemo(
    () => prevPolicies.reduce((sum, p) => sum + (p.payoutAmount || 0), 0),
    [prevPolicies]
  );

  const approvedCount = useMemo(
    () => policies.filter((p) => p.adminApprovalStatus === "Approved").length,
    [policies]
  );
  const pendingCount = useMemo(
    () => policies.filter((p) => (p.adminApprovalStatus || "Pending") === "Pending").length,
    [policies]
  );
  const rejectedCount = useMemo(
    () => policies.filter((p) => p.adminApprovalStatus === "Rejected").length,
    [policies]
  );

  // Breakdown by actual product/policy type (e.g. "2W", "Health", "Pvt
  // Car") rather than the coarser Motor/Health/Life/Other buckets, for the
  // legend under the sales trend chart.
  const productBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of policies) {
      const key = p.product || p.policyType || "Other";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const colors = ["#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#0e9488", "#e11d48"];
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], i) => ({
        name,
        count,
        color: colors[i % colors.length],
        pct: policies.length > 0 ? Math.round((count / policies.length) * 100) : 0,
      }));
  }, [policies]);

  // Gross premium bucketed by day across the selected range, for the sales
  // trend chart — always the current period only (single line).
  const trendData = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / dayMs));
    const bucketCount = Math.min(30, Math.max(7, totalDays));
    const bucketMs = Math.max(1, range.to.getTime() - range.from.getTime()) / bucketCount;
    const sums = new Array(bucketCount).fill(0);
    for (const p of policies) {
      const raw = dateBasis === "createdAt" ? p.createdAt : p.startDate;
      if (!raw) continue;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;
      const idx = Math.min(
        bucketCount - 1,
        Math.max(0, Math.floor((d.getTime() - range.from.getTime()) / bucketMs))
      );
      sums[idx] += p.grossPremium || 0;
    }
    return Array.from({ length: bucketCount }, (_, i) => {
      const bucketDate = new Date(range.from.getTime() + i * bucketMs);
      return {
        label: bucketDate.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        amount: Math.round(sums[i]),
      };
    });
  }, [policies, range, dateBasis]);

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
        uploadPdf: p.policyDocuments && p.policyDocuments.length > 0 ? "Uploaded" : "Not uploaded",
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

  const viewPolicyDocument = (dataUri: string) => {
    try {
      const [header, base64] = dataUri.split(",");
      const mime = header.match(/data:(.*);base64/)?.[1] || "application/pdf";
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error("Failed to open policy document", err);
      window.open(dataUri, "_blank");
    }
  };

  const handleUploadPolicyDocument = async (policyId: string, file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }
    setUploadingPdfId(policyId);
    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`/api/agent/policies/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fileData, fileName: file.name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to upload document");
        return;
      }
      setPolicies((prev) =>
        prev.map((p) =>
          p._id === policyId
            ? {
                ...p,
                policyDocuments: data.policy.policyDocuments,
                policyDocumentStatus: data.policy.policyDocumentStatus,
              }
            : p
        )
      );
    } catch (err) {
      console.error("Upload policy document failed", err);
      alert("Failed to upload document");
    } finally {
      setUploadingPdfId(null);
    }
  };

  const visibleFillerCount = FILLER_KEYS.filter((k) => visibleColumns[k]).length;
  const visibleColumnCount = COLUMNS.filter((c) => visibleColumns[c.key]).length;

  if (selectedPolicyId) {
    return (
      <div className={styles.cont}>
        <PolicyDetailView
          policyId={selectedPolicyId}
          apiBasePath="/api/agent/policies"
          canDelete={false}
          onBack={() => setSelectedPolicyId(null)}
          onDeleted={() => setSelectedPolicyId(null)}
        />
      </div>
    );
  }

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>My Policies</h2>
        <div className={styles.headerActions}>
          <button
            className={styles.outlineBtn}
            onClick={() => {
              setShowPendingView((v) => !v);
              setShowAddForm(false);
            }}
          >
            <FiClock /> {showPendingView ? "Close" : "Pending Policies"}
            {pendingPolicies.length > 0 && (
              <span className={styles.pendingCountBadge}>{pendingPolicies.length}</span>
            )}
          </button>
          {!showPendingView && (
            <>
              <button className={styles.outlineBtn} onClick={() => setShowBulkUpload(true)}>
                <FiUploadCloud /> Bulk Upload
              </button>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  setShowAddForm((v) => !v);
                  setShowPendingView(false);
                }}
              >
                <FiPlus /> {showAddForm ? "Close" : "Add Policy"}
              </button>
            </>
          )}
        </div>
      </div>

      {showBulkUpload && (
        <BulkUploadModal
          submitEndpoint="/api/agent/policies-bulk"
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {showPendingView ? (
        <PendingPoliciesPanel
          policies={pendingPolicies}
          loading={loading}
          onBack={() => setShowPendingView(false)}
          onUpdated={(updated) =>
            setPolicies((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)))
          }
          onDeleted={(id) => setPolicies((prev) => prev.filter((p) => p._id !== id))}
        />
      ) : showAddForm ? (
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
          <div className={styles.statCardsRow}>
            <StatCard
              icon={<FiFileText size={16} />}
              tone="blue"
              label="Total Policies"
              subtitle="This period"
              value={summary.totalPolicies}
              current={summary.totalPolicies}
              previous={prevPolicies.length}
            />
            <StatCard
              icon={<span className={styles.rupeeIcon}>₹</span>}
              tone="teal"
              label="Total Premium"
              subtitle="Gross premium"
              value={formatInrAbbrev(premiumSummary.total)}
              current={premiumSummary.total}
              previous={prevPremiumTotal}
            />
            <StatCard
              icon={<FiPercent size={16} />}
              tone="green"
              label="Total Commission"
              subtitle="Commission earned"
              value={formatInrAbbrev(commissionSummary.total)}
              current={commissionSummary.total}
              previous={prevCommissionTotal}
            />
            <StatCard
              icon={<span className={styles.rupeeIcon}>₹</span>}
              tone="purple"
              label="Total Payout"
              subtitle="Payout amount"
              value={formatInrAbbrev(payoutSummary.total)}
              current={payoutSummary.total}
              previous={prevPayoutTotal}
            />
          </div>

          <div className={styles.mainGrid}>
            <div className={styles.salesCard}>
              <div className={styles.salesCardHeader}>
                <div>
                  <h3 className={styles.salesCardTitle}>Premium Sales</h3>
                  <div className={styles.salesCardValueRow}>
                    <span className={styles.salesCardValue}>{formatInrAbbrev(premiumSummary.total)}</span>
                    <ChangePill current={premiumSummary.total} previous={prevPremiumTotal} />
                  </div>
                </div>
              </div>

              <div className={styles.salesChartBox} ref={salesChartWrapRef}>
                {salesChartWidth > 0 && (
                  <AreaChart
                    width={salesChartWidth}
                    height={240}
                    data={trendData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#eef1f6" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#9aa2b4" }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9aa2b4" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatInrAbbrev(v)}
                      width={48}
                    />
                    <Tooltip content={<SalesTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#16a34a"
                      strokeWidth={2.5}
                      fill="url(#salesFill)"
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                )}
              </div>

              <div className={styles.productLegend}>
                {productBreakdown.length === 0 ? (
                  <p className={styles.productLegendEmpty}>No policies in this range yet.</p>
                ) : (
                  productBreakdown.map((row) => (
                    <div key={row.name} className={styles.productLegendItem}>
                      <span className={styles.productLegendDot} style={{ background: row.color }} />
                      <span className={styles.productLegendName}>{row.name}</span>
                      <span className={styles.productLegendCount}>{row.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.approvalCard}>
              <h3 className={styles.approvalCardTitle}>Approval Status</h3>

              <div className={styles.approvalStatRow}>
                <span className={`${styles.approvalStatIcon} ${styles.approvalStatIconGreen}`}>
                  <FiCheckCircle size={15} />
                </span>
                <div className={styles.approvalStatText}>
                  <span className={styles.approvalStatLabel}>Approved</span>
                  <span className={styles.approvalStatSub}>Live in your policy list</span>
                </div>
                <span className={styles.approvalStatValue}>{approvedCount}</span>
              </div>

              <div className={styles.approvalStatRow}>
                <span className={`${styles.approvalStatIcon} ${styles.approvalStatIconAmber}`}>
                  <FiClock size={15} />
                </span>
                <div className={styles.approvalStatText}>
                  <span className={styles.approvalStatLabel}>Pending</span>
                  <span className={styles.approvalStatSub}>Awaiting admin review</span>
                </div>
                <span className={styles.approvalStatValue}>{pendingCount}</span>
              </div>

              <div className={styles.approvalStatRow}>
                <span className={`${styles.approvalStatIcon} ${styles.approvalStatIconRed}`}>
                  <FiXCircle size={15} />
                </span>
                <div className={styles.approvalStatText}>
                  <span className={styles.approvalStatLabel}>Rejected</span>
                  <span className={styles.approvalStatSub}>Needs edit & resubmit</span>
                </div>
                <span className={styles.approvalStatValue}>{rejectedCount}</span>
              </div>
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
                        <td className={styles.stickyCol}>
                          <button
                            type="button"
                            className={styles.linkCell}
                            onClick={() => setSelectedPolicyId(p._id)}
                          >
                            {p.customer?.fullName || "--"}
                          </button>
                        </td>
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
                            {p.policyDocumentStatus || "PENDING"}
                          </span>
                        </td>
                      )}
                      {visibleColumns.policyRemark && <td>{p.policyRemark || "-"}</td>}
                      {visibleColumns.reconcile && (
                        <td>
                          <span className={styles.badgeAmber}>{p.reconcile || "No"}</span>
                        </td>
                      )}
                      {visibleColumns.uploadPdf && (
                        <td>
                          {p.policyDocuments && p.policyDocuments.length > 0 ? (
                            <button
                              type="button"
                              className={styles.pdfActionBtn}
                              onClick={() => viewPolicyDocument(p.policyDocuments![0].data)}
                              title="View PDF"
                              aria-label="View PDF"
                            >
                              <FiEye size={15} />
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={styles.pdfActionBtn}
                                onClick={() => pdfInputRefs.current[p._id]?.click()}
                                title="Upload PDF"
                                aria-label="Upload PDF"
                                disabled={uploadingPdfId === p._id}
                              >
                                <FiUploadCloud size={15} />
                              </button>
                              <input
                                type="file"
                                accept="application/pdf"
                                hidden
                                ref={(el) => {
                                  pdfInputRefs.current[p._id] = el;
                                }}
                                onChange={(e) => {
                                  handleUploadPolicyDocument(p._id, e.target.files?.[0]);
                                  e.target.value = "";
                                }}
                              />
                            </>
                          )}
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
