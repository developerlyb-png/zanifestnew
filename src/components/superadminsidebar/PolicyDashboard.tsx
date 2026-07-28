import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import { FiDownload, FiSearch } from "react-icons/fi";

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

type Preset = "thisMonth" | "thisYear" | "custom";

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

  switch (preset) {
    case "thisMonth":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfToday };
    case "thisYear":
      return financialYearRange();
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

const PRESETS: { key: Preset; label: string }[] = [
  { key: "thisMonth", label: "This Month" },
  { key: "thisYear", label: "This Year" },
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

function PolicyDashboard() {
  const [preset, setPreset] = useState<Preset>("thisYear");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ColumnFilters>(EMPTY_FILTERS);

  const setFilter = (key: keyof ColumnFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

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
    });
    fetch(`/api/admin/policies?${params.toString()}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setPolicies(data.policies || []))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, [range]);

  const summary = useMemo(() => {
    const buckets = ["Motor", "Health", "Life", "Other"] as const;
    const counts: Record<string, number> = { Motor: 0, Health: 0, Life: 0, Other: 0 };
    for (const p of policies) counts[bucketFor(p)] += 1;
    return { buckets, totalPolicies: policies.length, counts };
  }, [policies]);

  const exportCsv = () => {
    const headers = [
      "Insured Name", "Sub-Insured", "Policy No.", "Endorsement No.", "Product Name",
      "Transaction Type", "Insurer", "POSP Partner", "Status", "Start Date", "End Date",
      "Premium Amount", "Gross Premium", "Commission Amount", "Payout Amount",
      "Payout Status", "Policy Document Status", "Policy Remark", "Reconcile",
    ];
    const rows = filteredPolicies.map((p) => [
      p.customer?.fullName || "",
      p.subInsured || "",
      p.policyNumber || "",
      p.endorsementNo || "",
      p.policyType || "",
      p.transactionType || "",
      p.insurer || "",
      p.pospPartner || "",
      p.status || "",
      formatDate(p.startDate),
      formatDate(p.endDate),
      p.premium ?? "",
      p.grossPremium ?? "",
      p.commissionAmount ?? "",
      p.payoutAmount ?? "",
      p.payoutStatus || "",
      p.policyDocumentStatus || "",
      p.policyRemark || "",
      p.reconcile || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `policies_${toIso(range.from)}_to_${toIso(range.to)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Policy data</h2>
        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={exportCsv}>
            <FiDownload /> Export
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>Policies</p>
        <div className={styles.cardBody}>
          <span className={styles.cardValue}>{summary.totalPolicies}</span>
          <div className={styles.cardBreakdown}>
            {summary.buckets.map((b) => (
              <span key={b}>
                {b}
                <br />
                {summary.counts[b]}
              </span>
            ))}
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
        <span className={styles.rangeText}>
          Showing data from {formatDate(toIso(range.from))} to {formatDate(toIso(range.to))}
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Insured Name</th>
              <th>Sub-Insured</th>
              <th>Policy No.</th>
              <th>Endorsement No.</th>
              <th>Product Name</th>
              <th>Transaction Type</th>
              <th>Insurer</th>
              <th>POSP Partner</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Policy Month</th>
              <th>Premium Amount</th>
              <th>Gross Premium</th>
              <th>Commission Amount</th>
              <th>Payout Amount</th>
              <th>Payout Status</th>
              <th>Policy Document Status</th>
              <th>Policy Remark</th>
              <th>Reconcile</th>
            </tr>
            <tr className={styles.filterHeaderRow}>
              <td>
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
              <td className={styles.dashCell}>—</td>
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
              <td colSpan={12}></td>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={20} className={styles.emptyCell}>
                  Loading policies...
                </td>
              </tr>
            ) : filteredPolicies.length === 0 ? (
              <tr>
                <td colSpan={20} className={styles.emptyCell}>
                  No policies match this date range/filters.
                </td>
              </tr>
            ) : (
              filteredPolicies.map((p) => (
                <tr key={p._id}>
                  <td className={styles.linkCell}>{p.customer?.fullName || "--"}</td>
                  <td>{p.subInsured || "--"}</td>
                  <td>{p.policyNumber || "--"}</td>
                  <td>{p.endorsementNo || "-"}</td>
                  <td>{p.policyType || "--"}</td>
                  <td>{p.transactionType || "--"}</td>
                  <td>{p.insurer || "--"}</td>
                  <td>{p.pospPartner || "--"}</td>
                  <td>{p.status || "--"}</td>
                  <td>{formatDisplayDate(p.startDate)}</td>
                  <td>{formatDisplayDate(p.endDate)}</td>
                  <td>
                    {p.startDate
                      ? new Date(p.startDate).toLocaleDateString("en-US", { month: "long" })
                      : "--"}
                  </td>
                  <td>{formatInr(p.premium)}</td>
                  <td>{formatInr(p.grossPremium)}</td>
                  <td>{formatInr(p.commissionAmount)}</td>
                  <td>{formatInr(p.payoutAmount)}</td>
                  <td>
                    <span className={styles.badgeTeal}>{p.payoutStatus || "PENDING"}</span>
                  </td>
                  <td>
                    <span className={styles.badgeTeal}>{p.policyDocumentStatus || "Pending"}</span>
                  </td>
                  <td>{p.policyRemark || "-"}</td>
                  <td>
                    <span className={styles.badgeAmber}>{p.reconcile || "No"}</span>
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

export default PolicyDashboard;
