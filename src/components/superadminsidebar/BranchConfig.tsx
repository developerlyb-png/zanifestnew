"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/LineOfBusiness.module.css";
import { toast } from "react-hot-toast";
import { FiSearch, FiUploadCloud, FiPlus, FiX, FiEdit2, FiAlertCircle } from "react-icons/fi";

interface BranchItem {
  _id: string;
  name: string;
  code: string;
  active: boolean;
}

interface FormState {
  name: string;
  code: string;
  active: boolean;
}

const EMPTY_FORM: FormState = { name: "", code: "", active: true };

function BranchForm({
  initial,
  isEdit,
  onClose,
  onSaved,
}: {
  initial?: BranchItem | null;
  isEdit: boolean;
  onClose: () => void;
  onSaved: (item: BranchItem) => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial ? { name: initial.name, code: initial.code, active: initial.active } : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);

  const nameError = nameTouched && !form.name.trim() ? "Branch name is required" : "";
  const codeError = codeTouched && !form.code.trim() ? "Branch code is required" : "";

  const handleSubmit = async () => {
    setNameTouched(true);
    setCodeTouched(true);
    if (!form.name.trim() || !form.code.trim()) return;

    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config-branches", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: initial?._id,
          name: form.name.trim(),
          code: form.code.trim(),
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Something went wrong");
        setSaving(false);
        return;
      }
      toast.success(isEdit ? "Branch updated" : "Branch created");
      onSaved(data.item);
    } catch (err) {
      console.error("Save branch failed", err);
      setError("Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? "Edit Branch" : "Add Branch"}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FiX size={24} />
          </button>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Branch Name<span className={styles.required}>*</span>
            </label>
            <input
              className={`${styles.input} ${nameError ? styles.inputError : ""}`}
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onBlur={() => setNameTouched(true)}
              placeholder="e.g. Zirakpur"
            />
            {nameError && (
              <span className={styles.fieldError}>
                <FiAlertCircle size={12} /> {nameError}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Branch Code<span className={styles.required}>*</span>
            </label>
            <input
              className={`${styles.input} ${codeError ? styles.inputError : ""}`}
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              onBlur={() => setCodeTouched(true)}
              placeholder="e.g. CH1"
            />
            {codeError && (
              <span className={styles.fieldError}>
                <FiAlertCircle size={12} /> {codeError}
              </span>
            )}
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active
            </label>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={`${styles.btn} ${styles.btnPrimary} ${styles.createBtn}`}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : isEdit ? "Save" : "Create"}
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

export default function BranchConfig() {
  const [items, setItems] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BranchItem | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config-branches", { credentials: "include" });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load branches", err);
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
    return items.filter((it) => it.name.toLowerCase().includes(q) || (it.code || "").toLowerCase().includes(q));
  }, [items, search]);

  const visible = filtered.slice(0, rowsPerPage);

  const toggleActive = async (it: BranchItem) => {
    const next = !it.active;
    setItems((prev) => prev.map((b) => (b._id === it._id ? { ...b, active: next } : b)));
    try {
      const res = await fetch("/api/admin/config-branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: it._id, active: next }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (err: any) {
      setItems((prev) => prev.map((b) => (b._id === it._id ? { ...b, active: it.active } : b)));
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search branch by name or code..."
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
                <th>Code</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className={styles.emptyRow}>
                    Loading...
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyRow}>
                    No branches found.
                  </td>
                </tr>
              ) : (
                visible.map((it) => (
                  <tr key={it._id}>
                    <td className={styles.nameCell}>{it.name}</td>
                    <td className={styles.codeCell}>{it.code || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.toggle} ${it.active ? styles.toggleOn : ""}`}
                        onClick={() => toggleActive(it)}
                        aria-label={it.active ? "Deactivate" : "Activate"}
                        aria-pressed={it.active}
                      >
                        <span className={styles.toggleKnob} />
                      </button>
                    </td>
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

        <div className={styles.tableFooter}>
          <span>Rows per page:</span>
          <select
            className={styles.rowsPerPageSelect}
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <BranchForm
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
