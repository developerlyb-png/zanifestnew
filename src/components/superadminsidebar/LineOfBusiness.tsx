"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/LineOfBusiness.module.css";
import {
  FiSearch,
  FiUploadCloud,
  FiPlus,
  FiX,
  FiEdit2,
  FiChevronDown,
} from "react-icons/fi";

const SEGMENTS = ["Corporate", "Retail", "Rural"] as const;
const IRDAI_GROUPS = [
  "General Insurance",
  "Health Insurance",
  "Life Insurance",
  "Reinsurance",
] as const;

interface LobItem {
  _id: string;
  name: string;
  code: string;
  segment: string;
  irdaiGroup: string;
  irdaiType: string;
  description?: string;
}

interface FormState {
  segment: string;
  name: string;
  description: string;
  irdaiGroup: string;
}

const EMPTY_FORM: FormState = {
  segment: SEGMENTS[0],
  name: "",
  description: "",
  irdaiGroup: "",
};

function deriveType(irdaiGroup: string) {
  if (!irdaiGroup) return "";
  return irdaiGroup === "Life Insurance" ? "LI" : "GI";
}

function LineOfBusinessForm({
  initial,
  isEdit,
  onClose,
  onSaved,
}: {
  initial?: LobItem | null;
  isEdit: boolean;
  onClose: () => void;
  onSaved: (item: LobItem) => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          segment: initial.segment,
          name: initial.name,
          description: initial.description || "",
          irdaiGroup: initial.irdaiGroup,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const codePreview = useMemo(() => {
    if (isEdit && initial) return initial.code;
    if (!form.name.trim() || !form.segment) return "";
    const slug = form.name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return `${slug}_${form.segment.toUpperCase()}`;
  }, [form.name, form.segment, isEdit, initial]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!form.irdaiGroup) {
      setError("IRDAI Group is required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/line-of-business", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: initial?._id,
          name: form.name.trim(),
          segment: form.segment,
          irdaiGroup: form.irdaiGroup,
          description: form.description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Something went wrong");
        setSaving(false);
        return;
      }
      onSaved(data.item);
    } catch (err) {
      console.error("Save line of business failed", err);
      setError("Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isEdit ? "Edit Line of Business" : "Add Line of Business"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FiX size={24} />
          </button>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Business Segment<span className={styles.required}>*</span>
            </label>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={form.segment}
                onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
              >
                {SEGMENTS.map((seg) => (
                  <option key={seg} value={seg}>
                    {seg}
                  </option>
                ))}
              </select>
              <FiChevronDown className={styles.selectChevron} size={18} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Name<span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Travel"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Code (Auto-generated)</label>
            <input
              className={`${styles.input} ${styles.inputDisabled}`}
              type="text"
              value={codePreview}
              disabled
              placeholder="Will be generated automatically"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea
              className={styles.textarea}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              IRDAI Group<span className={styles.required}>*</span>
            </label>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={form.irdaiGroup}
                onChange={(e) => setForm((f) => ({ ...f, irdaiGroup: e.target.value }))}
              >
                <option value="">Select IRDAI Group</option>
                {IRDAI_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <FiChevronDown className={styles.selectChevron} size={18} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>IRDAI Type (GI/LI)</label>
            <input
              className={`${styles.input} ${styles.inputDisabled}`}
              type="text"
              value={deriveType(form.irdaiGroup)}
              disabled
              placeholder="Auto-populated based on group"
            />
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

export default function LineOfBusiness() {
  const [items, setItems] = useState<LobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LobItem | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/line-of-business", { credentials: "include" });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load line of business list", err);
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
      (it) =>
        it.name.toLowerCase().includes(q) ||
        it.code.toLowerCase().includes(q) ||
        (it.description || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code, or description..."
        />
        <button className={`${styles.btn} ${styles.btnPrimary}`} type="button">
          <FiSearch size={15} /> Search
        </button>
        <div className={styles.toolbarSpacer} />
        <button
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={() => alert("Bulk upload is coming soon.")}
        >
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
                <th>Segment</th>
                <th>IRDAI Group</th>
                <th>Type</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>
                    No line of business found.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
                  <tr key={it._id}>
                    <td className={styles.nameCell}>{it.name}</td>
                    <td className={styles.codeCell}>{it.code}</td>
                    <td>
                      <span className={styles.segmentPill}>{it.segment}</span>
                    </td>
                    <td>{it.irdaiGroup}</td>
                    <td>
                      <span className={styles.typeBadge}>{it.irdaiType}</span>
                    </td>
                    <td>{it.description || "-"}</td>
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
        <LineOfBusinessForm
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
