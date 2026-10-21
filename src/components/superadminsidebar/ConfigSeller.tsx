"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/superadminsidebar/SellerProfile.module.css";
import { toast } from "react-hot-toast";
import {
  FiArrowLeft,
  FiBriefcase,
  FiMapPin,
  FiHome,
  FiDollarSign,
  FiFileText,
  FiCreditCard,
  FiImage,
  FiUser,
  FiUploadCloud,
  FiEye,
  FiTrash2,
  FiRepeat,
  FiPlus,
  FiCheckCircle,
} from "react-icons/fi";

interface FileValue {
  data: string;
  fileName: string;
}

interface Address {
  line1: string;
  line2: string;
  pincode: string;
  city: string;
  state: string;
}

interface SellerProfileRow {
  _id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  mobile: string;
  isDefault: boolean;
  createdAt: string;
}

interface FormState {
  companyName: string;
  irdaLicenseNo: string;
  licenseExpiryDate: string;
  pan: string;
  gstin: string;
  cin: string;
  contactPerson: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;

  registeredAddress: Address;
  useRegisteredAsCorporate: boolean;
  corporateAddress: Address;

  coinSection: string;
  coinValueInr: string;

  invoiceSeries: string;
  lastSequenceUsed: string;

  bank: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch: string;
  };
  showBankDetailsOnInvoice: boolean;

  companyLogo: FileValue | null;
  signatureImage: FileValue | null;
  principalOfficerName: string;
  principalOfficerStamp: FileValue | null;
  principalOfficerSignature: FileValue | null;

  isDefault: boolean;
}

const EMPTY_ADDRESS: Address = { line1: "", line2: "", pincode: "", city: "", state: "" };

const EMPTY_FORM: FormState = {
  companyName: "",
  irdaLicenseNo: "",
  licenseExpiryDate: "",
  pan: "",
  gstin: "",
  cin: "",
  contactPerson: "",
  email: "",
  phone: "",
  mobile: "",
  website: "",
  registeredAddress: { ...EMPTY_ADDRESS },
  useRegisteredAsCorporate: true,
  corporateAddress: { ...EMPTY_ADDRESS },
  coinSection: "Coin",
  coinValueInr: "",
  invoiceSeries: "",
  lastSequenceUsed: "0",
  bank: { accountName: "", accountNumber: "", ifscCode: "", bankName: "", branch: "" },
  showBankDetailsOnInvoice: true,
  companyLogo: null,
  signatureImage: null,
  principalOfficerName: "",
  principalOfficerStamp: null,
  principalOfficerSignature: null,
  isDefault: false,
};

const MAX_FILE_BYTES = 2 * 1024 * 1024;

function toForm(p: any): FormState {
  return {
    companyName: p.companyName || "",
    irdaLicenseNo: p.irdaLicenseNo || "",
    licenseExpiryDate: p.licenseExpiryDate ? String(p.licenseExpiryDate).slice(0, 10) : "",
    pan: p.pan || "",
    gstin: p.gstin || "",
    cin: p.cin || "",
    contactPerson: p.contactPerson || "",
    email: p.email || "",
    phone: p.phone || "",
    mobile: p.mobile || "",
    website: p.website || "",
    registeredAddress: { ...EMPTY_ADDRESS, ...(p.registeredAddress || {}) },
    useRegisteredAsCorporate: p.useRegisteredAsCorporate !== false,
    corporateAddress: { ...EMPTY_ADDRESS, ...(p.corporateAddress || {}) },
    coinSection: p.coinSection || "Coin",
    coinValueInr: p.coinValueInr !== undefined ? String(p.coinValueInr) : "",
    invoiceSeries: p.invoiceSeries || "",
    lastSequenceUsed: p.lastSequenceUsed !== undefined ? String(p.lastSequenceUsed) : "0",
    bank: { accountName: "", accountNumber: "", ifscCode: "", bankName: "", branch: "", ...(p.bank || {}) },
    showBankDetailsOnInvoice: p.showBankDetailsOnInvoice !== false,
    companyLogo: p.companyLogo || null,
    signatureImage: p.signatureImage || null,
    principalOfficerName: p.principalOfficerName || "",
    principalOfficerStamp: p.principalOfficerStamp || null,
    principalOfficerSignature: p.principalOfficerSignature || null,
    isDefault: !!p.isDefault,
  };
}

// Module-level so inputs keep focus while typing.
function Field({
  label,
  required,
  optional,
  err,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  err?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.req}>*</span>}
        {optional && <span className={styles.optionalTag}>(optional)</span>}
      </label>
      {children}
      {err && <span className={styles.errorText}>{err}</span>}
    </div>
  );
}

