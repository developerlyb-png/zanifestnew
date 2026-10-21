"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import cs from "@/styles/components/superadminsidebar/Claims.module.css";
import {
  FiDownload,
  FiSearch,
  FiColumns,
  FiCalendar,
  FiUploadCloud,
  FiPlus,
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

interface InvoiceClientRow {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  addressLine1: string;
  addressLine2?: string;
  pincode: string;
  city: string;
  state: string;
  createdAt?: string;
}

type Preset = "today" | "thisMonth" | "lastMonth" | "thisYear" | "lastYear" | "custom";

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

// Indian financial year: Apr 1 - Mar 31
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
      return {
        from: new Date(from.getFullYear() - 1, 3, 1),
        to: new Date(from.getFullYear(), 2, 31, 23, 59, 59),
      };
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

type ColumnKey = "name" | "contactPerson" | "email" | "phone" | "city" | "gstin" | "pan" | "state";

const COLUMNS: { key: ColumnKey; label: string; defaultOn: boolean }[] = [
  { key: "name", label: "Client Name", defaultOn: true },
  { key: "contactPerson", label: "Contact Person", defaultOn: true },
  { key: "email", label: "Email", defaultOn: true },
  { key: "phone", label: "Phone", defaultOn: true },
  { key: "city", label: "City", defaultOn: true },
  { key: "state", label: "State", defaultOn: false },
  { key: "gstin", label: "GSTIN", defaultOn: false },
  { key: "pan", label: "PAN", defaultOn: false },
];

const DEFAULT_VISIBLE = COLUMNS.reduce((acc, c) => {
  acc[c.key] = c.defaultOn;
  return acc;
}, {} as Record<ColumnKey, boolean>);

const EMPTY_FORM = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  gstin: "",
  pan: "",
  addressLine1: "",
  addressLine2: "",
  pincode: "",
  city: "",
  state: "",
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

function AddInvoiceClientForm({
  onCancel,
  onCreated,
  editId,
}: {
  onCancel: () => void;
  onCreated: (id: string) => void;
  editId?: string;
}) {
  const isEdit = !!editId;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingClient, setLoadingClient] = useState(isEdit);

  useEffect(() => {
    if (!editId) return;
    setLoadingClient(true);
    fetch(`/api/admin/invoice-clients?id=${editId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.message);
        const c = d.client;
        setForm({
          name: c.name || "",
          contactPerson: c.contactPerson || "",
          email: c.email || "",
          phone: c.phone || "",
          gstin: c.gstin || "",
          pan: c.pan || "",
          addressLine1: c.addressLine1 || "",
          addressLine2: c.addressLine2 || "",
          pincode: c.pincode || "",
          city: c.city || "",
          state: c.state || "",
        });
      })
      .catch((e: any) => toast.error(e.message || "Failed to load client"))
      .finally(() => setLoadingClient(false));
  }, [editId]);

  const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const bind = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value),
  });
  const cls = (key: keyof FormState) => `${cs.input} ${errors[key] ? cs.errorInput : ""}`;

  const REQUIRED: (keyof FormState)[] = [
    "name",
    "contactPerson",
    "email",
    "phone",
    "gstin",
    "pan",
    "addressLine1",
    "pincode",
    "city",
    "state",
  ];

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    REQUIRED.forEach((k) => {
      if (!form[k].trim()) e[k] = "Required";
    });
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invoice-clients", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isEdit ? { ...form, id: editId } : form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || `Failed to ${isEdit ? "update" : "add"} client`);
        return;
      }
      toast.success(isEdit ? "Client updated" : "Client added");
      onCreated(data.client._id);
    } catch (err) {
      console.log(isEdit ? "UPDATE INVOICE CLIENT ERROR" : "ADD INVOICE CLIENT ERROR", err);
      toast.error(`Failed to ${isEdit ? "update" : "add"} client`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingClient) {
    return (
      <div className={cs.wizard}>
        <p className={cs.hint}>Loading client...</p>
      </div>
    );
  }

  return (
    <div className={cs.wizard}>
      <h1 className={cs.wizTitle}>{isEdit ? "Edit Client" : "Add Client"}</h1>
      <p className={cs.wizSub}>{isEdit ? "Update this invoice client's details." : "Add a new invoice client."}</p>

      <div className={cs.formCard}>
        <h3 className={cs.cardTitle}>Client Information</h3>
        <div className={cs.grid2}>
          <Field label="Client Name" required err={errors.name}>
            <input className={cls("name")} placeholder="e.g., ABC Corporation" {...bind("name")} />
          </Field>
        </div>
        <div className={cs.grid2}>
          <Field label="Contact Person Name" required err={errors.contactPerson}>
            <input className={cls("contactPerson")} placeholder="e.g., John Doe" {...bind("contactPerson")} />
          </Field>
          <Field label="Email" required err={errors.email}>
            <input
              type="email"
              className={cls("email")}
              placeholder="e.g., contact@company.com"
              {...bind("email")}
            />
          </Field>
          <Field label="Phone" required err={errors.phone}>
            <input className={cls("phone")} placeholder="e.g., 9876543210" {...bind("phone")} />
          </Field>
        </div>
      </div>

      <div className={cs.formCard}>
        <h3 className={cs.cardTitle}>Tax Information</h3>
        <div className={cs.grid2}>
          <Field label="GSTIN" required err={errors.gstin}>
            <input
              className={cls("gstin")}
              placeholder="e.g., 22AAAAA0000A1Z1"
              value={form.gstin}
              onChange={(e) => set("gstin", e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="PAN" required err={errors.pan}>
            <input
              className={cls("pan")}
              placeholder="e.g., ABCDE1234F"
              value={form.pan}
              onChange={(e) => set("pan", e.target.value.toUpperCase())}
            />
          </Field>
        </div>
      </div>

      <div className={cs.formCard}>
        <h3 className={cs.cardTitle}>Address</h3>
        <div className={cs.grid2}>
          <Field label="Address Line 1" required err={errors.addressLine1}>
            <input className={cls("addressLine1")} placeholder="e.g., 123 Business Street" {...bind("addressLine1")} />
          </Field>
          <Field label="Address Line 2">
            <input className={cs.input} placeholder="e.g., Suite 100" {...bind("addressLine2")} />
          </Field>
        </div>
        <div className={cs.grid3}>
          <Field label="Pincode" required err={errors.pincode}>
            <input className={cls("pincode")} placeholder="e.g., 400001" {...bind("pincode")} />
          </Field>
          <Field label="City" required err={errors.city}>
            <input className={cls("city")} placeholder="e.g., Mumbai" {...bind("city")} />
          </Field>
          <Field label="State" required err={errors.state}>
            <input className={cls("state")} placeholder="e.g., Maharashtra" {...bind("state")} />
          </Field>
        </div>
      </div>

      <div className={styles.rightActions}>
        {!isEdit && (
          <button type="button" className={styles.exportSolidBtn} onClick={clearForm} disabled={submitting}>
            Clear
          </button>
        )}
        <button type="button" className={styles.primaryBtn} onClick={submit} disabled={submitting}>
          {isEdit ? (submitting ? "Saving..." : "Save Changes") : submitting ? "Adding..." : "Add Client"}
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

function InvoiceClientDetail({
  clientId,
  onBack,
  onEdit,
  onDeleted,
}: {
  clientId: string;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [client, setClient] = useState<InvoiceClientRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/invoice-clients?id=${clientId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setClient(d.success ? d.client : null))
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [clientId]);

  const deleteClient = async () => {
    if (!client) return;
    if (!window.confirm(`Delete client "${client.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/invoice-clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: clientId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Client deleted");
      onDeleted();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete client");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={cs.dWrap}>
        <button className={cs.dBack} onClick={onBack}>
          <FiArrowLeft /> Back to clients
        </button>
        <p className={cs.hint}>Loading client...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className={cs.dWrap}>
        <button className={cs.dBack} onClick={onBack}>
          <FiArrowLeft /> Back to clients
        </button>
        <p>Client not found.</p>
      </div>
    );
  }

  return (
    <div className={cs.dWrap}>
      <button className={cs.dBack} onClick={onBack}>
        <FiArrowLeft /> Back to clients
      </button>

      <div className={cs.dHeader}>
        <div className={cs.dHeaderLeft}>
          <span className={cs.dFileIcon}>
            <FiUser />
          </span>
          <div>
            <div className={cs.dClaimNo}>{client.name}</div>
            <div className={cs.dHeaderSub}>
              <FiMail size={12} /> {client.email}
              <span>·</span>
              <FiPhone size={12} /> {client.phone}
            </div>
          </div>
        </div>
        <div className={cs.dHeaderActions}>
          <button type="button" className={cs.dEditBtn} onClick={onEdit}>
            <FiEdit2 /> Edit
          </button>
          <button type="button" className={cs.dOutlineBtn} onClick={deleteClient} disabled={deleting} style={{ color: "#dc2626", borderColor: "#fecaca" }}>
            <FiTrash2 /> {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className={cs.dCard}>
        <div className={cs.dCardBody} style={{ borderTop: "none" }}>
          <div className={cs.dGrid}>
            <div className={cs.dRow}>
              <span className={cs.dKey}>Client Name</span>
              <span className={cs.dVal}>{client.name}</span>
            </div>
            <div className={cs.dRow}>
              <span className={cs.dKey}>Contact Person</span>
              <span className={cs.dVal}>{client.contactPerson}</span>
            </div>
            <div className={cs.dRow}>
              <span className={cs.dKey}>Email</span>
              <span className={cs.dVal}>{client.email}</span>
            </div>
            <div className={cs.dRow}>
              <span className={cs.dKey}>Phone</span>
              <span className={cs.dVal}>{client.phone}</span>
            </div>
            <div className={cs.dRow}>
              <span className={cs.dKey}>GSTIN</span>
              <span className={cs.dVal}>{client.gstin}</span>
            </div>
            <div className={cs.dRow}>
              <span className={cs.dKey}>PAN</span>
              <span className={cs.dVal}>{client.pan}</span>
            </div>
            <div className={cs.dRow}>
              <span className={cs.dKey}>
                <FiMapPin size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                Billing Address
              </span>
              <span className={cs.dVal}>
                {[client.addressLine1, client.addressLine2, client.city, client.state, client.pincode].filter(Boolean).join(", ")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceClients() {
  const [clients, setClients] = useState<InvoiceClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<"list" | "add" | "edit" | "detail">("list");
  const [activeId, setActiveId] = useState<string | null>(null);

  const [preset, setPreset] = useState<Preset>("thisYear");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [nameSearch, setNameSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

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
    setLoading(true);
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() });
    fetch(`/api/admin/invoice-clients?${params.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [range, refreshKey]);

  const filtered = useMemo(
    () =>
      clients.filter((c) => {
        if (nameSearch && !c.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
        if (contactSearch && !c.contactPerson.toLowerCase().includes(contactSearch.toLowerCase())) return false;
        if (emailSearch && !c.email.toLowerCase().includes(emailSearch.toLowerCase())) return false;
        if (phoneSearch && !c.phone.toLowerCase().includes(phoneSearch.toLowerCase())) return false;
        if (citySearch && !c.city.toLowerCase().includes(citySearch.toLowerCase())) return false;
        return true;
      }),
    [clients, nameSearch, contactSearch, emailSearch, phoneSearch, citySearch]
  );

  const visible = filtered.slice(0, rowsPerPage);

  const exportCsv = () => {
    const cols = COLUMNS.filter((c) => visibleColumns[c.key]);
    const rows = filtered.map((c) => cols.map((col) => (c as any)[col.key] || ""));
    const csvText = [cols.map((c) => c.label), ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csvText], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice_clients_${fmtDate(range.from).replace(/\//g, "-")}_to_${fmtDate(range.to).replace(
      /\//g,
      "-"
    )}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleCount = COLUMNS.filter((c) => visibleColumns[c.key]).length;

  if (view === "add") {
    return (
      <div className={styles.cont}>
        <AddInvoiceClientForm
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
      <div className={styles.cont}>
        <AddInvoiceClientForm
          editId={activeId}
          onCancel={() => setView("detail")}
          onCreated={(id) => {
            setActiveId(id);
            setView("detail");
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (view === "detail" && activeId) {
    return (
      <div className={styles.cont}>
        <InvoiceClientDetail
          clientId={activeId}
          onBack={() => {
            setView("list");
            setRefreshKey((k) => k + 1);
          }}
          onEdit={() => setView("edit")}
          onDeleted={() => {
            setView("list");
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Invoice Clients</h2>
        <div className={styles.headerActions}>
          <button className={styles.outlineBtn} onClick={() => toast("Bulk upload is coming soon.")}>
            <FiUploadCloud /> Bulk Upload
          </button>
          <button className={styles.primaryBtn} onClick={() => setView("add")}>
            <FiPlus /> Add New
          </button>
        </div>
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
        <table className={styles.table} style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              {COLUMNS.filter((c) => visibleColumns[c.key]).map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th>Actions</th>
            </tr>
            <tr className={styles.filterHeaderRow}>
              {visibleColumns.name && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search name" value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.contactPerson && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search contact" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.email && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search email" value={emailSearch} onChange={(e) => setEmailSearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.phone && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search phone" value={phoneSearch} onChange={(e) => setPhoneSearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.city && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search city" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.state && <td className={styles.dashCell}>—</td>}
              {visibleColumns.gstin && <td className={styles.dashCell}>—</td>}
              {visibleColumns.pan && <td className={styles.dashCell}>—</td>}
              <td className={styles.dashCell}>—</td>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleCount + 1} className={styles.emptyCell}>
                  Loading clients...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={visibleCount + 1} className={styles.emptyCell}>
                  No clients found.
                </td>
              </tr>
            ) : (
              visible.map((c) => (
                <tr key={c._id}>
                  {visibleColumns.name && (
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveId(c._id);
                          setView("detail");
                        }}
                        style={{ color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        {c.name}
                      </button>
                    </td>
                  )}
                  {visibleColumns.contactPerson && <td>{c.contactPerson}</td>}
                  {visibleColumns.email && <td>{c.email}</td>}
                  {visibleColumns.phone && <td>{c.phone}</td>}
                  {visibleColumns.city && <td>{c.city}</td>}
                  {visibleColumns.state && <td>{c.state}</td>}
                  {visibleColumns.gstin && <td>{c.gstin}</td>}
                  {visibleColumns.pan && <td>{c.pan}</td>}
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(c._id);
                        setView("detail");
                      }}
                      style={{ color: "#64748b", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", padding: "5px 12px", fontSize: 12, fontWeight: 600 }}
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
    </div>
  );
}
