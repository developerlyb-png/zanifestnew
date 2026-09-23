"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import { FiDownload, FiSearch, FiColumns, FiCalendar, FiEye, FiBell, FiX, FiAlertTriangle, FiClock } from "react-icons/fi";
import { FiRefreshCw, FiTrendingUp } from "react-icons/fi";
import PolicyDetailView from "./PolicyDetailView";

interface RenewalPolicy {
  _id: string;
  policyNumber?: string;
  lineOfBusiness?: string;
  policyType?: string;
  product?: string;
  status?: string;
  endDate?: string;
  renewalStatus?: string;
  nextFollowUpDate?: string;
  customer?: { fullName?: string; email?: string; mobile?: string };
}

type ColumnKey =
  | "select"
  | "policyNo"
  | "insured"
  | "insuredEmail"
  | "insuredPhone"
  | "lob"
  | "status"
  | "expiryDate"
  | "daysToExpiry"
  | "nextFollowUp"
  | "actions";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "select", label: "" },
  { key: "policyNo", label: "Policy No." },
  { key: "insured", label: "Insured" },
  { key: "insuredEmail", label: "Insured Email" },
  { key: "insuredPhone", label: "Insured Phone" },
  { key: "lob", label: "LOB" },
  { key: "status", label: "Status" },
  { key: "expiryDate", label: "Expiry Date" },
  { key: "daysToExpiry", label: "Days To Expiry" },
  { key: "nextFollowUp", label: "Next Follow-up" },
  { key: "actions", label: "Actions" },
];

const ALL_VISIBLE: Record<ColumnKey, boolean> = COLUMNS.reduce((acc, c) => {
  acc[c.key] = true;
  return acc;
}, {} as Record<ColumnKey, boolean>);

const RENEWAL_STATUSES = ["Not Started", "Initiated", "Pending", "Renewed", "Lost"];

const daysToExpiry = (endDate?: string) => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
};

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const toDateInputValue = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : "");

