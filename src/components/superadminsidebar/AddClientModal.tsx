"use client";

import React, { useState } from "react";
import styles from "@/styles/components/superadminsidebar/AddClientModal.module.css";
import { FiX } from "react-icons/fi";
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

export interface ClientRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  subClients?: SubClient[];
}

interface AddClientModalProps {
  onClose: () => void;
  onCreated: (client: ClientRecord) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [kycDocumentType, setKycDocumentType] = useState("");
  const [kycFiles, setKycFiles] = useState<KycFile[]>([]);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [subClients, setSubClients] = useState<SubClient[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleKycFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds 10MB`);
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

  const addSubClient = () => {
    setSubClients((prev) => [...prev, { name: "", phone: "", email: "" }]);
  };

  const updateSubClient = (index: number, key: keyof SubClient, value: string) => {
    setSubClients((prev) => prev.map((sc, i) => (i === index ? { ...sc, [key]: value } : sc)));
  };

  const removeSubClient = (index: number) => {
    setSubClients((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name) e.name = "Required";
    if (!email) e.email = "Required";
    if (!phone) e.phone = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          kycDocumentType,
          kycFiles,
          notifyWhatsapp,
          notifyEmail,
          isGlobal,
          subClients: subClients.filter((sc) => sc.name),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "Failed to save client");
        return;
      }
      onCreated(data.client);
    } catch {
      setFormError("Failed to save client. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Add Client</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.sectionBanner}>Basic Client Details</div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>
                Client Name <span className={styles.required}>*</span>
              </label>
              <input
                className={`${styles.input} ${errors.name ? styles.errorInput : ""}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Email Address <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                className={`${styles.input} ${errors.email ? styles.errorInput : ""}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Phone Number <span className={styles.required}>*</span>
              </label>
              <input
                className={`${styles.input} ${errors.phone ? styles.errorInput : ""}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>KYC Document Type</label>
              <select
                className={styles.select}
                value={kycDocumentType}
                onChange={(e) => setKycDocumentType(e.target.value)}
              >
                <option value="">Select an option...</option>
                {KYC_DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Upload KYC Files</label>
            <label className={styles.dropzone}>
              <span className={styles.dropzoneTitle}>Upload multiple KYC files</span>
              <span className={styles.dropzoneHint}>PDF, JPG, PNG up to 10MB</span>
              <input type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleKycFiles} />
            </label>
            {kycFiles.length > 0 && (
              <div className={styles.fileList}>
                {kycFiles.map((f, i) => (
                  <span key={i} className={styles.fileChip}>
                    {f.fileName}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Address</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className={styles.notifyBox}>
              <div className={styles.notifyTitle}>Enable Notifications &amp; Visibility</div>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={notifyWhatsapp} onChange={(e) => setNotifyWhatsapp(e.target.checked)} />
                WhatsApp
              </label>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
                Email
              </label>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} />
                Make Global (Visible to all Sales Managers)
              </label>
            </div>
          </div>

          <div className={styles.subClientHeader}>
            <span className={styles.sectionBannerText}>Sub-Client Details</span>
            <button type="button" className={styles.addSubClientBtn} onClick={addSubClient}>
              + Add Sub-Client
            </button>
          </div>

          {subClients.length === 0 ? (
            <div className={styles.emptySubClients}>No sub-clients added yet.</div>
          ) : (
            <div className={styles.subClientList}>
              {subClients.map((sc, i) => (
                <div key={i} className={styles.subClientRow}>
                  <input
                    className={styles.input}
                    placeholder="Name"
                    value={sc.name}
                    onChange={(e) => updateSubClient(i, "name", e.target.value)}
                  />
                  <input
                    className={styles.input}
                    placeholder="Phone"
                    value={sc.phone}
                    onChange={(e) => updateSubClient(i, "phone", e.target.value)}
                  />
                  <input
                    className={styles.input}
                    placeholder="Email"
                    value={sc.email}
                    onChange={(e) => updateSubClient(i, "email", e.target.value)}
                  />
                  <button type="button" className={styles.removeSubClientBtn} onClick={() => removeSubClient(i)}>
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {formError && <div className={styles.formErrorBanner}>{formError}</div>}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;
