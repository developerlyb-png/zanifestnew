"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import cs from "@/styles/components/superadminsidebar/Invoice.module.css";
import { FiSearch, FiArrowLeft, FiChevronRight } from "react-icons/fi";
import { invoiceStatusColor } from "@/constants/invoice";

interface InvoiceRow {
  _id: string;
  invoiceNo: string;
  invoiceDate: string;
  status: string;
  grandTotal: number;
  amountReceived?: number;
  balanceDue?: number;
  client: { clientId?: string; name: string; email?: string; phone?: string };
}

interface PartyAgg {
  key: string;
  name: string;
  email?: string;
  phone?: string;
  invoiceCount: number;
  totalInvoiced: number;
  totalReceived: number;
  balanceDue: number;
  invoices: InvoiceRow[];
}

const inr = (n?: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PartyLedger() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/invoices", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, []);

  const parties = useMemo(() => {
    const map = new Map<string, PartyAgg>();
    invoices.forEach((inv) => {
      const key = inv.client?.clientId || inv.client?.name || "unknown";
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: inv.client?.name || "—",
          email: inv.client?.email,
          phone: inv.client?.phone,
          invoiceCount: 0,
          totalInvoiced: 0,
          totalReceived: 0,
          balanceDue: 0,
          invoices: [],
        });
      }
      const p = map.get(key)!;
      p.invoiceCount += 1;
      p.totalInvoiced += inv.grandTotal || 0;
      p.totalReceived += inv.amountReceived || 0;
      p.balanceDue += inv.balanceDue ?? (inv.grandTotal || 0) - (inv.amountReceived || 0);
      p.invoices.push(inv);
    });
    return Array.from(map.values()).sort((a, b) => b.balanceDue - a.balanceDue);
  }, [invoices]);

  const filtered = useMemo(
    () => parties.filter((p) => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase())),
    [parties, search]
  );

  const totals = useMemo(
    () =>
      parties.reduce(
        (acc, p) => ({
          invoiced: acc.invoiced + p.totalInvoiced,
          received: acc.received + p.totalReceived,
          due: acc.due + p.balanceDue,
        }),
        { invoiced: 0, received: 0, due: 0 }
      ),
    [parties]
  );

  const active = parties.find((p) => p.key === activeKey) || null;

  if (loading) {
    return <p style={{ color: "#94a3b8", fontSize: 13.5 }}>Loading ledger...</p>;
  }

  if (active) {
    const sortedInvoices = [...active.invoices].sort(
      (a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
    );
    return (
      <div>
        <button
          type="button"
          onClick={() => setActiveKey(null)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#176eaa", fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 16, padding: 0 }}
        >
          <FiArrowLeft /> Back to all parties
        </button>

        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#142b4a" }}>{active.name}</h3>
        <p style={{ margin: "0 0 18px", fontSize: 12.5, color: "#718198" }}>
          {active.email || "—"} {active.phone ? `· ${active.phone}` : ""}
        </p>

        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#15803d", fontWeight: 700, textTransform: "uppercase" }}>Total Invoiced</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>{inr(active.totalInvoiced)}</div>
          </div>
          <div style={{ flex: "1 1 160px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 700, textTransform: "uppercase" }}>Received</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1d4ed8" }}>{inr(active.totalReceived)}</div>
          </div>
          <div style={{ flex: "1 1 160px", background: active.balanceDue > 0 ? "#fef2f2" : "#f8fafc", border: `1px solid ${active.balanceDue > 0 ? "#fecaca" : "#e2e8f0"}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: active.balanceDue > 0 ? "#b91c1c" : "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Balance Due</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: active.balanceDue > 0 ? "#b91c1c" : "#64748b" }}>{inr(active.balanceDue)}</div>
          </div>
        </div>

        <div className={`${styles.tableWrapper} ${cs.invoiceTableWrapper}`}>
          <table className={styles.table} style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Received</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map((inv) => {
                const c = invoiceStatusColor(inv.status);
                const balance = inv.balanceDue ?? (inv.grandTotal || 0) - (inv.amountReceived || 0);
                return (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNo}</td>
                    <td>{new Date(inv.invoiceDate).toLocaleDateString("en-GB")}</td>
                    <td>
                      <span className={cs.tablePill} style={{ background: c.bg, color: c.fg }}>
                        {inv.status}
                      </span>
                    </td>
                    <td>{inr(inv.grandTotal)}</td>
                    <td>{inr(inv.amountReceived)}</td>
                    <td style={{ fontWeight: 700, color: balance > 0 ? "#b91c1c" : "#15803d" }}>{inr(balance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 160px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "#15803d", fontWeight: 700, textTransform: "uppercase" }}>Total Invoiced</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>{inr(totals.invoiced)}</div>
        </div>
        <div style={{ flex: "1 1 160px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 700, textTransform: "uppercase" }}>Received</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1d4ed8" }}>{inr(totals.received)}</div>
        </div>
        <div style={{ flex: "1 1 160px", background: totals.due > 0 ? "#fef2f2" : "#f8fafc", border: `1px solid ${totals.due > 0 ? "#fecaca" : "#e2e8f0"}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: totals.due > 0 ? "#b91c1c" : "#64748b", fontWeight: 700, textTransform: "uppercase" }}>To Collect</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: totals.due > 0 ? "#b91c1c" : "#64748b" }}>{inr(totals.due)}</div>
        </div>
      </div>

      <div className={styles.searchInput} style={{ maxWidth: 320, marginBottom: 16 }}>
        <FiSearch size={12} />
        <input placeholder="Search party name" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className={`${styles.tableWrapper} ${cs.invoiceTableWrapper}`}>
        <table className={styles.table} style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th>Party Name</th>
              <th>Invoices</th>
              <th>Total Invoiced</th>
              <th>Received</th>
              <th>Balance Due</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  No parties found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.key} style={{ cursor: "pointer" }} onClick={() => setActiveKey(p.key)}>
                  <td style={{ fontWeight: 600, color: "#176eaa" }}>{p.name}</td>
                  <td>{p.invoiceCount}</td>
                  <td>{inr(p.totalInvoiced)}</td>
                  <td>{inr(p.totalReceived)}</td>
                  <td style={{ fontWeight: 700, color: p.balanceDue > 0 ? "#b91c1c" : "#15803d" }}>{inr(p.balanceDue)}</td>
                  <td>
                    <FiChevronRight color="#94a3b8" />
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
