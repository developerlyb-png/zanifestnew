"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import um from "@/styles/components/superadminsidebar/UserManagement.module.css";
import cm from "@/styles/components/superadminsidebar/ClientManagement.module.css";
import am from "@/styles/components/superadminsidebar/AddClientModal.module.css";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiX,
  FiEye,
  FiUsers,
  FiTrash2,
  FiDownload,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiChevronUp,
  FiChevronDown,
  FiRotateCcw,
  FiFileText,
  FiGrid,
} from "react-icons/fi";
import { ALL_MODULES, POSP_TYPES } from "@/constants/userModules";

export interface StaffRoleRow {
  _id: string;
  name: string;
  description?: string;
  hasPospFields: boolean;
  isSystem: boolean;
  isActive: boolean;
  userCount?: number;
}

interface BankDetails {
  accountHolderName?: string;
  bankName?: string;
  ifscCode?: string;
  accountNumber?: string;
  cancelledCheque?: { data: string; fileName: string };
}

interface StaffUserRow {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  branch?: string;
  pospType?: string;
  pospCode?: string;
  irdaiPospCode?: string;
  payoutPercentage?: number;
  bankDetails?: BankDetails;
  pinCode?: string;
  city?: string;
  district?: string;
  state?: string;
  linkedAccountType?: "Admin" | "Manager";
  accessModules: string[];
  adminAccessModules: string[];
  isActive: boolean;
  createdAt?: string;
}

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  role: "" as string,
  branch: "",
  password: "",
  confirmPassword: "",
  pospType: "",
  irdaiPospCode: "",
  payoutPercentage: "",
  bankDetails: { accountHolderName: "", bankName: "", ifscCode: "", accountNumber: "" } as BankDetails,
  cancelledCheque: null as { data: string; fileName: string } | null,
  pinCode: "",
  city: "",
  district: "",
  state: "",
  accessModules: [] as string[],
  adminAccessModules: [] as string[],
};
type FormState = typeof EMPTY_FORM;

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className={am.field}>
      <label className={am.label}>
        {label}
        {required && <span className={am.required}>*</span>}
      </label>
      {children}
    </div>
  );
}

