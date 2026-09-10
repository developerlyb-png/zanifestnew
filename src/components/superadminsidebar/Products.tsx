"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/components/superadminsidebar/Products.module.css";
import {
  FiSearch,
  FiUploadCloud,
  FiPlus,
  FiX,
  FiEdit2,
  FiChevronDown,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";

const DOCUMENT_CATEGORIES = [
  "Proof of Policy & Identity",
  "Incident/Asset/Treatment Documentation",
  "Verification of Policyholder/Asset",
  "Other Supporting Documents (Bills, FIRs, Receipts etc)",
] as const;

const DOCUMENT_OPTIONS = [
  "GST",
  "Driving License",
  "Passport",
  "Aadhar Back Side",
  "Aadhar Front Side",
  "Aadhar Card",
  "PAN",
] as const;

const EMPTY_REQUIRED_DOCS: Record<string, string[]> = DOCUMENT_CATEGORIES.reduce(
  (acc, c) => {
    acc[c] = [];
    return acc;
  },
  {} as Record<string, string[]>
);

interface LobOption {
  _id: string;
  name: string;
  code: string;
  segment: string;
}

interface ProductItem {
  _id: string;
  name: string;
  code: string;
  lineOfBusiness: LobOption | string;
  description?: string;
  requiredDocuments: { category: string; documents: string[] }[];
}

interface FormState {
  name: string;
  lineOfBusiness: string;
  description: string;
  requiredDocuments: Record<string, string[]>;
}

function DocumentCategorySelector({
  category,
  selected,
  onChange,
}: {
  category: string;
  selected: string[];
  onChange: (docs: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const filteredOptions = DOCUMENT_OPTIONS.filter((o) =>
    o.toLowerCase().includes(search.trim().toLowerCase())
  );

  const toggleDoc = (doc: string) => {
    if (selected.includes(doc)) {
      onChange(selected.filter((d) => d !== doc));
    } else {
      onChange([...selected, doc]);
    }
  };

  const visiblePills = selected.slice(0, 2);
  const extraCount = selected.length - visiblePills.length;

  return (
    <div className={styles.docCategoryCard}>
      <div className={styles.docCategoryHeader}>
        <div>
          <div className={styles.docCategoryTitle}>
            <span className={styles.sectionDot} />
            {category}
          </div>
          <div className={styles.docCategoryCount}>
            {selected.length} of {DOCUMENT_OPTIONS.length} documents selected
          </div>
        </div>
        <button
          type="button"
          className={styles.clearBtn}
          disabled={selected.length === 0}
          onClick={() => onChange([])}
        >
          Clear
        </button>
      </div>

      <div className={styles.multiSelect} ref={wrapRef}>
        <div className={styles.multiSelectTrigger} onClick={() => setOpen((o) => !o)}>
          {selected.length === 0 ? (
            <span className={styles.multiSelectPlaceholder}>
              Select documents for {category}...
            </span>
          ) : (
            <div className={styles.multiSelectPills}>
              {visiblePills.map((doc) => (
                <span key={doc} className={styles.docPill}>
                  {doc}
                  <button
                    type="button"
                    className={styles.docPillRemove}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDoc(doc);
                    }}
                    aria-label={`Remove ${doc}`}
                  >
                    <FiX size={10} />
                  </button>
                </span>
              ))}
              {extraCount > 0 && <span className={styles.docPillMore}>+{extraCount} more</span>}
            </div>
          )}
          <FiChevronDown
            className={`${styles.multiSelectChevron} ${open ? styles.multiSelectChevronOpen : ""}`}
            size={16}
          />
        </div>

        {open && (
          <div className={styles.multiSelectPanel}>
            <div className={styles.multiSelectSearch}>
              <FiSearch size={14} />
              <input
                autoFocus
                placeholder="Search options..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.multiSelectOptions}>
              {filteredOptions.length === 0 ? (
                <div className={styles.multiSelectEmpty}>No matches</div>
              ) : (
                filteredOptions.map((doc) => (
                  <div
                    key={doc}
                    className={`${styles.multiSelectOption} ${
                      selected.includes(doc) ? styles.multiSelectOptionSelected : ""
                    }`}
                    onClick={() => toggleDoc(doc)}
                  >
                    {doc}
                    {selected.includes(doc) && <FiCheck size={14} />}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductForm({
  initial,
  isEdit,
  lobOptions,
  onClose,
  onSaved,
}: {
  initial?: ProductItem | null;
  isEdit: boolean;
  lobOptions: LobOption[];
  onClose: () => void;
  onSaved: (item: ProductItem) => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (!initial) {
      return { name: "", lineOfBusiness: "", description: "", requiredDocuments: { ...EMPTY_REQUIRED_DOCS } };
    }
    const map = { ...EMPTY_REQUIRED_DOCS };
    (initial.requiredDocuments || []).forEach((g) => {
      map[g.category] = g.documents;
    });
    return {
      name: initial.name,
      lineOfBusiness: typeof initial.lineOfBusiness === "string" ? initial.lineOfBusiness : initial.lineOfBusiness._id,
      description: initial.description || "",
      requiredDocuments: map,
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [lobTouched, setLobTouched] = useState(false);

  const selectedLob = lobOptions.find((l) => l._id === form.lineOfBusiness);

  const codePreview = useMemo(() => {
    if (isEdit && initial) return initial.code;
    if (!form.name.trim() || !selectedLob) return "";
    const slug = form.name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const segSlug = selectedLob.segment.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
    return `${slug}_${segSlug}`;
  }, [form.name, selectedLob, isEdit, initial]);

  const totalSelected = Object.values(form.requiredDocuments).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  const nameError = nameTouched && !form.name.trim() ? "Product name is required" : "";
  const lobError = lobTouched && !form.lineOfBusiness ? "Line of business is required" : "";

  const handleSubmit = async () => {
    setNameTouched(true);
    setLobTouched(true);
    if (!form.name.trim() || !form.lineOfBusiness) return;

    setError("");
    setSaving(true);
    try {
      const requiredDocuments = DOCUMENT_CATEGORIES.map((c) => ({
        category: c,
        documents: form.requiredDocuments[c] || [],
      })).filter((g) => g.documents.length > 0);

      const res = await fetch("/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: initial?._id,
          name: form.name.trim(),
          lineOfBusiness: form.lineOfBusiness,
          description: form.description.trim(),
          requiredDocuments,
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
      console.error("Save product failed", err);
      setError("Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? "Edit Product" : "Add Product"}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FiX size={24} />
          </button>
        </div>

        {error && <p className={styles.errorBanner}>{error}</p>}

        <div className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionDot} /> Basic Information
              </div>
              <div className={styles.sectionSubtitle}>Enter the core details for this product</div>
            </div>
          </div>
          <hr className={styles.sectionDivider} />

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Product Name<span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <input
                  className={`${styles.input} ${nameError ? styles.inputError : ""}`}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  onBlur={() => setNameTouched(true)}
                  placeholder="Enter product name"
                />
                {nameError && <FiAlertCircle className={styles.inputErrorIcon} size={16} />}
              </div>
              {nameError && (
                <p className={styles.errorText}>
                  <FiAlertCircle size={12} /> {nameError}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Code (Auto-generated)</label>
              <input
                className={`${styles.input} ${styles.inputDisabled}`}
                value={codePreview}
                disabled
                placeholder="Will be generated automatically"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Line of Business<span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <select
                  className={`${styles.select} ${lobError ? styles.inputError : ""}`}
                  value={form.lineOfBusiness}
                  onChange={(e) => setForm((f) => ({ ...f, lineOfBusiness: e.target.value }))}
                  onBlur={() => setLobTouched(true)}
                >
                  <option value="">Select line of business</option>
                  {lobOptions.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name} ({l.segment})
                    </option>
                  ))}
                </select>
                <FiChevronDown className={styles.selectChevron} size={18} />
              </div>
              {lobError && (
                <p className={styles.errorText}>
                  <FiAlertCircle size={12} /> {lobError}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Description</label>
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Enter product description"
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionDot} /> Required Documents
              </div>
              <div className={styles.sectionSubtitle}>Select documents required for each category</div>
            </div>
            <div className={styles.sectionTotal}>
              <div className={styles.sectionTotalValue}>{totalSelected}</div>
              <div className={styles.sectionTotalLabel}>Total Selected</div>
            </div>
          </div>
          <hr className={styles.sectionDivider} />

          <div className={styles.docCategoryList}>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <DocumentCategorySelector
                key={cat}
                category={cat}
                selected={form.requiredDocuments[cat] || []}
                onChange={(docs) =>
                  setForm((f) => ({
                    ...f,
                    requiredDocuments: { ...f.requiredDocuments, [cat]: docs },
                  }))
                }
              />
            ))}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={`${styles.btn} ${styles.btnOutline} ${styles.cancelBtn}`}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary} ${styles.createBtn}`}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : isEdit ? "Save" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [lobOptions, setLobOptions] = useState<LobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", { credentials: "include" });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLobOptions = async () => {
    try {
      const res = await fetch("/api/admin/line-of-business", { credentials: "include" });
      const data = await res.json();
      setLobOptions(data.items || []);
    } catch (err) {
      console.error("Failed to load line of business options", err);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchLobOptions();
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

  const lobLabel = (it: ProductItem) => {
    if (typeof it.lineOfBusiness === "string" || !it.lineOfBusiness) return "-";
    return `${it.lineOfBusiness.name} (${it.lineOfBusiness.segment})`;
  };

  const docCount = (it: ProductItem) =>
    (it.requiredDocuments || []).reduce((sum, g) => sum + g.documents.length, 0);

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
                <th>Line of Business</th>
                <th>Documents</th>
                <th>Description</th>
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
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
                  <tr key={it._id}>
                    <td className={styles.nameCell}>{it.name}</td>
                    <td className={styles.codeCell}>{it.code}</td>
                    <td>
                      <span className={styles.lobPill}>{lobLabel(it)}</span>
                    </td>
                    <td>
                      <span className={styles.docCountBadge}>{docCount(it)}</span>
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
        <ProductForm
          initial={editingItem}
          isEdit={!!editingItem}
          lobOptions={lobOptions}
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
