"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import cs from "@/styles/components/superadminsidebar/Invoice.module.css";
import {
  FiDownload,
  FiSearch,
  FiColumns,
  FiCalendar,
  FiPlus,
  FiFileText,
  FiCheckCircle,
  FiSend,
  FiEdit3,
  FiXCircle,
} from "react-icons/fi";
import CreateInvoice from "./CreateInvoice";
import InvoiceDetailView from "./InvoiceDetailView";
import { INVOICE_STATUSES, invoiceStatusColor } from "@/constants/invoice";

interface InvoiceRow {
  _id: string;
  invoiceNo: string;
  invoiceDate: string;
  status: string;
  taxMode: string;
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  createdBy?: string;
  client: { name: string; email?: string };
}

type Preset = "today" | "thisMonth" | "lastMonth" | "thisYear" | "lastYear" | "custom";

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const inr = (n?: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

type ColumnKey = "invoiceNo" | "invoiceDate" | "billTo" | "amount" | "gst" | "total" | "status" | "sentInfo" | "createdBy";

const COLUMNS: { key: ColumnKey; label: string; defaultOn: boolean }[] = [
  { key: "invoiceNo", label: "Invoice No.", defaultOn: true },
  { key: "invoiceDate", label: "Date", defaultOn: true },
  { key: "billTo", label: "Bill To", defaultOn: true },
  { key: "amount", label: "Amount", defaultOn: true },
  { key: "gst", label: "GST", defaultOn: true },
  { key: "total", label: "Total Amount", defaultOn: true },
  { key: "status", label: "Status", defaultOn: true },
  { key: "sentInfo", label: "Sent Info", defaultOn: false },
  { key: "createdBy", label: "Created By", defaultOn: false },
];

const DEFAULT_VISIBLE = COLUMNS.reduce((acc, c) => {
  acc[c.key] = c.defaultOn;
  return acc;
}, {} as Record<ColumnKey, boolean>);

const STAT_DEFS = [
  { key: "Draft", label: "Draft", icon: <FiEdit3 />, tone: cs.toneDraft },
  { key: "Issued", label: "Issued", icon: <FiFileText />, tone: cs.toneIssued },
  { key: "Sent", label: "Sent", icon: <FiSend />, tone: cs.toneSent },
  { key: "Signed", label: "Signed", icon: <FiCheckCircle />, tone: cs.toneSigned },
  { key: "Cancelled", label: "Cancelled", icon: <FiXCircle />, tone: cs.toneCancelled },
];

export default function Invoice() {
  const [view, setView] = useState<"list" | "create" | "edit" | "detail">("list");
  const [activeId, setActiveId] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [preset, setPreset] = useState<Preset>("thisYear");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [noSearch, setNoSearch] = useState("");
  const [billToSearch, setBillToSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");

  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    if (view !== "list") return;
    setLoading(true);
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() });
    fetch(`/api/admin/invoices?${params.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [range, refreshKey, view]);

  const filtered = useMemo(
    () =>
      invoices.filter((inv) => {
        if (noSearch && !inv.invoiceNo.toLowerCase().includes(noSearch.toLowerCase())) return false;
        if (billToSearch && !inv.client?.name?.toLowerCase().includes(billToSearch.toLowerCase())) return false;
        if (statusSearch && inv.status !== statusSearch) return false;
        return true;
      }),
    [invoices, noSearch, billToSearch, statusSearch]
  );

  const visible = filtered.slice(0, rowsPerPage);
  const visibleCount = COLUMNS.filter((c) => visibleColumns[c.key]).length;

  const counts = useMemo(() => {
    const c: Record<string, number> = { Draft: 0, Issued: 0, Sent: 0, Signed: 0, Cancelled: 0 };
    invoices.forEach((inv) => {
      if (c[inv.status] !== undefined) c[inv.status] += 1;
    });
    return c;
  }, [invoices]);

  const exportCsv = () => {
    const cols = COLUMNS.filter((c) => visibleColumns[c.key]);
    const rows = filtered.map((inv) =>
      cols.map((col) => {
        switch (col.key) {
          case "invoiceNo":
            return inv.invoiceNo;
          case "invoiceDate":
            return new Date(inv.invoiceDate).toLocaleDateString("en-GB");
          case "billTo":
            return inv.client?.name || "";
          case "amount":
            return inv.subtotal;
          case "gst":
            return inv.totalTax;
          case "total":
            return inv.grandTotal;
          case "status":
            return inv.status;
          case "sentInfo":
            return inv.status === "Sent" || inv.status === "Signed" ? inv.client?.email || "" : "";
          case "createdBy":
            return inv.createdBy || "";
          default:
            return "";
        }
      })
    );
    const csvText = [cols.map((c) => c.label), ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csvText], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${fmtDate(range.from).replace(/\//g, "-")}_to_${fmtDate(range.to).replace(/\//g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (view === "create") {
    return (
      <div className={styles.cont}>
        <CreateInvoice
          onCancel={() => setView("list")}
          onCreated={(id) => {
            setView("detail");
            setActiveId(id);
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (view === "edit" && activeId) {
    return (
      <div className={styles.cont}>
        <CreateInvoice
          editInvoiceId={activeId}
          onCancel={() => setView("detail")}
          onCreated={(id) => {
            setView("detail");
            setActiveId(id);
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (view === "detail" && activeId) {
    return (
      <div className={styles.cont}>
        <InvoiceDetailView
          invoiceId={activeId}
          onBack={() => {
            setView("list");
            setRefreshKey((k) => k + 1);
          }}
          onEdit={() => setView("edit")}
        />
      </div>
    );
  }

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Invoices</h2>
        <div className={styles.headerActions}>
          <button className={styles.primaryBtn} onClick={() => setView("create")}>
            <FiPlus /> New Invoice
          </button>
        </div>
      </div>

      <div className={cs.statRow}>
        {STAT_DEFS.map((s) => (
          <div key={s.key} className={`${cs.statCard} ${s.tone}`}>
            <div className={cs.statTop}>
              <div className={cs.statIcon}>{s.icon}</div>
            </div>
            <div>
              <div className={cs.statValue}>{counts[s.key] ?? 0}</div>
              <div className={cs.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
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
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
        Showing data from <b style={{ color: "#111827" }}>{fmtDate(range.from)}</b> to{" "}
        <b style={{ color: "#111827" }}>{fmtDate(range.to)}</b>
      </p>

      <div className={styles.tableWrapper}>
        <table className={styles.table} style={{ minWidth: 1200 }}>
          <thead>
            <tr>
              {COLUMNS.filter((c) => visibleColumns[c.key]).map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th>Actions</th>
            </tr>
            <tr className={styles.filterHeaderRow}>
              {visibleColumns.invoiceNo && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search invoice no." value={noSearch} onChange={(e) => setNoSearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.invoiceDate && <td className={styles.dashCell}>—</td>}
              {visibleColumns.billTo && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search bill to" value={billToSearch} onChange={(e) => setBillToSearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.amount && <td className={styles.dashCell}>—</td>}
              {visibleColumns.gst && <td className={styles.dashCell}>—</td>}
              {visibleColumns.total && <td className={styles.dashCell}>—</td>}
              {visibleColumns.status && (
                <td>
                  <select className={styles.selectInput} value={statusSearch} onChange={(e) => setStatusSearch(e.target.value)}>
                    <option value="">All</option>
                    {INVOICE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              )}
              {visibleColumns.sentInfo && <td className={styles.dashCell}>—</td>}
              {visibleColumns.createdBy && <td className={styles.dashCell}>—</td>}
              <td className={styles.dashCell}>—</td>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleCount + 1} className={styles.emptyCell}>
                  Loading invoices...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={visibleCount + 1} className={styles.emptyCell}>
                  No invoices found.
                </td>
              </tr>
            ) : (
              visible.map((inv) => (
                <tr key={inv._id}>
                  {visibleColumns.invoiceNo && (
                    <td>
                      <button
                        type="button"
                        className={cs.invoiceNoLink}
                        onClick={() => {
                          setActiveId(inv._id);
                          setView("detail");
                        }}
                      >
                        {inv.invoiceNo}
                      </button>
                    </td>
                  )}
                  {visibleColumns.invoiceDate && <td>{new Date(inv.invoiceDate).toLocaleDateString("en-GB")}</td>}
                  {visibleColumns.billTo && <td>{inv.client?.name}</td>}
                  {visibleColumns.amount && <td>{inr(inv.subtotal)}</td>}
                  {visibleColumns.gst && <td>{inr(inv.totalTax)}</td>}
                  {visibleColumns.total && <td>{inr(inv.grandTotal)}</td>}
                  {visibleColumns.status && (
                    <td>
                      {(() => {
                        const c = invoiceStatusColor(inv.status);
                        return (
                          <span className={cs.tablePill} style={{ background: c.bg, color: c.fg }}>
                            {inv.status}
                          </span>
                        );
                      })()}
                    </td>
                  )}
                  {visibleColumns.sentInfo && <td>{inv.status === "Sent" || inv.status === "Signed" ? inv.client?.email || "—" : "—"}</td>}
                  {visibleColumns.createdBy && <td>{inv.createdBy || "—"}</td>}
                  <td>
                    <button
                      type="button"
                      className={cs.viewLink}
                      onClick={() => {
                        setActiveId(inv._id);
                        setView("detail");
                      }}
                    >
                      View
                    </button>
                  </td>
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
