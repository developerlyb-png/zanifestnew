"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiArrowLeft, FiCheckCircle, FiUserPlus, FiEdit3, FiX } from "react-icons/fi";
import am from "@/styles/components/superadminsidebar/AddClientModal.module.css";
import cm from "@/styles/components/superadminsidebar/ClientManagement.module.css";
import { KYC_DOCUMENT_TYPES } from "@/constants/policyFormOptions";

interface SubClient {
  name: string;
  phone: string;
  email: string;
}

interface KycFile {
  data: string;
  fileName: string;
}

export default function ClientForm({
  editId,
  onCancel,
  onSaved,
}: {
  editId?: string;
  onCancel: () => void;
  onSaved: (clientId: string) => void;
}) {
  const isEdit = !!editId;

  const [loadingClient, setLoadingClient] = useState(isEdit);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [kycDocumentType, setKycDocumentType] = useState("");
  const [kycFiles, setKycFiles] = useState<KycFile[]>([]);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [subClients, setSubClients] = useState<SubClient[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editId) return;
    setLoadingClient(true);
    fetch(`/api/admin/clients?id=${editId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.message);
        const c = d.client;
        setName(c.name || "");
        setEmail(c.email || "");
        setPhone(c.phone || "");
        setAddress(c.address || "");
        setKycDocumentType(c.kycDocumentType || "");
        setKycFiles(c.kycFiles || []);
        setNotifyWhatsapp(!!c.notifyWhatsapp);
        setNotifyEmail(!!c.notifyEmail);
        setIsGlobal(!!c.isGlobal);
        setIsActive(c.isActive !== false);
        setSubClients(c.subClients || []);
      })
      .catch((e: any) => toast.error(e.message || "Failed to load client"))
      .finally(() => setLoadingClient(false));
  }, [editId]);

  const handleKycFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setKycFiles((prev) => [...prev, { data: reader.result as string, fileName: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeKycFile = (i: number) => setKycFiles((prev) => prev.filter((_, idx) => idx !== i));

  const addSubClient = () => setSubClients((prev) => [...prev, { name: "", phone: "", email: "" }]);
  const updateSubClient = (index: number, key: keyof SubClient, value: string) =>
    setSubClients((prev) => prev.map((sc, i) => (i === index ? { ...sc, [key]: value } : sc)));
  const removeSubClient = (index: number) => setSubClients((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Required";
    if (!email.trim()) e.email = "Required";
    if (!phone.trim()) e.phone = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        name,
        email,
        phone,
        address,
        kycDocumentType,
        kycFiles,
        notifyWhatsapp,
        notifyEmail,
        isGlobal,
        subClients: subClients.filter((sc) => sc.name.trim()),
      };

      let res: Response;
      if (isEdit) {
        payload.id = editId;
        payload.isActive = isActive;
        res = await fetch("/api/admin/clients", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || `Failed to ${isEdit ? "update" : "save"} client`);
        return;
      }
      toast.success(isEdit ? "Client updated" : "Client added");
      onSaved(data.client._id);
    } catch {
      toast.error(`Failed to ${isEdit ? "update" : "save"} client. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingClient) {
    return (
      <div className={`${cm.formWrap} ${cm.clientFormPanel}`}>
        <button type="button" className={cm.backLink} onClick={onCancel}>
          <FiArrowLeft /> Back to clients
        </button>
        <p style={{ color: "#94a3b8", fontSize: 13.5 }}>Loading client...</p>
      </div>
    );
  }

  return (
    <div className={`${cm.formWrap} ${cm.clientFormPanel}`}>
      <button type="button" className={cm.backLink} onClick={onCancel}>
        <FiArrowLeft /> Back to clients
      </button>

      <div className={cm.formHeader}>
        <span className={cm.formIcon}>{isEdit ? <FiEdit3 /> : <FiUserPlus />}</span>
        <div>
          <h1 className={cm.formTitle}>{isEdit ? "Edit Client" : "Add Client"}</h1>
          <p className={cm.formSub}>
            {isEdit ? "Update this client's details, KYC files and sub-clients." : "Add a new client to the directory."}
          </p>
        </div>
      </div>

      <div className={cm.formCard}>
        <h3 className={cm.formCardTitle}>Basic Client Details</h3>
        <div className={am.grid2}>
          <div className={am.field}>
            <label className={am.label}>
              Client Name <span className={am.required}>*</span>
            </label>
            <input
              className={`${am.input} ${errors.name ? am.errorInput : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className={am.field}>
            <label className={am.label}>
              Email Address <span className={am.required}>*</span>
            </label>
            <input
              type="email"
              className={`${am.input} ${errors.email ? am.errorInput : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={am.field}>
            <label className={am.label}>
              Phone Number <span className={am.required}>*</span>
            </label>
            <input
              className={`${am.input} ${errors.phone ? am.errorInput : ""}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </div>
          <div className={am.field}>
            <label className={am.label}>KYC Document Type</label>
            <select className={am.select} value={kycDocumentType} onChange={(e) => setKycDocumentType(e.target.value)}>
              <option value="">Select an option...</option>
              {KYC_DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={am.field} style={{ marginTop: 4 }}>
          <label className={am.label}>Upload KYC Files</label>
          <label className={am.dropzone}>
            <span className={am.dropzoneTitle}>Upload multiple KYC files</span>
            <span className={am.dropzoneHint}>PDF, JPG, PNG up to 10MB</span>
            <input type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleKycFiles} />
          </label>
          {kycFiles.length > 0 && (
            <div className={am.fileList}>
              {kycFiles.map((f, i) => (
                <span key={i} className={am.fileChip} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {f.fileName}
                  <button
                    type="button"
                    onClick={() => removeKycFile(i)}
                    style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", display: "inline-flex" }}
                  >
                    <FiX size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={cm.formCard}>
        <h3 className={cm.formCardTitle}>Address</h3>
        <div className={am.field}>
          <textarea className={am.textarea} rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>

      <div className={cm.formCard}>
        <h3 className={cm.formCardTitle}>Notifications &amp; Visibility</h3>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <label className={am.checkboxRow}>
            <input type="checkbox" checked={notifyWhatsapp} onChange={(e) => setNotifyWhatsapp(e.target.checked)} />
            WhatsApp
          </label>
          <label className={am.checkboxRow}>
            <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
            Email
          </label>
          <label className={am.checkboxRow}>
            <input type="checkbox" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} />
            Make Global (Visible to all Sales Managers)
          </label>
        </div>

        {isEdit && (
          <div className={cm.statusToggleRow} style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #eef1f6" }}>
            <label className={cm.toggle}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className={cm.toggleSlider} />
            </label>
            <div>
              <div className={cm.statusToggleLabel}>{isActive ? "Active" : "Inactive"}</div>
              <div className={cm.statusToggleHint}>Inactive clients are hidden from policy creation.</div>
            </div>
          </div>
        )}
      </div>

      <div className={cm.formCard}>
        <div className={am.subClientHeader} style={{ marginTop: 0 }}>
          <span className={cm.formCardTitle} style={{ marginBottom: 0 }}>
            Sub-Client Details
          </span>
          <button type="button" className={am.addSubClientBtn} onClick={addSubClient}>
            + Add Sub-Client
          </button>
        </div>

        {subClients.length === 0 ? (
          <div className={am.emptySubClients}>No sub-clients added yet.</div>
        ) : (
          <div className={am.subClientList}>
            {subClients.map((sc, i) => (
              <div key={i} className={am.subClientRow}>
                <input
                  className={am.input}
                  placeholder="Name"
                  value={sc.name}
                  onChange={(e) => updateSubClient(i, "name", e.target.value)}
                />
                <input
                  className={am.input}
                  placeholder="Phone"
                  value={sc.phone}
                  onChange={(e) => updateSubClient(i, "phone", e.target.value)}
                />
                <input
                  className={am.input}
                  placeholder="Email"
                  value={sc.email}
                  onChange={(e) => updateSubClient(i, "email", e.target.value)}
                />
                <button type="button" className={am.removeSubClientBtn} onClick={() => removeSubClient(i)}>
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={cm.stickyBar}>
        <button type="button" className={cm.btnGhost} onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className={cm.btnPrimary} onClick={handleSave} disabled={submitting}>
          <FiCheckCircle /> {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Client"}
        </button>
      </div>
    </div>
  );
}
