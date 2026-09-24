"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import { FiPercent, FiX } from "react-icons/fi";

interface CommissionRuleRow {
  _id: string;
  scopeType: "ALL_PRODUCTS" | "PRODUCT";
  scopeValue: string | null;
  ratePercent: number;
  active: boolean;
  createdBy?: string;
  updatedAt?: string;
}

const scopeLabel = (r: CommissionRuleRow) =>
  r.scopeType === "ALL_PRODUCTS" ? "All Products" : r.scopeValue || "—";

export default function PayInPayOut() {
  const [rules, setRules] = useState<CommissionRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Which form is open — the scope it creates/updates a rule for. null = closed.
  const [openForm, setOpenForm] = useState<"ALL_PRODUCTS" | "PRODUCT" | null>(null);
  const [rateInput, setRateInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRules = () => {
    setLoading(true);
    fetch("/api/admin/commission-rules", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setRules(data.rules || []))
      .catch((err) => console.error("Failed to load commission rules", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const openRuleForm = (scopeType: "ALL_PRODUCTS" | "PRODUCT") => {
    const existing = rules.find(
      (r) => r.scopeType === scopeType && (scopeType === "ALL_PRODUCTS" || r.scopeValue === "Motor")
    );
    setRateInput(existing ? String(existing.ratePercent) : "");
    setOpenForm(scopeType);
  };

  const saveRule = async () => {
    const rate = Number(rateInput);
    if (!rateInput || Number.isNaN(rate) || rate < 0 || rate > 100) {
      alert("Enter a valid rate between 0 and 100");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/commission-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scopeType: openForm,
          scopeValue: openForm === "PRODUCT" ? "Motor" : undefined,
          ratePercent: rate,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Failed to save rule");
        return;
      }
      setOpenForm(null);
      setRateInput("");
      fetchRules();
    } catch (err) {
      console.error("Failed to save commission rule", err);
      alert("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Pay In Pay Out</h2>
        <div className={styles.headerActions}>
          <button className={styles.primaryBtn} onClick={() => openRuleForm("ALL_PRODUCTS")}>
            <FiPercent /> Create Rule for All Products
          </button>
          <button className={styles.primaryBtn} onClick={() => openRuleForm("PRODUCT")}>
            <FiPercent /> Create Rule for Motor
          </button>
        </div>
      </div>

      {openForm && (
        <div className={styles.card} style={{ padding: 20, marginBottom: 20, maxWidth: 420 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <strong style={{ fontSize: 14 }}>
              Commission Rate — {openForm === "ALL_PRODUCTS" ? "All Products" : "Motor"}
            </strong>
            <button
              type="button"
              onClick={() => setOpenForm(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}
            >
              <FiX />
            </button>
          </div>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
            Rate (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            className={styles.selectInput}
            style={{ width: "100%", marginBottom: 14 }}
            placeholder="e.g. 15"
          />
          <button className={styles.exportSolidBtn} onClick={saveRule} disabled={saving}>
            {saving ? "Saving..." : "Save Rule"}
          </button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table} style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th>Scope</th>
              <th>Rate</th>
              <th>Status</th>
              <th>Last Updated By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.emptyCell} colSpan={4}>
                  Loading...
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={4}>
                  No commission rules created yet.
                </td>
              </tr>
            ) : (
              rules.map((r) => (
                <tr key={r._id}>
                  <td>{scopeLabel(r)}</td>
                  <td>{r.ratePercent}%</td>
                  <td>
                    <span className={r.active ? styles.badgeTeal : styles.badgeAmber}>
                      {r.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td>{r.createdBy || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