function Section({
  icon,
  title,
  sub,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionIconWrap}>{icon}</span>
        <div>
          <div className={styles.sectionTitle}>{title}</div>
          <div className={styles.sectionSub}>{sub}</div>
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function FileField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: FileValue | null;
  onChange: (f: FileValue | null) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File size must be ≤ 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange({ data: reader.result as string, fileName: file.name });
    reader.readAsDataURL(file);
  };

  const sizeLabel = (dataUri: string) => {
    const bytes = Math.round((dataUri.length * 3) / 4);
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  return (
    <Field label={label} required err={error}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {value?.data ? (
        <div className={styles.fileFilled}>
          <img src={value.data} alt={value.fileName} className={styles.fileThumb} />
          <div className={styles.fileInfo}>
            <div className={styles.fileName}>{value.fileName}</div>
            <div className={styles.fileMeta}>{sizeLabel(value.data)}</div>
          </div>
          <div className={styles.fileActions}>
            <button type="button" className={styles.fileActionBtn} title="View" onClick={() => window.open(value.data, "_blank")}>
              <FiEye size={15} />
            </button>
            <button type="button" className={styles.fileActionBtn} title="Replace" onClick={() => inputRef.current?.click()}>
              <FiRepeat size={14} />
            </button>
            <button
              type="button"
              className={`${styles.fileActionBtn} ${styles.fileActionDanger}`}
              title="Remove"
              onClick={() => onChange(null)}
            >
              <FiTrash2 size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`${styles.dropzone} ${error ? styles.dropzoneError : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <FiUploadCloud className={styles.dropzoneIcon} />
          <span className={styles.dropzoneText}>Click or drag to upload</span>
          <span className={styles.dropzoneHint}>PNG or JPG, up to 2MB</span>
        </div>
      )}
    </Field>
  );
}

function SellerProfileForm({
  profileId,
  onCancel,
  onSaved,
}: {
  profileId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!profileId;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    fetch(`/api/admin/seller-profiles?id=${profileId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setForm(toForm(d.profile));
        else toast.error(d.message || "Failed to load seller profile");
      })
      .catch(() => toast.error("Failed to load seller profile"))
      .finally(() => setLoading(false));
  }, [profileId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setAddr = (which: "registeredAddress" | "corporateAddress", key: keyof Address, value: string) =>
    setForm((f) => ({ ...f, [which]: { ...f[which], [key]: value } }));
  const setBank = (key: keyof FormState["bank"], value: string) =>
    setForm((f) => ({ ...f, bank: { ...f.bank, [key]: value } }));

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const req = (key: string, val: string) => {
      if (!val.trim()) e[key] = "Required";
    };
    req("companyName", form.companyName);
    req("pan", form.pan);
    req("gstin", form.gstin);
    req("contactPerson", form.contactPerson);
    req("email", form.email);
    req("phone", form.phone);
    req("mobile", form.mobile);
    req("website", form.website);

    req("regLine1", form.registeredAddress.line1);
    req("regPincode", form.registeredAddress.pincode);
    req("regCity", form.registeredAddress.city);
    req("regState", form.registeredAddress.state);

    if (!form.useRegisteredAsCorporate) {
      req("corpLine1", form.corporateAddress.line1);
      req("corpPincode", form.corporateAddress.pincode);
      req("corpCity", form.corporateAddress.city);
      req("corpState", form.corporateAddress.state);
    }

    req("coinSection", form.coinSection);
    if (!form.coinValueInr.trim()) e.coinValueInr = "Required";
    req("invoiceSeries", form.invoiceSeries);

    req("accountName", form.bank.accountName);
    req("accountNumber", form.bank.accountNumber);
    req("ifscCode", form.bank.ifscCode);
    req("bankName", form.bank.bankName);
    req("branch", form.bank.branch);

    req("principalOfficerName", form.principalOfficerName);

    if (!form.companyLogo?.data) e.companyLogo = "Required";
    if (!form.signatureImage?.data) e.signatureImage = "Required";
    if (!form.principalOfficerStamp?.data) e.principalOfficerStamp = "Required";
    if (!form.principalOfficerSignature?.data) e.principalOfficerSignature = "Required";

    return e;
  };

  const save = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        id: profileId || undefined,
        coinValueInr: Number(form.coinValueInr) || 0,
        lastSequenceUsed: Number(form.lastSequenceUsed) || 0,
      };
      const res = await fetch("/api/admin/seller-profiles", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to save seller profile");
        return;
      }
      toast.success(isEdit ? "Seller profile updated" : "Seller profile created");
      onSaved();
    } catch (err) {
      console.log("SAVE SELLER PROFILE ERROR", err);
      toast.error("Failed to save seller profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.formWrap}>Loading seller profile...</div>;
  }

  return (
    <div className={styles.formWrap}>
      <button type="button" className={styles.backLink} onClick={onCancel}>
        <FiArrowLeft /> Back to all seller profiles
      </button>
      <h1 className={styles.formTitle}>{isEdit ? "Edit Seller Profile" : "Configure Seller Profile"}</h1>
      <p className={styles.formSub}>
        This information appears on invoices generated under this seller profile.
      </p>

      <Section icon={<FiBriefcase />} title="Company Information" sub="Legal and tax identity of the entity">
        <Field label="Company Name" required err={errors.companyName}>
          <input
            className={`${styles.input} ${errors.companyName ? styles.errorInput : ""}`}
            value={form.companyName}
            onChange={(e) => set("companyName", e.target.value)}
          />
        </Field>
        <div className={styles.grid2}>
          <Field label="IRDA License No." optional>
            <input className={styles.input} value={form.irdaLicenseNo} onChange={(e) => set("irdaLicenseNo", e.target.value)} />
          </Field>
          <Field label="License Expiry Date" optional>
            <input
              type="date"
              className={styles.input}
              value={form.licenseExpiryDate}
              onChange={(e) => set("licenseExpiryDate", e.target.value)}
            />
          </Field>
          <Field label="PAN" required err={errors.pan}>
            <input
              className={`${styles.input} ${errors.pan ? styles.errorInput : ""}`}
              value={form.pan}
              onChange={(e) => set("pan", e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="GSTIN" required err={errors.gstin}>
            <input
              className={`${styles.input} ${errors.gstin ? styles.errorInput : ""}`}
              value={form.gstin}
              onChange={(e) => set("gstin", e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="CIN" optional>
            <input className={styles.input} value={form.cin} onChange={(e) => set("cin", e.target.value.toUpperCase())} />
          </Field>
          <Field label="Contact Person" required err={errors.contactPerson}>
            <input
              className={`${styles.input} ${errors.contactPerson ? styles.errorInput : ""}`}
              value={form.contactPerson}
              onChange={(e) => set("contactPerson", e.target.value)}
            />
          </Field>
          <Field label="Email" required err={errors.email}>
            <input
              type="email"
              className={`${styles.input} ${errors.email ? styles.errorInput : ""}`}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Phone" required err={errors.phone}>
            <input
              className={`${styles.input} ${errors.phone ? styles.errorInput : ""}`}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Mobile" required err={errors.mobile}>
            <input
              className={`${styles.input} ${errors.mobile ? styles.errorInput : ""}`}
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value)}
            />
          </Field>
          <Field label="Website" required err={errors.website}>
            <input
              className={`${styles.input} ${errors.website ? styles.errorInput : ""}`}
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section icon={<FiMapPin />} title="Registered Address" sub="Official registered address">
        <Field label="Address Line 1" required err={errors.regLine1}>
          <input
            className={`${styles.input} ${errors.regLine1 ? styles.errorInput : ""}`}
            value={form.registeredAddress.line1}
            onChange={(e) => setAddr("registeredAddress", "line1", e.target.value)}
          />
        </Field>
        <div className={styles.grid2}>
          <Field label="Address Line 2" optional>
            <input
              className={styles.input}
              value={form.registeredAddress.line2}
              onChange={(e) => setAddr("registeredAddress", "line2", e.target.value)}
            />
          </Field>
        </div>
        <div className={styles.grid3}>
          <Field label="Pincode" required err={errors.regPincode}>
            <input
              className={`${styles.input} ${errors.regPincode ? styles.errorInput : ""}`}
              value={form.registeredAddress.pincode}
              onChange={(e) => setAddr("registeredAddress", "pincode", e.target.value)}
            />
          </Field>
          <Field label="City" required err={errors.regCity}>
            <input
              className={`${styles.input} ${errors.regCity ? styles.errorInput : ""}`}
              value={form.registeredAddress.city}
              onChange={(e) => setAddr("registeredAddress", "city", e.target.value)}
            />
          </Field>
          <Field label="State" required err={errors.regState}>
            <input
              className={`${styles.input} ${errors.regState ? styles.errorInput : ""}`}
              value={form.registeredAddress.state}
              onChange={(e) => setAddr("registeredAddress", "state", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section icon={<FiHome />} title="Corporate Address" sub="Used on invoices if different from registered address">
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={form.useRegisteredAsCorporate}
            onChange={(e) => set("useRegisteredAsCorporate", e.target.checked)}
          />
          Use Registered Address as Corporate Address
        </label>
        <Field label="Address Line 1" required={!form.useRegisteredAsCorporate} err={errors.corpLine1}>
          <input
            className={`${styles.input} ${errors.corpLine1 ? styles.errorInput : ""}`}
            disabled={form.useRegisteredAsCorporate}
            value={form.useRegisteredAsCorporate ? form.registeredAddress.line1 : form.corporateAddress.line1}
            placeholder={form.useRegisteredAsCorporate ? form.registeredAddress.line1 : ""}
            onChange={(e) => setAddr("corporateAddress", "line1", e.target.value)}
          />
        </Field>
        <div className={styles.grid2}>
          <Field label="Address Line 2" optional>
            <input
              className={styles.input}
              disabled={form.useRegisteredAsCorporate}
              value={form.useRegisteredAsCorporate ? form.registeredAddress.line2 : form.corporateAddress.line2}
              onChange={(e) => setAddr("corporateAddress", "line2", e.target.value)}
            />
          </Field>
        </div>
        <div className={styles.grid3}>
          <Field label="Pincode" required={!form.useRegisteredAsCorporate} err={errors.corpPincode}>
            <input
              className={`${styles.input} ${errors.corpPincode ? styles.errorInput : ""}`}
              disabled={form.useRegisteredAsCorporate}
              value={form.useRegisteredAsCorporate ? form.registeredAddress.pincode : form.corporateAddress.pincode}
              onChange={(e) => setAddr("corporateAddress", "pincode", e.target.value)}
            />
          </Field>
          <Field label="City" required={!form.useRegisteredAsCorporate} err={errors.corpCity}>
            <input
              className={`${styles.input} ${errors.corpCity ? styles.errorInput : ""}`}
              disabled={form.useRegisteredAsCorporate}
              value={form.useRegisteredAsCorporate ? form.registeredAddress.city : form.corporateAddress.city}
              onChange={(e) => setAddr("corporateAddress", "city", e.target.value)}
            />
          </Field>
          <Field label="State" required={!form.useRegisteredAsCorporate} err={errors.corpState}>
            <input
              className={`${styles.input} ${errors.corpState ? styles.errorInput : ""}`}
              disabled={form.useRegisteredAsCorporate}
              value={form.useRegisteredAsCorporate ? form.registeredAddress.state : form.corporateAddress.state}
              onChange={(e) => setAddr("corporateAddress", "state", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section icon={<FiDollarSign />} title="Coins Management" sub="How coins/miles convert to rupees for this seller">
        <div className={styles.grid2}>
          <Field label="Section" required err={errors.coinSection}>
            <select
              className={`${styles.select} ${errors.coinSection ? styles.errorInput : ""}`}
              value={form.coinSection}
              onChange={(e) => set("coinSection", e.target.value)}
            >
              {["Coin", "Mile", "Point"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`1 ${form.coinSection || "Coin"} = __ INR`} required err={errors.coinValueInr}>
            <input
              type="number"
              min={0}
              className={`${styles.input} ${errors.coinValueInr ? styles.errorInput : ""}`}
              value={form.coinValueInr}
              onChange={(e) => set("coinValueInr", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section icon={<FiFileText />} title="Invoice Series Configuration" sub="Controls how invoice numbers are generated">
        <div className={styles.grid2}>
          <Field label="Invoice Series" required err={errors.invoiceSeries}>
            <input
              className={`${styles.input} ${errors.invoiceSeries ? styles.errorInput : ""}`}
              placeholder="e.g. ZAN-13"
              value={form.invoiceSeries}
              onChange={(e) => set("invoiceSeries", e.target.value)}
            />
          </Field>
          <Field label="Last Sequence Used" optional>
            <input
              type="number"
              min={0}
              className={styles.input}
              value={form.lastSequenceUsed}
              onChange={(e) => set("lastSequenceUsed", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section icon={<FiCreditCard />} title="Bank Details" sub="Account where policy and invoice payments are received">
        <div className={styles.grid2}>
          <Field label="Account Name" required err={errors.accountName}>
            <input
              className={`${styles.input} ${errors.accountName ? styles.errorInput : ""}`}
              value={form.bank.accountName}
              onChange={(e) => setBank("accountName", e.target.value)}
            />
          </Field>
          <Field label="Account Number" required err={errors.accountNumber}>
            <input
              className={`${styles.input} ${errors.accountNumber ? styles.errorInput : ""}`}
              value={form.bank.accountNumber}
              onChange={(e) => setBank("accountNumber", e.target.value)}
            />
          </Field>
          <Field label="IFSC Code" required err={errors.ifscCode}>
            <input
              className={`${styles.input} ${errors.ifscCode ? styles.errorInput : ""}`}
              value={form.bank.ifscCode}
              onChange={(e) => setBank("ifscCode", e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Bank Name" required err={errors.bankName}>
            <input
              className={`${styles.input} ${errors.bankName ? styles.errorInput : ""}`}
              value={form.bank.bankName}
              onChange={(e) => setBank("bankName", e.target.value)}
            />
          </Field>
          <Field label="Branch" required err={errors.branch}>
            <input
              className={`${styles.input} ${errors.branch ? styles.errorInput : ""}`}
              value={form.bank.branch}
              onChange={(e) => setBank("branch", e.target.value)}
            />
          </Field>
        </div>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={form.showBankDetailsOnInvoice}
            onChange={(e) => set("showBankDetailsOnInvoice", e.target.checked)}
          />
          Show bank details on invoice
        </label>
      </Section>

      <Section icon={<FiImage />} title="Logo & Signature" sub="Shown on every invoice generated with this profile">
        <div className={styles.fileGrid}>
          <FileField label="Company Logo" value={form.companyLogo} onChange={(v) => set("companyLogo", v)} error={errors.companyLogo} />
          <FileField label="Signature Image" value={form.signatureImage} onChange={(v) => set("signatureImage", v)} error={errors.signatureImage} />
        </div>
      </Section>

      <Section icon={<FiUser />} title="Principal Officer Information" sub="Authorised signatory details">
        <Field label="Principal Officer Name" required err={errors.principalOfficerName}>
          <input
            className={`${styles.input} ${errors.principalOfficerName ? styles.errorInput : ""}`}
            value={form.principalOfficerName}
            onChange={(e) => set("principalOfficerName", e.target.value)}
          />
        </Field>
        <div className={styles.fileGrid}>
          <FileField
            label="Principal Officer Stamp"
            value={form.principalOfficerStamp}
            onChange={(v) => set("principalOfficerStamp", v)}
            error={errors.principalOfficerStamp}
          />
          <FileField
            label="Principal Officer Signature"
            value={form.principalOfficerSignature}
            onChange={(v) => set("principalOfficerSignature", v)}
            error={errors.principalOfficerSignature}
          />
        </div>
      </Section>

      <div className={styles.stickyBar}>
        <div className={styles.stickyLeft}>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} />
            Set as Default Seller Profile
          </label>
        </div>
        <div className={styles.stickyRight}>
          <button type="button" className={styles.clearBtn} onClick={clearForm} disabled={saving}>
            Clear
          </button>
          <button type="button" className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Seller Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfigSeller() {
  const [profiles, setProfiles] = useState<SellerProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchProfiles = () => {
    setLoading(true);
    fetch("/api/admin/seller-profiles", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles || []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

  if (view === "form") {
    return (
      <SellerProfileForm
        profileId={editingId}
        onCancel={() => setView("list")}
        onSaved={() => {
          setView("list");
          fetchProfiles();
        }}
      />
    );
  }

  return (
    <div>
      <div className={styles.listHeader}>
        <div>
          <h1 className={styles.pageTitle}>Config Seller</h1>
          <p className={styles.pageSub}>Seller profiles used when generating invoices.</p>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => {
            setEditingId(null);
            setView("form");
          }}
        >
          <FiPlus size={15} /> Add New
        </button>
      </div>

      {loading ? (
        <div className={styles.tableCard}>
          <div className={styles.emptyState}>Loading seller profiles...</div>
        </div>
      ) : profiles.length === 0 ? (
        <div className={styles.tableCard}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <FiBriefcase />
            </span>
            <div className={styles.emptyTitle}>No seller profiles yet</div>
            <p className={styles.emptyText}>
              Create a seller profile with your company, bank and signature details to use when generating invoices.
            </p>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => {
                setEditingId(null);
                setView("form");
              }}
            >
              <FiPlus size={15} /> Create Seller Profile
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Created On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p._id}>
                  <td className={styles.nameCell}>{p.companyName}</td>
                  <td>{p.contactPerson}</td>
                  <td>{p.phone}</td>
                  <td>{p.mobile}</td>
                  <td>
                    {p.isDefault ? (
                      <span className={styles.defaultBadge}>
                        <FiCheckCircle size={12} /> Default
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{fmtDate(p.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.editBtn}
                      onClick={() => {
                        setEditingId(p._id);
                        setView("form");
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