function PolicyRenewals() {
  const [policies, setPolicies] = useState<RenewalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(ALL_VISIBLE);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showFollowUpsOnly, setShowFollowUpsOnly] = useState(false);
  const [dueSoonFilterActive, setDueSoonFilterActive] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [policyNoSearch, setPolicyNoSearch] = useState("");
  const [insuredSearch, setInsuredSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [lobFilter, setLobFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/policyrenewals", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setPolicies(data.policies || []))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const lobOf = (p: RenewalPolicy) => p.lineOfBusiness || p.policyType || p.product || "";

  const uniqueLobs = useMemo(
    () => Array.from(new Set(policies.map(lobOf).filter(Boolean))),
    [policies]
  );

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      if (
        policyNoSearch &&
        !(p.policyNumber || "").toLowerCase().includes(policyNoSearch.toLowerCase())
      )
        return false;
      if (
        insuredSearch &&
        !(p.customer?.fullName || "").toLowerCase().includes(insuredSearch.toLowerCase())
      )
        return false;
      if (
        emailSearch &&
        !(p.customer?.email || "").toLowerCase().includes(emailSearch.toLowerCase())
      )
        return false;
      if (
        phoneSearch &&
        !(p.customer?.mobile || "").toLowerCase().includes(phoneSearch.toLowerCase())
      )
        return false;
      if (lobFilter && lobOf(p) !== lobFilter) return false;
      if (statusFilter && (p.renewalStatus || "Not Started") !== statusFilter) return false;
      if (showFollowUpsOnly && !p.nextFollowUpDate) return false;
      if (dueSoonFilterActive) {
        const d = daysToExpiry(p.endDate);
        if (d === null || d > 30) return false;
      }
      return true;
    });
  }, [
    policies,
    policyNoSearch,
    insuredSearch,
    emailSearch,
    phoneSearch,
    lobFilter,
    statusFilter,
    showFollowUpsOnly,
    dueSoonFilterActive,
  ]);

  const summary = useMemo(() => {
    let due30 = 0;
    let due60 = 0;
    let due90 = 0;
    let initiated = 0;
    let pending = 0;
    let lost = 0;

    for (const p of policies) {
      const d = daysToExpiry(p.endDate);
      if (d !== null) {
        if (d <= 30) due30 += 1;
        if (d <= 60) due60 += 1;
        if (d <= 90) due90 += 1;
      }
      const rs = p.renewalStatus || "Not Started";
      if (rs === "Initiated") initiated += 1;
      else if (rs === "Pending") pending += 1;
      else if (rs === "Lost") lost += 1;
    }

    return { totalDue: policies.length, due30, due60, due90, initiated, pending, lost };
  }, [policies]);

  // Real, per-policy alert data behind the bell — an admin needs to know
  // WHICH policies and WHEN, not just a single aggregate count. Split by
  // actual urgency (already lapsed vs. this week vs. this month) rather
  // than one lumped "due30" bucket, and sorted soonest-first so the most
  // urgent case is always what they see first.
  const alertGroups = useMemo(() => {
    const withDays = policies
      .map((p) => ({ policy: p, days: daysToExpiry(p.endDate) }))
      .filter((x): x is { policy: RenewalPolicy; days: number } => x.days !== null && x.days <= 30)
      .sort((a, b) => a.days - b.days);

    return {
      overdue: withDays.filter((x) => x.days < 0),
      dueThisWeek: withDays.filter((x) => x.days >= 0 && x.days <= 7),
      dueThisMonth: withDays.filter((x) => x.days > 7 && x.days <= 30),
    };
  }, [policies]);

  const totalAlerts =
    alertGroups.overdue.length + alertGroups.dueThisWeek.length + alertGroups.dueThisMonth.length;

  const insuredLabel = (p: RenewalPolicy) => p.customer?.fullName || p.policyNumber || "Unnamed";

  const openPolicyFromAlert = (id: string) => {
    setShowNotifPanel(false);
    setSelectedPolicyId(id);
  };

  const toggleColumn = (key: ColumnKey) =>
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p._id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updatePolicy = async (id: string, patch: Record<string, any>) => {
    // Optimistic update — the list is small and this is an admin tool, so
    // a failed PATCH just gets corrected on next refresh rather than
    // blocking the row on a spinner.
    setPolicies((prev) => prev.map((p) => (p._id === id ? { ...p, ...patch } : p)));
    try {
      await fetch("/api/admin/policyrenewals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, ...patch }),
      });
    } catch (err) {
      console.log("POLICY RENEWAL UPDATE FAILED", err);
      setRefreshKey((k) => k + 1);
    }
  };

  const exportCsv = () => {
    const headers = ["Policy No.", "Insured", "Insured Email", "Insured Phone", "LOB", "Status", "Expiry Date", "Days To Expiry", "Next Follow-up"];
    const rows = filtered.map((p) => [
      p.policyNumber || "",
      p.customer?.fullName || "",
      p.customer?.email || "",
      p.customer?.mobile || "",
      lobOf(p),
      p.renewalStatus || "Not Started",
      formatDate(p.endDate),
      daysToExpiry(p.endDate) ?? "",
      formatDate(p.nextFollowUpDate),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "policy_renewals.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleColumnCount = COLUMNS.filter((c) => visibleColumns[c.key]).length;

  if (selectedPolicyId) {
    return (
      <div className={styles.cont}>
        <PolicyDetailView
          policyId={selectedPolicyId}
          onBack={() => setSelectedPolicyId(null)}
          onDeleted={() => {
            setSelectedPolicyId(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Policy Renewals Dashboard</h2>
        <div className={styles.notifWrapper} ref={notifRef}>
          <button
            type="button"
            className={styles.bellBtn}
            onClick={() => setShowNotifPanel((v) => !v)}
            title={`${totalAlerts} renewal(s) due within 30 days`}
            aria-label="Renewal alerts"
          >
            <FiBell size={18} />
            {totalAlerts > 0 && <span className={styles.bellBadge}>{totalAlerts}</span>}
          </button>

          {showNotifPanel && (
            <div className={styles.notifPanel}>
              <div className={styles.notifPanelHeader}>
                <span>Renewal Alerts</span>
                <span className={styles.notifPanelCount}>{totalAlerts}</span>
              </div>

              {totalAlerts === 0 ? (
                <div className={styles.notifEmpty}>No renewals due in the next 30 days. All caught up!</div>
              ) : (
                <div className={styles.notifBody}>
                  {alertGroups.overdue.length > 0 && (
                    <div className={styles.notifSection}>
                      <div className={`${styles.notifSectionTitle} ${styles.notifDotRed}`}>
                        <FiAlertTriangle size={12} /> Overdue ({alertGroups.overdue.length})
                      </div>
                      {alertGroups.overdue.map(({ policy, days }) => (
                        <button
                          key={policy._id}
                          type="button"
                          className={styles.notifItem}
                          onClick={() => openPolicyFromAlert(policy._id)}
                        >
                          <span className={styles.notifItemText}>
                            <strong>{insuredLabel(policy)}</strong>
                            <span>{policy.policyNumber || "--"}</span>
                          </span>
                          <span className={`${styles.notifItemBadge} ${styles.notifBadgeRed}`}>
                            {Math.abs(days)}d overdue
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {alertGroups.dueThisWeek.length > 0 && (
                    <div className={styles.notifSection}>
                      <div className={`${styles.notifSectionTitle} ${styles.notifDotOrange}`}>
                        <FiClock size={12} /> Due this week ({alertGroups.dueThisWeek.length})
                      </div>
                      {alertGroups.dueThisWeek.map(({ policy, days }) => (
                        <button
                          key={policy._id}
                          type="button"
                          className={styles.notifItem}
                          onClick={() => openPolicyFromAlert(policy._id)}
                        >
                          <span className={styles.notifItemText}>
                            <strong>{insuredLabel(policy)}</strong>
                            <span>{policy.policyNumber || "--"}</span>
                          </span>
                          <span className={`${styles.notifItemBadge} ${styles.notifBadgeOrange}`}>
                            {days === 0 ? "today" : `in ${days}d`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {alertGroups.dueThisMonth.length > 0 && (
                    <div className={styles.notifSection}>
                      <div className={`${styles.notifSectionTitle} ${styles.notifDotAmber}`}>
                        <FiCalendar size={12} /> Due this month ({alertGroups.dueThisMonth.length})
                      </div>
                      {alertGroups.dueThisMonth.map(({ policy, days }) => (
                        <button
                          key={policy._id}
                          type="button"
                          className={styles.notifItem}
                          onClick={() => openPolicyFromAlert(policy._id)}
                        >
                          <span className={styles.notifItemText}>
                            <strong>{insuredLabel(policy)}</strong>
                            <span>{policy.policyNumber || "--"}</span>
                          </span>
                          <span className={`${styles.notifItemBadge} ${styles.notifBadgeAmber}`}>
                            in {days}d
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {totalAlerts > 0 && (
                <button
                  type="button"
                  className={styles.notifFooter}
                  onClick={() => {
                    setDueSoonFilterActive(true);
                    setShowNotifPanel(false);
                  }}
                >
                  View all {totalAlerts} in table ↓
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {totalAlerts > 0 && (
        <div
          className={`${styles.dueSoonBanner} ${dueSoonFilterActive ? styles.dueSoonBannerActive : ""}`}
          onClick={() => setDueSoonFilterActive((v) => !v)}
        >
          <span>
            <FiBell size={14} />
            {alertGroups.overdue.length > 0 && (
              <strong className={styles.bannerOverdue}>{alertGroups.overdue.length} overdue</strong>
            )}
            {alertGroups.overdue.length > 0 && (alertGroups.dueThisWeek.length > 0 || alertGroups.dueThisMonth.length > 0) && " · "}
            {alertGroups.dueThisWeek.length > 0 && (
              <strong>{alertGroups.dueThisWeek.length} due this week</strong>
            )}
            {alertGroups.dueThisWeek.length > 0 && alertGroups.dueThisMonth.length > 0 && " · "}
            {alertGroups.dueThisMonth.length > 0 && <span>{alertGroups.dueThisMonth.length} due this month</span>}
          </span>
          {dueSoonFilterActive && (
            <button
              type="button"
              className={styles.dueSoonClear}
              onClick={(e) => {
                e.stopPropagation();
                setDueSoonFilterActive(false);
              }}
            >
              <FiX size={13} /> Clear filter
            </button>
          )}
        </div>
      )}

      <div className={styles.summaryRow}>
        <div className={`${styles.card} ${styles.toneBlue}`}>
          <p className={styles.cardTitle}>
            <span className={styles.iconBadge}><FiRefreshCw /></span> Total Due
          </p>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>{summary.totalDue}</span>
            <div className={styles.cardBreakdown}>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Due in 30 Days</span>
                <span
                  className={`${styles.breakdownValue} ${summary.due30 > 0 ? styles.breakdownValueUrgent : ""}`}
                >
                  {summary.due30}
                </span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Due in 60 Days</span>
                <span className={styles.breakdownValue}>{summary.due60}</span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Due in 90 Days</span>
                <span className={styles.breakdownValue}>{summary.due90}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.toneGreen}`}>
          <p className={styles.cardTitle}>
            <span className={styles.iconBadge}><FiTrendingUp /></span> Policy Sales
          </p>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>{summary.initiated + summary.pending + summary.lost}</span>
            <div className={styles.cardBreakdown}>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Initiated</span>
                <span className={styles.breakdownValue}>{summary.initiated}</span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Pending</span>
                <span className={styles.breakdownValue}>{summary.pending}</span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Lost</span>
                <span className={styles.breakdownValue}>{summary.lost}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.filterRow}>
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
                {COLUMNS.filter((c) => c.key !== "select").map((c) => (
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
          <button
            className={`${styles.outlineBtn} ${showFollowUpsOnly ? styles.presetBtnActive : ""}`}
            onClick={() => setShowFollowUpsOnly((v) => !v)}
          >
            <FiCalendar /> Show Follow-ups
          </button>
        </div>
      </div>

      <span className={styles.rowCount}>
        {filtered.length} of {policies.length} renewals
      </span>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {visibleColumns.select && (
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              {COLUMNS.filter((c) => c.key !== "select" && visibleColumns[c.key]).map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
            <tr className={styles.filterHeaderRow}>
              {visibleColumns.select && <td className={styles.checkboxCell}>—</td>}
              {visibleColumns.policyNo && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input
                      placeholder="Search"
                      value={policyNoSearch}
                      onChange={(e) => setPolicyNoSearch(e.target.value)}
                    />
                  </div>
                </td>
              )}
              {visibleColumns.insured && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input
                      placeholder="Search"
                      value={insuredSearch}
                      onChange={(e) => setInsuredSearch(e.target.value)}
                    />
                  </div>
                </td>
              )}
              {visibleColumns.insuredEmail && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input
                      placeholder="Search"
                      value={emailSearch}
                      onChange={(e) => setEmailSearch(e.target.value)}
                    />
                  </div>
                </td>
              )}
              {visibleColumns.insuredPhone && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input
                      placeholder="Search"
                      value={phoneSearch}
                      onChange={(e) => setPhoneSearch(e.target.value)}
                    />
                  </div>
                </td>
              )}
              {visibleColumns.lob && (
                <td>
                  <select
                    className={styles.selectInput}
                    value={lobFilter}
                    onChange={(e) => setLobFilter(e.target.value)}
                  >
                    <option value="">All LOBs</option>
                    {uniqueLobs.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
              )}
              {visibleColumns.status && (
                <td>
                  <select
                    className={styles.selectInput}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {RENEWAL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              )}
              {visibleColumns.expiryDate && <td className={styles.dashCell}>—</td>}
              {visibleColumns.daysToExpiry && <td className={styles.dashCell}>—</td>}
              {visibleColumns.nextFollowUp && <td className={styles.dashCell}>—</td>}
              {visibleColumns.actions && <td className={styles.dashCell}>—</td>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumnCount} className={styles.emptyCell}>
                  Loading renewals...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnCount} className={styles.emptyCell}>
                  No renewals found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const d = daysToExpiry(p.endDate);
                return (
                  <tr key={p._id}>
                    {visibleColumns.select && (
                      <td className={styles.checkboxCell}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p._id)}
                          onChange={() => toggleSelectOne(p._id)}
                        />
                      </td>
                    )}
                    {visibleColumns.policyNo && <td>{p.policyNumber || "--"}</td>}
                    {visibleColumns.insured && <td>{p.customer?.fullName || "--"}</td>}
                    {visibleColumns.insuredEmail && <td>{p.customer?.email || "--"}</td>}
                    {visibleColumns.insuredPhone && <td>{p.customer?.mobile || "--"}</td>}
                    {visibleColumns.lob && <td>{lobOf(p) || "--"}</td>}
                    {visibleColumns.status && (
                      <td>
                        <select
                          className={styles.miniSelect}
                          value={p.renewalStatus || "Not Started"}
                          onChange={(e) => updatePolicy(p._id, { renewalStatus: e.target.value })}
                        >
                          {RENEWAL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    {visibleColumns.expiryDate && <td>{formatDate(p.endDate)}</td>}
                    {visibleColumns.daysToExpiry && (
                      <td>
                        {d === null ? (
                          "--"
                        ) : d < 0 ? (
                          <span className={styles.badgeAmber}>Expired {Math.abs(d)}d ago</span>
                        ) : (
                          `${d} day(s)`
                        )}
                      </td>
                    )}
                    {visibleColumns.nextFollowUp && (
                      <td>
                        <input
                          type="date"
                          className={styles.miniDateInput}
                          value={toDateInputValue(p.nextFollowUpDate)}
                          onChange={(e) =>
                            updatePolicy(p._id, { nextFollowUpDate: e.target.value || null })
                          }
                        />
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td>
                        <button
                          type="button"
                          className={styles.pdfActionBtn}
                          onClick={() => setSelectedPolicyId(p._id)}
                          title="View policy"
                          aria-label="View policy"
                        >
                          <FiEye size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PolicyRenewals;
