"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/LineOfBusiness.module.css";
import { toast } from "react-hot-toast";
import { FiSearch, FiUploadCloud, FiPlus, FiX, FiEdit2, FiChevronDown, FiAlertCircle } from "react-icons/fi";
import { INSURANCE_COMPANIES } from "@/constants/policyFormOptions";

interface InsuranceCompanyItem {
  _id: string;
  name: string;
  branch: string;
  salesRmEmail?: string;
  salesRmPhone?: string;
  opsRmEmail: string;
  opsRmPhone: string;
  claimsRmEmail: string;
  claimsRmPhone: string;
  createdAt: string;
}

interface FormState {
  name: string;
  branch: string;
  salesRmEmail: string;
  salesRmPhone: string;
  opsRmEmail: string;
  opsRmPhone: string;
  claimsRmEmail: string;
  claimsRmPhone: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  branch: "",
  salesRmEmail: "",
  salesRmPhone: "",
  opsRmEmail: "",
  opsRmPhone: "",
  claimsRmEmail: "",
  claimsRmPhone: "",
};

const fmtDate = (d?: string) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(
    dt.getMinutes()
  )}:${pad(dt.getSeconds())}`;
};

function InsuranceCompanyForm({
  initial,
  isEdit,
  onClose,
  onSaved,
}: {
  initial?: InsuranceCompanyItem | null;
  isEdit: boolean;
  onClose: () => void;
  onSaved: (item: InsuranceCompanyItem) => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          name: initial.name,
          branch: initial.branch,
          salesRmEmail: initial.salesRmEmail || "",
          salesRmPhone: initial.salesRmPhone || "",
          opsRmEmail: initial.opsRmEmail,
          opsRmPhone: initial.opsRmPhone,
          claimsRmEmail: initial.claimsRmEmail,
          claimsRmPhone: initial.claimsRmPhone,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const fieldError = (key: keyof FormState, label: string) =>
    touched[key] && !form[key].trim() ? `${label} is required` : "";

  const nameError = fieldError("name", "Insurance company name");
  const branchError = fieldError("branch", "Insurance company branch");
  const opsEmailError = fieldError("opsRmEmail", "Operation RM email");
  const opsPhoneError = fieldError("opsRmPhone", "Operation RM phone number");
  const claimsEmailError = fieldError("claimsRmEmail", "Claims RM email");
  const claimsPhoneError = fieldError("claimsRmPhone", "Claims RM phone number");

  const REQUIRED: (keyof FormState)[] = ["name", "branch", "opsRmEmail", "opsRmPhone", "claimsRmEmail", "claimsRmPhone"];

  const handleSubmit = async () => {
    setTouched(REQUIRED.reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    if (REQUIRED.some((k) => !form[k].trim())) return;

    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config-insurance-companies", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: initial?._id, ...form }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Something went wrong");
        setSaving(false);
        return;
      }
      toast.success(isEdit ? "Insurance company updated" : "Insurance company created");
      onSaved(data.item);
    } catch (err) {
      console.error("Save insurance company failed", err);
      setError("Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? "Edit Insurance Company" : "Add New Insurance Company"}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FiX size={24} />
          </button>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Insurance Company Name<span className={styles.required}>*</span>
            </label>
            <div className={styles.selectWrap}>
              <select
                className={`${styles.select} ${nameError ? styles.inputError : ""}`}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => touch("name")}
              >
                <option value="">Select insurance company</option>
                {INSURANCE_COMPANIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <FiChevronDown className={styles.selectChevron} size={18} />
            </div>
            {nameError && (
              <span className={styles.fieldError}>
                <FiAlertCircle size={12} /> {nameError}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Insurance Company Branch<span className={styles.required}>*</span>
            </label>
            <input
              className={`${styles.input} ${branchError ? styles.inputError : ""}`}
              value={form.branch}
              onChange={(e) => set("branch", e.target.value)}
              onBlur={() => touch("branch")}
              placeholder="e.g. STAR-60"
            />
            {branchError && (
              <span className={styles.fieldError}>
                <FiAlertCircle size={12} /> {branchError}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Sales RM Email</label>
            <input
              className={styles.input}
              type="email"
              value={form.salesRmEmail}
              onChange={(e) => set("salesRmEmail", e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Sales RM Phone Number</label>
            <input
              className={styles.input}
              value={form.salesRmPhone}
              onChange={(e) => set("salesRmPhone", e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Operation RM Email<span className={styles.required}>*</span>
            </label>
            <input
              className={`${styles.input} ${opsEmailError ? styles.inputError : ""}`}
              type="email"
              value={form.opsRmEmail}
              onChange={(e) => set("opsRmEmail", e.target.value)}
              onBlur={() => touch("opsRmEmail")}
            />
            {opsEmailError && (
              <span className={styles.fieldError}>
                <FiAlertCircle size={12} /> {opsEmailError}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Operation RM Phone Number<span className={styles.required}>*</span>
            </label>
            <input
              className={`${styles.input} ${opsPhoneError ? styles.inputError : ""}`}
              value={form.opsRmPhone}
              onChange={(e) => set("opsRmPhone", e.target.value)}
              onBlur={() => touch("opsRmPhone")}
            />
            {opsPhoneError && (
              <span className={styles.fieldError}>
                <FiAlertCircle size={12} /> {opsPhoneError}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Claims RM Email<span className={styles.required}>*</span>
            </label>
            <input
              className={`${styles.input} ${claimsEmailError ? styles.inputError : ""}`}
              type="email"
              value={form.claimsRmEmail}
              onChange={(e) => set("claimsRmEmail", e.target.value)}
              onBlur={() => touch("claimsRmEmail")}
            />
            {claimsEmailError && (
              <span className={styles.fieldError}>
                <FiAlertCircle size={12} /> {claimsEmailError}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Claims RM Phone Number<span className={styles.required}>*</span>
            </label>
            <input
              className={`${styles.input} ${claimsPhoneError ? styles.inputError : ""}`}
              value={form.claimsRmPhone}
              onChange={(e) => set("claimsRmPhone", e.target.value)}
              onBlur={() => touch("claimsRmPhone")}
            />
            {claimsPhoneError && (
              <span className={styles.fieldError}>
                <FiAlertCircle size={12} /> {claimsPhoneError}
              </span>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={`${styles.btn} ${styles.btnPrimary} ${styles.createBtn}`}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : isEdit ? "Save" : "Create Insurance Company"}
          </button>
          <button
            className={`${styles.btn} ${styles.btnOutline} ${styles.cancelBtn}`}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InsuranceCompanyConfig() {
  const [items, setItems] = useState<InsuranceCompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InsuranceCompanyItem | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config-insurance-companies", { credentials: "include" });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load insurance companies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) => it.name.toLowerCase().includes(q) || it.branch.toLowerCase().includes(q)
    );
  }, [items, search]);

  const rmLines = (email?: string, phone?: string) => (
    <>
      <div>
        Email: <b>{email || "—"}</b>
      </div>
      <div>
        Phone: <b>{phone || "—"}</b>
      </div>
    </>
  );

  return (
    <div>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search insurance company by name or branch..."
        />
        <button className={`${styles.btn} ${styles.btnPrimary}`} type="button">
          <FiSearch size={15} /> Search
        </button>
        <div className={styles.toolbarSpacer} />
        <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => toast("Bulk upload is coming soon.")}>
          <FiUploadCloud size={15} /> Bulk Upload
        </button>
        <button
          className={`${styles.btn} ${styles.btnTeal}`}
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
        >
          <FiPlus size={15} /> Add New
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Sales RM Detail</th>
                <th>Ops RM Detail</th>
                <th>Claims RM Detail</th>
                <th>Created On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    No insurance companies found.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
                  <tr key={it._id}>
                    <td className={styles.nameCell}>
                      <div>Name: {it.name}</div>
                      <div>Branch: {it.branch}</div>
                    </td>
                    <td>{rmLines(it.salesRmEmail, it.salesRmPhone)}</td>
                    <td>{rmLines(it.opsRmEmail, it.opsRmPhone)}</td>
                    <td>{rmLines(it.claimsRmEmail, it.claimsRmPhone)}</td>
                    <td>{fmtDate(it.createdAt)}</td>
                    <td>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <InsuranceCompanyForm
          initial={editingItem}
          isEdit={!!editingItem}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}
