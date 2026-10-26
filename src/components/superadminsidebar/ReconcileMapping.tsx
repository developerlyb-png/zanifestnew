"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/LineOfBusiness.module.css";
import { toast } from "react-hot-toast";
import { FiSearch, FiPlus, FiX, FiEdit2, FiChevronDown, FiAlertCircle, FiTrash2 } from "react-icons/fi";

interface CompanyOption {
  _id: string;
  name: string;
  branch: string;
}

interface MappingItem {
  _id: string;
  insuranceCompanyConfig: string;
  insurerName: string;
  insurerBranch: string;
  fieldMap: {
    policyNo: string;
    insuredName: string;
    premium: string;
    commissionAmount: string;
    commissionPercentage: string;
    basicPremiumAmount: string;
    odPremiumAmount: string;
    tpPremiumAmount: string;
    terrorismPremiumAmount: string;
  };
  createdAt: string;
}

const EMPTY_FIELD_MAP = {
  policyNo: "",
  insuredName: "",
  premium: "",
  commissionAmount: "",
  commissionPercentage: "",
  basicPremiumAmount: "",
  odPremiumAmount: "",
  tpPremiumAmount: "",
  terrorismPremiumAmount: "",
};

function MappingForm({
  initial,
  isEdit,
  companies,
  onClose,
  onSaved,
}: {
  initial?: MappingItem | null;
  isEdit: boolean;
  companies: CompanyOption[];
  onClose: () => void;
  onSaved: (item: MappingItem) => void;
}) {
  const [companyId, setCompanyId] = useState(initial?.insuranceCompanyConfig || "");
  const [fieldMap, setFieldMap] = useState(initial?.fieldMap || EMPTY_FIELD_MAP);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = (k: keyof typeof fieldMap, v: string) => setFieldMap((f) => ({ ...f, [k]: v }));
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const companyError = touched.company && !companyId ? "Insurance company is required" : "";
  const policyNoError = touched.policyNo && !fieldMap.policyNo.trim() ? "Policy No. column is required" : "";

  const handleSubmit = async () => {
    setTouched({ company: true, policyNo: true });
    if (!companyId || !fieldMap.policyNo.trim()) return;

    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/reconcile-mapping", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: initial?._id, insuranceCompanyConfigId: companyId, fieldMap }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Something went wrong");
        setSaving(false);
        return;
      }
      toast.success(isEdit ? "Mapping updated" : "Mapping created");
      onSaved(data.item);
    } catch (err) {
      console.error("Save reconcile mapping failed", err);
      setError("Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? "Edit Reconcile Mapping" : "Add Reconcile Mapping"}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FiX size={24} />
          </button>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.formGrid}>
          <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
            <label className={styles.fieldLabel}>
              Insurance Company<span className={styles.required}>*</span>
            </label>
            <div className={styles.selectWrap}>
              <select
                className={`${styles.select} ${companyError ? styles.inputError : ""}`}
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                onBlur={() => touch("company")}
                disabled={isEdit}
              >
                <option value="">Select insurance company</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.branch})
                  </option>
                ))}
              </select>
              <FiChevronDown className={styles.selectChevron} size={18} />
            </div>
            {companyError && (
              <span className={styles.fieldError}>
                <FiAlertCircle size={12} /> {companyError}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Policy No. column<span className={styles.required}>*</span>
            </label>
            <input
              className={`${styles.input} ${policyNoError ? styles.inputError : ""}`}
              value={fieldMap.policyNo}
              onChange={(e) => set("policyNo", e.target.value)}
              onBlur={() => touch("policyNo")}
              placeholder="e.g. Policy Number"
            />
            {policyNoError && (
              <span className={styles.fieldError}>
                <FiAlertCircle size={12} /> {policyNoError}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Premium column</label>
            <input
              className={styles.input}
              value={fieldMap.premium}
              onChange={(e) => set("premium", e.target.value)}
              placeholder="e.g. Premium Amount"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Commission Amount column</label>
            <input
              className={styles.input}
              value={fieldMap.commissionAmount}
              onChange={(e) => set("commissionAmount", e.target.value)}
              placeholder="e.g. Commission Amt"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Commission Percentage column</label>
            <input
              className={styles.input}
              value={fieldMap.commissionPercentage}
              onChange={(e) => set("commissionPercentage", e.target.value)}
              placeholder="e.g. Comm %"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Insured Name column</label>
            <input
              className={styles.input}
              value={fieldMap.insuredName}
              onChange={(e) => set("insuredName", e.target.value)}
              placeholder="e.g. Customer Name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Basic Premium Amount column</label>
            <input
              className={styles.input}
              value={fieldMap.basicPremiumAmount}
              onChange={(e) => set("basicPremiumAmount", e.target.value)}
              placeholder="e.g. Basic Premium"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>OD Premium Amount column</label>
            <input
              className={styles.input}
              value={fieldMap.odPremiumAmount}
              onChange={(e) => set("odPremiumAmount", e.target.value)}
              placeholder="e.g. OD Premium"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>TP Premium Amount column</label>
            <input
              className={styles.input}
              value={fieldMap.tpPremiumAmount}
              onChange={(e) => set("tpPremiumAmount", e.target.value)}
              placeholder="e.g. TP Premium"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Terrorism Premium Amount column</label>
            <input
              className={styles.input}
              value={fieldMap.terrorismPremiumAmount}
              onChange={(e) => set("terrorismPremiumAmount", e.target.value)}
              placeholder="e.g. Terrorism Premium"
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={`${styles.btn} ${styles.btnPrimary} ${styles.createBtn}`} onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save" : "Create Mapping"}
          </button>
          <button className={`${styles.btn} ${styles.btnOutline} ${styles.cancelBtn}`} onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReconcileMapping() {
  const [items, setItems] = useState<MappingItem[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MappingItem | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mappingRes, companyRes] = await Promise.all([
        fetch("/api/admin/reconcile-mapping", { credentials: "include" }),
        fetch("/api/admin/config-insurance-companies", { credentials: "include" }),
      ]);
      const mappingData = await mappingRes.json();
      const companyData = await companyRes.json();
      setItems(mappingData.items || []);
      setCompanies(companyData.items || []);
    } catch (err) {
      console.error("Failed to load reconcile mappings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const mappedCompanyIds = useMemo(() => new Set(items.map((i) => i.insuranceCompanyConfig)), [items]);
  const unmappedCompanies = useMemo(
    () => companies.filter((c) => !mappedCompanyIds.has(c._id)),
    [companies, mappedCompanyIds]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.insurerName.toLowerCase().includes(q) || it.insurerBranch.toLowerCase().includes(q));
  }, [items, search]);

  const handleDelete = async (item: MappingItem) => {
    if (!window.confirm(`Delete the reconcile mapping for ${item.insurerName}?`)) return;
    try {
      const res = await fetch("/api/admin/reconcile-mapping", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: item._id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Mapping deleted");
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete mapping");
    }
  };

  return (
    <div>
      <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 14px" }}>
        Maps each insurer's commission-statement spreadsheet column headers to the standard fields used by Reconcile.
        An insurer with no mapping here can't be reconciled yet.
      </p>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by insurer name or branch..."
        />
        <button className={`${styles.btn} ${styles.btnPrimary}`} type="button">
          <FiSearch size={15} /> Search
        </button>
        <div className={styles.toolbarSpacer} />
        <button
          className={`${styles.btn} ${styles.btnTeal}`}
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          disabled={unmappedCompanies.length === 0 && !loading}
          title={unmappedCompanies.length === 0 ? "Every configured insurance company already has a mapping" : ""}
        >
          <FiPlus size={15} /> Add Mapping
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Insurer</th>
                <th>Policy No.</th>
                <th>Premium</th>
                <th>Commission Amount</th>
                <th>Commission %</th>
                <th>Insured Name</th>
                <th>Premium Breakdown</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={styles.emptyRow}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyRow}>
                    No reconcile mappings configured yet.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => {
                  const breakdown = [
                    it.fieldMap.basicPremiumAmount && `Basic: ${it.fieldMap.basicPremiumAmount}`,
                    it.fieldMap.odPremiumAmount && `OD: ${it.fieldMap.odPremiumAmount}`,
                    it.fieldMap.tpPremiumAmount && `TP: ${it.fieldMap.tpPremiumAmount}`,
                    it.fieldMap.terrorismPremiumAmount && `Terrorism: ${it.fieldMap.terrorismPremiumAmount}`,
                  ].filter(Boolean);
                  return (
                  <tr key={it._id}>
                    <td className={styles.nameCell}>
                      <div>{it.insurerName}</div>
                      <div>Branch: {it.insurerBranch}</div>
                    </td>
                    <td>{it.fieldMap.policyNo}</td>
                    <td>{it.fieldMap.premium || "—"}</td>
                    <td>{it.fieldMap.commissionAmount || "—"}</td>
                    <td>{it.fieldMap.commissionPercentage || "—"}</td>
                    <td>{it.fieldMap.insuredName || "—"}</td>
                    <td style={{ whiteSpace: "normal", minWidth: 160 }}>
                      {breakdown.length === 0 ? "—" : breakdown.join(", ")}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className={styles.editBtn}
                          onClick={() => {
                            setEditingItem(it);
                            setShowForm(true);
                          }}
                          aria-label="Edit"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleDelete(it)}
                          aria-label="Delete"
                          style={{ color: "#dc2626" }}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <MappingForm
          initial={editingItem}
          isEdit={!!editingItem}
          companies={editingItem ? companies : unmappedCompanies}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}
