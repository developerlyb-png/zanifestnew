"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import cs from "@/styles/components/superadminsidebar/Claims.module.css";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiPackage } from "react-icons/fi";

export interface InvoiceItemRow {
  _id: string;
  name: string;
  hsnSac?: string;
  unit?: string;
  salesPrice: number;
  gstRate?: number;
  trackStock?: boolean;
  openingStock?: number;
  currentStock?: number;
  category?: string;
}

const inr = (n?: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EMPTY_FORM = {
  name: "",
  hsnSac: "",
  unit: "PCS",
  salesPrice: "",
  gstRate: "",
  category: "",
  trackStock: false,
  openingStock: "",
};
type FormState = typeof EMPTY_FORM;

function Field({
  label,
  required,
  err,
  children,
}: {
  label: string;
  required?: boolean;
  err?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cs.field}>
      <label className={cs.label}>
        {label}
        {required && <span className={cs.req}>*</span>}
      </label>
      {children}
      {err && <span className={cs.errorText}>{err}</span>}
    </div>
  );
}

// Reused by the Invoice wizard's "+ New Item" flow (so a missing catalog
// entry can be created inline, the same way AddInvoiceClientForm works for
// clients) and by this page's own Add/Edit buttons.
export function AddInvoiceItemForm({
  editId,
  onCancel,
  onCreated,
}: {
  editId?: string;
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const isEdit = !!editId;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingItem, setLoadingItem] = useState(isEdit);

  useEffect(() => {
    if (!editId) return;
    setLoadingItem(true);
    fetch(`/api/admin/invoice-items?id=${editId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.message);
        const it = d.item;
        setForm({
          name: it.name || "",
          hsnSac: it.hsnSac || "",
          unit: it.unit || "PCS",
          salesPrice: String(it.salesPrice ?? ""),
          gstRate: String(it.gstRate ?? ""),
          category: it.category || "",
          trackStock: !!it.trackStock,
          openingStock: String(it.openingStock ?? ""),
        });
      })
      .catch((e: any) => toast.error(e.message || "Failed to load item"))
      .finally(() => setLoadingItem(false));
  }, [editId]);

  const set = (key: keyof FormState, value: string | boolean) => setForm((f) => ({ ...f, [key]: value as any }));
  const cls = (key: keyof FormState) => `${cs.input} ${errors[key] ? cs.errorInput : ""}`;

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (form.salesPrice.trim() && Number(form.salesPrice) < 0) e.salesPrice = "Must be 0 or more";
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...(isEdit ? { id: editId } : {}),
        name: form.name,
        hsnSac: form.hsnSac,
        unit: form.unit || "PCS",
        salesPrice: Number(form.salesPrice) || 0,
        gstRate: Number(form.gstRate) || 0,
        category: form.category,
        trackStock: form.trackStock,
        openingStock: Number(form.openingStock) || 0,
      };
      const res = await fetch("/api/admin/invoice-items", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || `Failed to ${isEdit ? "update" : "add"} item`);
        return;
      }
      toast.success(isEdit ? "Item updated" : "Item added");
      onCreated(data.item._id);
    } catch (err) {
      console.log(isEdit ? "UPDATE INVOICE ITEM ERROR" : "ADD INVOICE ITEM ERROR", err);
      toast.error(`Failed to ${isEdit ? "update" : "add"} item`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingItem) {
    return (
      <div className={`${cs.wizard} ${cs.invoiceClientForm}`}>
        <p className={cs.hint}>Loading item...</p>
      </div>
    );
  }

  return (
    <div className={`${cs.wizard} ${cs.invoiceClientForm}`}>
      <h1 className={cs.wizTitle}>{isEdit ? "Edit Item" : "Add Item"}</h1>
      <p className={cs.wizSub}>{isEdit ? "Update this catalog item's details." : "Add a new item to the catalog."}</p>

      <div className={cs.formCard}>
        <h3 className={cs.cardTitle}>Item Details</h3>
        <div className={cs.grid2}>
          <Field label="Item Name" required err={errors.name}>
            <input className={cls("name")} placeholder="e.g., Motor Policy Service Fee" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="HSN/SAC Code">
            <input className={cs.input} placeholder="e.g., 998311" value={form.hsnSac} onChange={(e) => set("hsnSac", e.target.value)} />
          </Field>
          <Field label="Category">
            <input className={cs.input} placeholder="e.g., Services" value={form.category} onChange={(e) => set("category", e.target.value)} />
          </Field>
          <Field label="Unit">
            <input className={cs.input} placeholder="e.g., PCS, HRS" value={form.unit} onChange={(e) => set("unit", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className={cs.formCard}>
        <h3 className={cs.cardTitle}>Pricing &amp; Tax</h3>
        <div className={cs.grid2}>
          <Field label="Sales Price (₹)" err={errors.salesPrice}>
            <input
              type="number"
              min={0}
              className={cls("salesPrice")}
              placeholder="e.g., 1000"
              value={form.salesPrice}
              onChange={(e) => set("salesPrice", e.target.value)}
            />
          </Field>
          <Field label="GST Rate (%)">
            <input
              type="number"
              min={0}
              max={100}
              className={cs.input}
              placeholder="e.g., 18"
              value={form.gstRate}
              onChange={(e) => set("gstRate", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className={cs.formCard}>
        <h3 className={cs.cardTitle}>Stock Tracking</h3>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#344b65", marginBottom: form.trackStock ? 12 : 0 }}>
          <input type="checkbox" checked={form.trackStock} onChange={(e) => set("trackStock", e.target.checked)} />
          Track stock for this item
        </label>
        {form.trackStock && (
          <div className={cs.grid2}>
            <Field label="Opening Stock">
              <input
                type="number"
                min={0}
                className={cs.input}
                placeholder="e.g., 100"
                value={form.openingStock}
                onChange={(e) => set("openingStock", e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>

      <div className={`${styles.rightActions} ${cs.invoiceFormActions}`}>
        <button type="button" className={styles.primaryBtn} onClick={submit} disabled={submitting}>
          {isEdit ? (submitting ? "Saving..." : "Save Changes") : submitting ? "Adding..." : "Add Item"}
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button type="button" className={cs.btnCancel} onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function InvoiceItems() {
  const [items, setItems] = useState<InvoiceItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/invoice-items", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = useMemo(
    () =>
      items.filter((it) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return it.name.toLowerCase().includes(q) || (it.hsnSac || "").toLowerCase().includes(q) || (it.category || "").toLowerCase().includes(q);
      }),
    [items, search]
  );

  const deleteItem = async (it: InvoiceItemRow) => {
    if (!window.confirm(`Delete item "${it.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/admin/invoice-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: it._id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Item deleted");
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete item");
    }
  };

  if (view === "add") {
    return (
      <div className={`${styles.cont} ${cs.invoiceClientsPage}`}>
        <AddInvoiceItemForm
          onCancel={() => setView("list")}
          onCreated={() => {
            setView("list");
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (view === "edit" && activeId) {
    return (
      <div className={`${styles.cont} ${cs.invoiceClientsPage}`}>
        <AddInvoiceItemForm
          editId={activeId}
          onCancel={() => setView("list")}
          onCreated={() => {
            setView("list");
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.cont} ${cs.invoiceClientsPage}`}>
      <div className={styles.headerRow}>
        <h2 className={`${styles.heading} ${cs.invoicePageHeading}`}>Item Catalog</h2>
        <div className={styles.headerActions}>
          <button className={`${styles.primaryBtn} ${cs.invoiceAddButton}`} onClick={() => setView("add")}>
            <FiPlus /> Add Item
          </button>
        </div>
      </div>

      <div className={styles.searchInput} style={{ maxWidth: 320, marginBottom: 16 }}>
        <FiSearch size={12} />
        <input placeholder="Search by name, HSN or category" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className={`${styles.tableWrapper} ${cs.invoiceTableWrapper}`}>
        <table className={styles.table} style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>HSN/SAC</th>
              <th>Unit</th>
              <th>Sales Price</th>
              <th>GST %</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  Loading items...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  No items found.
                </td>
              </tr>
            ) : (
              filtered.map((it) => (
                <tr key={it._id}>
                  <td style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <FiPackage size={13} color="#94a3b8" /> {it.name}
                  </td>
                  <td>{it.hsnSac || "—"}</td>
                  <td>{it.unit || "PCS"}</td>
                  <td>{inr(it.salesPrice)}</td>
                  <td>{it.gstRate ? `${it.gstRate}%` : "—"}</td>
                  <td>{it.trackStock ? `${it.currentStock ?? 0} ${it.unit || "PCS"}` : "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveId(it._id);
                          setView("edit");
                        }}
                        style={{ color: "#64748b", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", padding: "5px 9px" }}
                        title="Edit"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(it)}
                        style={{ color: "#b91c1c", background: "none", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", padding: "5px 9px" }}
                        title="Delete"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
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