function UserFormModal({
  editUser,
  roles,
  onClose,
  onSaved,
}: {
  editUser: StaffUserRow | null;
  roles: StaffRoleRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editUser;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [branches, setBranches] = useState<{ _id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config-branches", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setBranches(d.items || []))
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    if (!editUser) return;
    setForm({
      fullName: editUser.fullName,
      email: editUser.email,
      phone: editUser.phone,
      role: editUser.role,
      branch: editUser.branch || "",
      password: "",
      confirmPassword: "",
      pospType: editUser.pospType || "",
      irdaiPospCode: editUser.irdaiPospCode || "",
      payoutPercentage: editUser.payoutPercentage != null ? String(editUser.payoutPercentage) : "",
      bankDetails: {
        accountHolderName: editUser.bankDetails?.accountHolderName || "",
        bankName: editUser.bankDetails?.bankName || "",
        ifscCode: editUser.bankDetails?.ifscCode || "",
        accountNumber: editUser.bankDetails?.accountNumber || "",
      },
      cancelledCheque: editUser.bankDetails?.cancelledCheque || null,
      pinCode: editUser.pinCode || "",
      city: editUser.city || "",
      district: editUser.district || "",
      state: editUser.state || "",
      accessModules: editUser.accessModules || [],
      adminAccessModules: editUser.adminAccessModules || [],
    });
  }, [editUser]);

  const set = (key: keyof FormState, value: any) => setForm((f) => ({ ...f, [key]: value }));
  const setBank = (key: keyof BankDetails, value: string) =>
    setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, [key]: value } }));

  const toggleModule = (value: string) => {
    setForm((f) => {
      const next = f.accessModules.includes(value)
        ? f.accessModules.filter((v) => v !== value)
        : [...f.accessModules, value];
      return { ...f, accessModules: next };
    });
  };

  const handleCheque = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("cancelledCheque", { data: reader.result as string, fileName: file.name });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const selectedRole = roles.find((r) => r.name === form.role);
  const isPosp = !!selectedRole?.hasPospFields;
  // Inactive roles are hidden from new assignments, but a user already on
  // one keeps it selectable while being edited.
  const roleOptions = roles.filter((r) => r.isActive || r.name === editUser?.role);
  const isBranchManager = form.role === "Branch Manager";

  const submit = async () => {
    if (!form.fullName.trim()) return toast.error("Full name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.role.trim()) return toast.error("Role is required");
    if (!form.phone.trim()) return toast.error("Phone number is required");
    if (!isEdit && !form.password.trim()) return toast.error("Password is required");
    if (form.password && form.password !== form.confirmPassword) return toast.error("Passwords do not match");
    if (isBranchManager && (!form.pinCode.trim() || !form.city.trim() || !form.district.trim() || !form.state.trim())) {
      return toast.error("Pincode, City, District and State are required for a Branch Manager");
    }

    setSubmitting(true);
    try {
      const payload: any = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        role: form.role,
        branch: form.branch,
        pospType: isPosp ? form.pospType : "",
        irdaiPospCode: form.irdaiPospCode,
        payoutPercentage: form.payoutPercentage,
        bankDetails: isPosp ? { ...form.bankDetails, cancelledCheque: form.cancelledCheque || undefined } : undefined,
        pinCode: form.pinCode,
        city: form.city,
        district: form.district,
        state: form.state,
        accessModules: form.accessModules,
        adminAccessModules: form.adminAccessModules,
      };
      if (form.password) payload.password = form.password;
      if (isEdit) payload.id = editUser!._id;

      const res = await fetch("/api/admin/staff-users", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || `Failed to ${isEdit ? "update" : "add"} user`);
        return;
      }
      toast.success(isEdit ? "User updated" : "User added");
      onSaved();
    } catch {
      toast.error(`Failed to ${isEdit ? "update" : "add"} user`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={am.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={am.modal} style={{ maxWidth: 820 }}>
        <div className={am.header}>
          <h3 className={am.title}>{isEdit ? "Edit User" : "Add User"}</h3>
          <button type="button" className={am.closeBtn} onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        <div className={am.body}>
          <div className={am.grid2}>
            <Field label="Role" required>
              <select className={am.select} value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="">Select user role...</option>
                {roleOptions.map((r) => (
                  <option key={r._id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Full Name" required>
              <input className={am.input} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </Field>
            <Field label="Email" required>
              <input type="email" className={am.input} value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Branch" required>
              <select className={am.select} value={form.branch} onChange={(e) => set("branch", e.target.value)}>
                <option value="">Select branch...</option>
                {branches.map((b) => (
                  <option key={b._id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Phone Number" required>
              <input
                className={am.input}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter phone number"
              />
            </Field>
            <Field label={isEdit ? "New Password (leave blank to keep current)" : "Password"} required={!isEdit}>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className={am.input}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: "absolute", right: 10, top: 10, background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                >
                  <FiEye size={15} />
                </button>
              </div>
            </Field>
            <Field label="Confirm Password" required={!isEdit || !!form.password}>
              <input
                type={showPassword ? "text" : "password"}
                className={am.input}
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
              />
            </Field>
          </div>

          {isPosp && (
            <>
              <div className={am.sectionBanner} style={{ marginTop: 10 }}>
                <span className={am.sectionBannerText}>POSP Details</span>
              </div>
              <div className={am.grid2}>
                <Field label="POSP Type">
                  <select className={am.select} value={form.pospType} onChange={(e) => set("pospType", e.target.value)}>
                    <option value="">Select type...</option>
                    {POSP_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="IRDAI POSP Code">
                  <input className={am.input} value={form.irdaiPospCode} onChange={(e) => set("irdaiPospCode", e.target.value)} />
                </Field>
                <Field label="Payout Percentage">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={am.input}
                    value={form.payoutPercentage}
                    onChange={(e) => set("payoutPercentage", e.target.value)}
                  />
                </Field>
              </div>

              <div className={am.sectionBanner}>
                <span className={am.sectionBannerText}>Bank Details</span>
              </div>
              <div className={am.grid2}>
                <Field label="Account Holder Name">
                  <input
                    className={am.input}
                    value={form.bankDetails.accountHolderName}
                    onChange={(e) => setBank("accountHolderName", e.target.value)}
                  />
                </Field>
                <Field label="Bank Name">
                  <input className={am.input} value={form.bankDetails.bankName} onChange={(e) => setBank("bankName", e.target.value)} />
                </Field>
                <Field label="IFSC Code">
                  <input
                    className={am.input}
                    value={form.bankDetails.ifscCode}
                    onChange={(e) => setBank("ifscCode", e.target.value.toUpperCase())}
                  />
                </Field>
                <Field label="Account Number">
                  <input
                    className={am.input}
                    value={form.bankDetails.accountNumber}
                    onChange={(e) => setBank("accountNumber", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Cancelled Cheque">
                {form.cancelledCheque ? (
                  <div className={am.fileChip} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    {form.cancelledCheque.fileName}
                    <button type="button" onClick={() => set("cancelledCheque", null)} style={{ background: "none", border: 0, cursor: "pointer" }}>
                      <FiX size={12} />
                    </button>
                  </div>
                ) : (
                  <label className={am.dropzone} style={{ display: "block" }}>
                    <span className={am.dropzoneTitle}>Upload cancelled cheque</span>
                    <span className={am.dropzoneHint}>PDF, JPG, PNG up to 5MB</span>
                    <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={handleCheque} />
                  </label>
                )}
              </Field>
            </>
          )}

          {isBranchManager && (
            <>
              <div className={am.sectionBanner} style={{ marginTop: 10 }}>
                <span className={am.sectionBannerText}>Branch Manager Details</span>
              </div>
              <p style={{ fontSize: 12, color: "#8a93a6", margin: "-4px 0 10px" }}>
                This creates a real Manager account too, so this person shows up and works everywhere a Manager
                already does (Manager List, reporting-manager assignment, etc.).
              </p>
              <div className={am.grid2}>
                <Field label="Pincode" required>
                  <input className={am.input} value={form.pinCode} onChange={(e) => set("pinCode", e.target.value)} />
                </Field>
                <Field label="City" required>
                  <input className={am.input} value={form.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="District" required>
                  <input className={am.input} value={form.district} onChange={(e) => set("district", e.target.value)} />
                </Field>
                <Field label="State" required>
                  <input className={am.input} value={form.state} onChange={(e) => set("state", e.target.value)} />
                </Field>
              </div>
            </>
          )}

          <div className={am.sectionBanner} style={{ marginTop: 14 }}>
            <span className={am.sectionBannerText}>Modules</span>
          </div>
          <p style={{ fontSize: 12, color: "#8a93a6", margin: "0 0 10px" }}>
            Tick every module this user should be able to see.
          </p>
          <div className={am.grid2} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {ALL_MODULES.map((m) => (
              <label key={m} className={am.checkboxRow}>
                <input type="checkbox" checked={form.accessModules.includes(m)} onChange={() => toggleModule(m)} />
                {m}
              </label>
            ))}
          </div>
        </div>

        <div className={am.footer}>
          <button type="button" className={am.cancelBtn} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className={am.saveBtn} onClick={submit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: StaffUserRow; onClose: () => void }) {
  const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div style={{ background: "#f8faff", borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, color: "#8a93a6", textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e", marginTop: 2 }}>{value || "—"}</div>
    </div>
  );

  return (
    <div className={am.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={am.modal} style={{ maxWidth: 680 }}>
        <div className={am.header}>
          <h3 className={am.title}>User Details</h3>
          <button type="button" className={am.closeBtn} onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>
        <div className={am.body}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <FiUsers size={18} color="#1876bd" />
            <span style={{ fontSize: 17, fontWeight: 700 }}>{user.fullName}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Row label="Email" value={user.email} />
            <Row label="Phone" value={user.phone} />
            <Row label="Branch" value={user.branch} />
            <Row label="Role" value={user.role} />
            {user.linkedAccountType && <Row label="Linked Account" value={`Real ${user.linkedAccountType} account`} />}
            {user.pospType && <Row label="POSP Type" value={user.pospType} />}
            {user.pospCode && <Row label="POSP Code (System)" value={user.pospCode} />}
            {user.irdaiPospCode && <Row label="IRDAI POSP Code" value={user.irdaiPospCode} />}
            <Row label="Status" value={user.isActive ? "Active" : "Inactive"} />
            {user.payoutPercentage != null && <Row label="Payout Percentage" value={`${user.payoutPercentage}%`} />}
          </div>

          {user.bankDetails?.accountNumber && (
            <>
              <div className={am.sectionBanner} style={{ marginTop: 14 }}>
                <span className={am.sectionBannerText}>Bank Details</span>
              </div>
              <div style={{ background: "#f8faff", borderRadius: 10, padding: "12px 14px", fontSize: 13, lineHeight: 1.7 }}>
                <div style={{ fontWeight: 700 }}>{user.bankDetails.accountHolderName}</div>
                <div>Bank: {user.bankDetails.bankName}</div>
                <div>IFSC: {user.bankDetails.ifscCode}</div>
                <div>Account: {String(user.bankDetails.accountNumber).replace(/.(?=.{4})/g, "*")}</div>
                {user.bankDetails.cancelledCheque && (
                  <a
                    href={user.bankDetails.cancelledCheque.data}
                    download={user.bankDetails.cancelledCheque.fileName}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, color: "#1876bd", textDecoration: "none" }}
                  >
                    <FiEye size={13} /> {user.bankDetails.cancelledCheque.fileName}
                  </a>
                )}
              </div>
            </>
          )}

          <div className={am.sectionBanner} style={{ marginTop: 14 }}>
            <span className={am.sectionBannerText}>Access Modules</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[...user.accessModules, ...user.adminAccessModules].length === 0 ? (
              <span style={{ color: "#9ca3af", fontSize: 13 }}>No modules granted.</span>
            ) : (
              [...user.accessModules, ...user.adminAccessModules].map((m) => (
                <span
                  key={m}
                  style={{ background: "#e7f2fb", color: "#176eaa", borderRadius: 999, padding: "5px 12px", fontSize: 12.5, fontWeight: 600 }}
                >
                  {m}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


const EMPTY_ROLE = { name: "", description: "", hasPospFields: false, isActive: true };

function RolesModal({
  roles,
  onClose,
  onChanged,
}: {
  roles: StaffRoleRow[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [form, setForm] = useState(EMPTY_ROLE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editing = roles.find((r) => r._id === editingId);

  const reset = () => {
    setForm(EMPTY_ROLE);
    setEditingId(null);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Role name is required");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/staff-roles", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return toast.error(data.message || "Failed to save role");
      toast.success(editingId ? "Role updated" : "Role added");
      reset();
      onChanged();
    } catch {
      toast.error("Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: StaffRoleRow) => {
    if (!window.confirm(`Delete role "${r.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/staff-roles?id=${r._id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) return toast.error(data.message || "Failed to delete role");
      toast.success("Role deleted");
      if (editingId === r._id) reset();
      onChanged();
    } catch {
      toast.error("Failed to delete role");
    }
  };

  return (
    <div className={am.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={am.modal} style={{ maxWidth: 680 }}>
        <div className={am.header}>
          <h3 className={am.title}>Manage Roles</h3>
          <button type="button" className={am.closeBtn} onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>
        <div className={am.body}>
          <div className={um.roleForm}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>
              {editing ? `Edit role: ${editing.name}` : "Add a new role"}
            </div>
            <div className={am.grid2}>
              <Field label="Role Name" required>
                <input
                  className={am.input}
                  value={form.name}
                  disabled={!!editing?.isSystem}
                  placeholder="e.g. Telecaller, Accountant, POSP Partner"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <Field label="Description">
                <input
                  className={am.input}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </Field>
            </div>
            {!editing?.isSystem && (
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "4px 0 10px" }}>
                <label className={am.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.hasPospFields}
                    onChange={(e) => setForm((f) => ({ ...f, hasPospFields: e.target.checked }))}
                  />
                  POSP role (show POSP &amp; bank details on the user form)
                </label>
                <label className={am.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Active (can be assigned to new users)
                </label>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {editing && (
                <button type="button" className={am.cancelBtn} onClick={reset} disabled={saving}>
                  Cancel
                </button>
              )}
              <button type="button" className={am.saveBtn} onClick={save} disabled={saving}>
                {saving ? "Saving..." : editing ? "Save Role" : "Add Role"}
              </button>
            </div>
          </div>

          <div className={um.roleList}>
            {roles.map((r) => (
              <div key={r._id} className={um.roleItem}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={um.roleName}>
                    {r.name}
                    {r.isSystem && <span className={um.tag}>Built-in</span>}
                    {r.hasPospFields && <span className={`${um.tag} ${um.tagPosp}`}>POSP</span>}
                    {!r.isActive && <span className={`${um.tag} ${um.tagOff}`}>Inactive</span>}
                  </div>
                  <div className={um.roleMeta}>
                    {r.userCount || 0} user{r.userCount === 1 ? "" : "s"}
                    {r.description ? ` · ${r.description}` : ""}
                  </div>
                </div>
                <div className={um.actions}>
                  <button
                    type="button"
                    className={cm.iconActionBtn}
                    title="Edit role"
                    onClick={() => {
                      setEditingId(r._id);
                      setForm({
                        name: r.name,
                        description: r.description || "",
                        hasPospFields: r.hasPospFields,
                        isActive: r.isActive,
                      });
                    }}
                  >
                    <FiEdit2 size={14} />
                  </button>
                  {!r.isSystem && (
                    <button
                      type="button"
                      className={`${cm.iconActionBtn} ${um.dangerBtn}`}
                      title={r.userCount ? "Move its users to another role before deleting" : "Delete role"}
                      onClick={() => remove(r)}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type SortKey = "fullName" | "role" | "createdAt";
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function UserManagement() {
  const [users, setUsers] = useState<StaffUserRow[]>([]);
  const [roles, setRoles] = useState<StaffRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [rolesKey, setRolesKey] = useState(0);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [pospFilter, setPospFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editUser, setEditUser] = useState<StaffUserRow | null>(null);
  const [detailUser, setDetailUser] = useState<StaffUserRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/staff-users", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Refetched after user changes too, so per-role user counts stay right.
  useEffect(() => {
    fetch("/api/admin/staff-roles", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRoles(d.roles || []))
      .catch(() => setRoles([]));
  }, [rolesKey, refreshKey]);

  const systemRoleNames = useMemo(() => new Set(roles.filter((r) => r.isSystem).map((r) => r.name)), [roles]);
  const branchOptions = useMemo(
    () => Array.from(new Set(users.map((u) => u.branch).filter(Boolean) as string[])).sort(),
    [users]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate + "T00:00:00").getTime() : null;
    const to = toDate ? new Date(toDate + "T23:59:59").getTime() : null;
    const list = users.filter((u) => {
      if (q) {
        const hay = [u.fullName, u.email, u.phone, u.pospCode, u.irdaiPospCode, u.branch].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter === "active" && !u.isActive) return false;
      if (statusFilter === "inactive" && u.isActive) return false;
      if (branchFilter && (u.branch || "") !== branchFilter) return false;
      if (pospFilter === "__none" && u.pospType) return false;
      if (pospFilter && pospFilter !== "__none" && u.pospType !== pospFilter) return false;
      const created = u.createdAt ? new Date(u.createdAt).getTime() : null;
      if (from && (!created || created < from)) return false;
      if (to && (!created || created > to)) return false;
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const av = String(a[sortKey] || "").toLowerCase();
      const bv = String(b[sortKey] || "").toLowerCase();
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [users, search, roleFilter, statusFilter, branchFilter, pospFilter, fromDate, toDate, sortKey, sortDir]);

  // Any filter change sends you back to page 1 and drops a stale selection.
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [search, roleFilter, statusFilter, branchFilter, pospFilter, fromDate, toDate, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.isActive).length;
    return { total: users.length, active, inactive: users.length - active };
  }, [users]);

  const hasFilters = !!(search || roleFilter || statusFilter || branchFilter || pospFilter || fromDate || toDate);
  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setBranchFilter("");
    setPospFilter("");
    setFromDate("");
    setToDate("");
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
  };
  const sortTh = (k: SortKey, label: string) => (
    <th className={um.sortTh} onClick={() => toggleSort(k)}>
      <span>
        {label}
        {sortKey === k && (sortDir === "asc" ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />)}
      </span>
    </th>
  );

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((u) => selected.has(u._id));
  const toggleSelectPage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((u) => next.delete(u._id));
      else pageRows.forEach((u) => next.add(u._id));
      return next;
    });
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleStatus = async (user: StaffUserRow) => {
    const next = !user.isActive;
    setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isActive: next } : u)));
    setTogglingId(user._id);
    try {
      const res = await fetch("/api/admin/staff-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: user._id, isActive: next }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isActive: !next } : u)));
    } finally {
      setTogglingId(null);
    }
  };

  const bulkSetStatus = async (isActive: boolean) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/staff-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids, isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      toast.success(`${data.updated} user(s) ${isActive ? "activated" : "deactivated"}`);
      setUsers((prev) => prev.map((u) => (selected.has(u._id) ? { ...u, isActive } : u)));
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e.message || "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const deleteUser = async (user: StaffUserRow) => {
    const linkedNote = user.linkedAccountType ? `\n\nIts linked ${user.linkedAccountType} login will be deleted too.` : "";
    if (!window.confirm(`Delete ${user.fullName}? This can't be undone.${linkedNote}`)) return;
    try {
      const res = await fetch(`/api/admin/staff-users?id=${user._id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) return toast.error(data.message || "Failed to delete user");
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(user._id);
        return next;
      });
      setRolesKey((k) => k + 1);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const exportRows = async (rows: StaffUserRow[], format: "xlsx" | "csv") => {
    setShowExport(false);
    if (!rows.length) return toast.error("Nothing to export");
    try {
      const XLSX = await import("xlsx");
      const data = rows.map((u, i) => ({
        "S.No": i + 1,
        "Full Name": u.fullName,
        Email: u.email,
        Phone: u.phone,
        Role: u.role,
        Branch: u.branch || "",
        Status: u.isActive ? "Active" : "Inactive",
        "Linked Account": u.linkedAccountType || "",
        "POSP Type": u.pospType || "",
        "POSP Code": u.pospCode || "",
        "IRDAI POSP Code": u.irdaiPospCode || "",
        "Payout %": u.payoutPercentage ?? "",
        "Account Holder": u.bankDetails?.accountHolderName || "",
        "Bank Name": u.bankDetails?.bankName || "",
        IFSC: u.bankDetails?.ifscCode || "",
        // masked on purpose — exports get emailed around
        "Account No.": u.bankDetails?.accountNumber ? String(u.bankDetails.accountNumber).replace(/.(?=.{4})/g, "*") : "",
        City: u.city || "",
        State: u.state || "",
        Modules: [...(u.accessModules || []), ...(u.adminAccessModules || [])].join(", "),
        "Created On": fmtDate(u.createdAt),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");
      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `users-${stamp}.${format}`, { bookType: format });
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    }
  };

  const statCards = [
    { label: "Total Users", value: stats.total, icon: <FiUsers />, bg: "#e7f2fb", fg: "#1876bd", onClick: () => setStatusFilter(""), active: !statusFilter },
    { label: "Active", value: stats.active, icon: <FiUserCheck />, bg: "#ecfdf5", fg: "#059669", onClick: () => setStatusFilter("active"), active: statusFilter === "active" },
    { label: "Inactive", value: stats.inactive, icon: <FiUserX />, bg: "#fef2f2", fg: "#dc2626", onClick: () => setStatusFilter("inactive"), active: statusFilter === "inactive" },
    { label: "Roles", value: roles.length, icon: <FiShield />, bg: "#eef2ff", fg: "#4338ca", onClick: () => setShowRoles(true), active: false },
  ];

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.heading}>User Management</h2>
          <p className={um.subtitle}>Create staff logins, assign roles and control which modules each person can see.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.outlineBtn} onClick={() => setShowRoles(true)}>
            <FiShield /> Manage Roles
          </button>
          <div className={um.dropdownWrap}>
            <button className={styles.outlineBtn} onClick={() => setShowExport((v) => !v)}>
              <FiDownload /> Export
            </button>
            {showExport && (
              <div className={um.dropdownMenu} onMouseLeave={() => setShowExport(false)}>
                <button className={um.dropdownItem} onClick={() => exportRows(filtered, "xlsx")}>
                  <FiGrid size={14} /> Excel — filtered ({filtered.length})
                </button>
                <button className={um.dropdownItem} onClick={() => exportRows(filtered, "csv")}>
                  <FiFileText size={14} /> CSV — filtered ({filtered.length})
                </button>
                <button className={um.dropdownItem} onClick={() => exportRows(users, "xlsx")}>
                  <FiGrid size={14} /> Excel — all users ({users.length})
                </button>
              </div>
            )}
          </div>
          <button
            className={styles.primaryBtn}
            onClick={() => {
              setEditUser(null);
              setShowForm(true);
            }}
          >
            <FiPlus /> Add New
          </button>
        </div>
      </div>

      <div className={um.stats}>
        {statCards.map((c) => (
          <button key={c.label} type="button" className={`${um.statCard} ${c.active ? um.statCardActive : ""}`} onClick={c.onClick}>
            <span className={um.statIcon} style={{ background: c.bg, color: c.fg }}>
              {c.icon}
            </span>
            <span>
              <div className={um.statLabel}>{c.label}</div>
              <div className={um.statValue}>{c.value}</div>
            </span>
          </button>
        ))}
      </div>

      <div className={um.filterBar}>
        <div className={styles.searchInput}>
          <FiSearch size={12} />
          <input placeholder="Search name, email, phone, POSP code" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r._id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="">All Branches</option>
          {branchOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select value={pospFilter} onChange={(e) => setPospFilter(e.target.value)}>
          <option value="">All POSP Types</option>
          {POSP_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          <option value="__none">Non-POSP</option>
        </select>
        <div className={um.dateRow}>
          <label>
            Created from
            <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label>
            to
            <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <button type="button" className={um.resetBtn} disabled={!hasFilters} onClick={resetFilters}>
            <FiRotateCcw size={13} /> Reset filters
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className={um.bulkBar}>
          {selected.size} selected
          <button className={um.bulkBtn} disabled={bulkBusy} onClick={() => bulkSetStatus(true)}>
            <FiUserCheck size={13} /> Activate
          </button>
          <button className={um.bulkBtn} disabled={bulkBusy} onClick={() => bulkSetStatus(false)}>
            <FiUserX size={13} /> Deactivate
          </button>
          <button className={um.bulkBtn} disabled={bulkBusy} onClick={() => exportRows(users.filter((u) => selected.has(u._id)), "xlsx")}>
            <FiDownload size={13} /> Export selected
          </button>
          <button className={um.bulkBtn} onClick={() => setSelected(new Set())}>
            <FiX size={13} /> Clear
          </button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table} style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectPage} aria-label="Select page" />
              </th>
              {sortTh("fullName", "Name")}
              <th>User Information</th>
              <th>POSP Type</th>
              {sortTh("role", "Role")}
              {sortTh("createdAt", "Created On")}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>
                  Loading users...
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>
                  {hasFilters ? "No users match these filters." : "No users yet."}
                </td>
              </tr>
            ) : (
              pageRows.map((u) => (
                <tr key={u._id}>
                  <td>
                    <input type="checkbox" checked={selected.has(u._id)} onChange={() => toggleSelect(u._id)} aria-label={`Select ${u.fullName}`} />
                  </td>
                  <td>
                    <button type="button" className={cm.nameLink} onClick={() => setDetailUser(u)}>
                      {u.fullName}
                    </button>
                    {u.linkedAccountType && (
                      <div style={{ fontSize: 10.5, color: "#0ca36e", fontWeight: 700, marginTop: 2 }}>
                        Linked {u.linkedAccountType} account
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                    <div>Email: {u.email}</div>
                    <div>Phone: {u.phone}</div>
                    {u.branch && <div>Branch Name: {u.branch}</div>}
                    {u.pospCode && <div>POSP Code: {u.pospCode}</div>}
                    {u.irdaiPospCode && <div>IRDAI POSP Code: {u.irdaiPospCode}</div>}
                  </td>
                  <td>{u.pospType || "—"}</td>
                  <td>
                    <span className={`${um.roleBadge} ${systemRoleNames.has(u.role) ? um.roleBadgeSystem : ""}`}>{u.role}</span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDate(u.createdAt)}</td>
                  <td>
                    <label className={cm.toggle}>
                      <input type="checkbox" checked={u.isActive} disabled={togglingId === u._id} onChange={() => toggleStatus(u)} />
                      <span className={cm.toggleSlider} />
                    </label>
                  </td>
                  <td>
                    <div className={um.actions}>
                      <button type="button" className={cm.iconActionBtn} title="View" onClick={() => setDetailUser(u)}>
                        <FiEye size={14} />
                      </button>
                      <button
                        type="button"
                        className={cm.iconActionBtn}
                        title="Edit"
                        onClick={() => {
                          setEditUser(u);
                          setShowForm(true);
                        }}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button type="button" className={`${cm.iconActionBtn} ${um.dangerBtn}`} title="Delete" onClick={() => deleteUser(u)}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className={um.pager}>
          <div>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            {filtered.length !== users.length ? ` (filtered from ${users.length})` : ""}
            <span style={{ marginLeft: 14 }}>
              Rows
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </span>
          </div>
          <div className={um.pagerBtns}>
            <button className={um.pageBtn} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
              .map((n, i, arr) => (
                <React.Fragment key={n}>
                  {i > 0 && n - arr[i - 1] > 1 && <span>…</span>}
                  <button className={`${um.pageBtn} ${n === currentPage ? um.pageBtnActive : ""}`} onClick={() => setPage(n)}>
                    {n}
                  </button>
                </React.Fragment>
              ))}
            <button className={um.pageBtn} disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
              ›
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <UserFormModal
          editUser={editUser}
          roles={roles}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
      {showRoles && <RolesModal roles={roles} onClose={() => setShowRoles(false)} onChanged={() => setRolesKey((k) => k + 1)} />}
      {detailUser && <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />}
    </div>
  );
}
