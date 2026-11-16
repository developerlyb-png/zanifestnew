"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import cs from "@/styles/components/superadminsidebar/Invoice.module.css";
import { FiSearch, FiCalendar, FiClock } from "react-icons/fi";

interface AuditLogRow {
  _id: string;
  entityType: "Invoice" | "InvoiceClient" | "InvoiceItem";
  entityLabel: string;
  action: string;
  summary: string;
  performedBy: string;
  createdAt: string;
}

type Preset = "today" | "thisMonth" | "lastMonth" | "thisYear" | "lastYear" | "all" | "custom";

function presetRange(preset: Preset): { from?: Date; to?: Date } {
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
    case "thisYear":
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfToday };
    case "lastYear":
      return { from: new Date(now.getFullYear() - 1, 0, 1), to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59) };
    case "all":
    default:
      return {};
  }
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "thisYear", label: "This Year" },
  { key: "lastYear", label: "Last Year" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom Range" },
];

const ENTITY_FILTERS = [
  { key: "all", label: "All" },
  { key: "Invoice", label: "Invoices" },
  { key: "InvoiceClient", label: "Clients" },
  { key: "InvoiceItem", label: "Items" },
];

const ACTION_COLORS: Record<string, { bg: string; fg: string }> = {
  created: { bg: "#dcfce7", fg: "#15803d" },
  updated: { bg: "#dbeafe", fg: "#1d4ed8" },
  deleted: { bg: "#fee2e2", fg: "#b91c1c" },
  status_changed: { bg: "#ede9fe", fg: "#6d28d9" },
  payment_added: { bg: "#dcfce7", fg: "#15803d" },
  payment_removed: { bg: "#fef3c7", fg: "#b45309" },
  signed_pdf_uploaded: { bg: "#ccfbf1", fg: "#0f766e" },
  email_sent: { bg: "#e0e7ff", fg: "#4338ca" },
};
const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  status_changed: "Status Changed",
  payment_added: "Payment Added",
  payment_removed: "Payment Removed",
  signed_pdf_uploaded: "Signed PDF Uploaded",
  email_sent: "Email Sent",
};

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function InvoiceAuditTrail() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<Preset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [search, setSearch] = useState("");

  const range = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { from: new Date(customFrom), to: new Date(`${customTo}T23:59:59`) };
    }
    return presetRange(preset);
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from.toISOString());
    if (range.to) params.set("to", range.to.toISOString());
    if (entityFilter !== "all") params.set("entityType", entityFilter);
    if (search.trim()) params.set("q", search.trim());

    const t = setTimeout(() => {
      fetch(`/api/admin/invoice-audit-log?${params.toString()}`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setLogs(d.logs || []))
        .catch(() => setLogs([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [range, entityFilter, search]);

  return (
    <div className={`${styles.cont} ${cs.invoiceWorkspace}`}>
      <div className={styles.headerRow}>
        <h2 className={`${styles.heading} ${cs.invoiceHeading}`}>Audit Trail</h2>
      </div>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>
        Every create, edit and delete across Invoices, Clients and the Item Catalog — who did it and when.
      </p>

      <div className={`${styles.filterRow} ${cs.invoiceFilters}`} style={{ flexWrap: "wrap" }}>
        <div className={`${styles.presets} ${cs.invoicePresetGroup}`}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              className={`${styles.presetBtn} ${cs.invoiceDateBtn} ${preset === p.key ? `${styles.presetBtnActive} ${cs.invoiceDateBtnActive}` : ""}`}
              onClick={() => setPreset(p.key)}
            >
              {p.key === "custom" && <FiCalendar style={{ marginRight: 6 }} />}
              {p.label}
            </button>
          ))}
          {preset === "custom" && (
            <>
              <input type="date" className={`${styles.dateInput} ${cs.invoiceDateInput}`} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <input type="date" className={`${styles.dateInput} ${cs.invoiceDateInput}`} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "14px 0 16px" }}>
        <div className={styles.searchInput} style={{ maxWidth: 320 }}>
          <FiSearch size={12} />
          <input placeholder="Search by name, invoice no. or user" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          className={styles.selectInput}
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          style={{ minWidth: 140 }}
        >
          {ENTITY_FILTERS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className={`${styles.tableWrapper} ${cs.invoiceTableWrapper}`}>
        <table className={styles.table} style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Entity</th>
              <th>Action</th>
              <th>Details</th>
              <th>Performed By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  Loading audit trail...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  No activity found for this filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const color = ACTION_COLORS[log.action] || { bg: "#f3f4f6", fg: "#374151" };
                return (
                  <tr key={log._id}>
                    <td style={{ whiteSpace: "nowrap", color: "#6b7280", fontSize: 12.5 }}>
                      <FiClock size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                      {fmtDateTime(log.createdAt)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.entityLabel}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{log.entityType}</div>
                    </td>
                    <td>
                      <span className={cs.tablePill} style={{ background: color.bg, color: color.fg }}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{log.summary}</td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{log.performedBy}</td>
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
