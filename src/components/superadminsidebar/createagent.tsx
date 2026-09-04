"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "@/styles/components/superadminsidebar/createagent.module.css";
import { FiEye, FiEyeOff, FiCheckCircle, FiX } from "react-icons/fi";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

/* ================= TYPES ================= */
type FormDataType = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  profileImage?: string;
  profileImageFileName?: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  adhaarNumber: string;
  panNumber: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeAadharNumber: string;
  nomineePanNumber: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchLocation: string;
  yearofpassing10th?: string;
  yearofpassing12th?: string;
};

type AttachmentType = {
  panAttachment: string | null;
  panFileName?: string;
  adhaarAttachment: string | null;
  adhaarFileName?: string;
  adhaarBackAttachment: string | null;
  adhaarBackFileName?: string;
  nomineePanAttachment: string | null;
  nomineePanFileName?: string;
  nomineeAadhaarAttachment: string | null;
  nomineeAadhaarFileName?: string;
  cancelledChequeAttachment: string | null;
  cancelledChequeFileName?: string;
  tenthMarksheetAttachment: string | null;
  tenthMarksheetFileName?: string;
  twelfthMarksheetAttachment: string | null;
  twelfthMarksheetFileName?: string;
};

/* ================= FILE INPUT ================= */
interface FileInputProps {
  label: string;
  name: keyof AttachmentType;
  fileName?: string;
  error?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileInput: React.FC<FileInputProps> = ({ label, name, fileName, error, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`${styles.simpleUploadWrapper} ${error ? styles.errorInput : ""}`}>
      <label>{label}</label>
      <div className={styles.simpleUploadBox}>
        <button type="button" onClick={() => fileRef.current?.click()}>
          Choose File
        </button>
        <span title={fileName || "No file chosen"}>{fileName || "No file chosen"}</span>
        <input ref={fileRef} type="file" name={name} hidden onChange={onChange} />
      </div>
    </div>
  );
};

// Human-readable names for the Agent-model field keys stored in
// agent.rejectedFields — shown to the agent in the rejection banner so
// "adhaarBackAttachment" reads as "Aadhaar Card (Back)", etc.
const REJECTED_FIELD_LABELS: Record<string, string> = {
  panNumber: "PAN Card",
  panAttachment: "PAN Card",
  adhaarNumber: "Aadhaar Card (Front)",
  adhaarAttachment: "Aadhaar Card (Front)",
  adhaarBackAttachment: "Aadhaar Card (Back)",
  // Legacy keys kept for old rejectedFields data recorded before the 10th/12th
  // marksheet split was consolidated into a single Educational Certificate.
  yearofpassing10th: "Educational Certificate",
  tenthMarksheetAttachment: "Educational Certificate",
  yearofpassing12th: "Educational Certificate",
  twelfthMarksheetAttachment: "Educational Certificate",
  accountNumber: "Bank Details / Cancelled Cheque",
  cancelledChequeAttachment: "Bank Details / Cancelled Cheque",
};

/* ================= MAIN ================= */
const CreateAgent = () => {
  const searchParams = useSearchParams();
  const urlLoginId = searchParams.get("loginId");
  const router = useRouter();

  const [loginId, setLoginId] = useState<string | null>(urlLoginId);
  // Captured once at mount — the effect below does router.replace("/createagent"),
  // which strips ?mode=edit from the URL. Deriving this live from searchParams
  // would flip it back to false right after that redirect, so we snapshot it
  // the same way loginId is snapshotted.
  const [isEditMode] = useState<boolean>(searchParams.get("mode") === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [rejectedFields, setRejectedFields] = useState<string[]>([]);
  const [rejectionRemark, setRejectionRemark] = useState("");
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [showPassword, setShowPassword] = useState(false);
  const [submittedStep, setSubmittedStep] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormDataType>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    profileImage: "",
    city: "",
    district: "",
    state: "",
    pinCode: "",
    adhaarNumber: "",
    panNumber: "",
    nomineeName: "",
    nomineeRelation: "",
    nomineeAadharNumber: "",
    nomineePanNumber: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchLocation: "",
  });

  const [attachments, setAttachments] = useState<AttachmentType>({
    panAttachment: null,
    adhaarAttachment: null,
    adhaarBackAttachment: null,
    nomineePanAttachment: null,
    nomineeAadhaarAttachment: null,
    cancelledChequeAttachment: null,
    tenthMarksheetAttachment: null,
    twelfthMarksheetAttachment: null,
  });

  const isLocked = (field: string) => {
    if (!isEditMode) return false;
    if (rejectedFields.length === 0) return true;
    return !rejectedFields.includes(field);
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = "Required";
      if (!formData.lastName) newErrors.lastName = "Required";
      if (!formData.phone) newErrors.phone = "Required";
      if (!formData.password) newErrors.password = "Required";
    }

    if (step === 2) {
      if (!formData.pinCode) newErrors.pinCode = "Required";
      if (!formData.panNumber) newErrors.panNumber = "Required";
      if (!formData.adhaarNumber) newErrors.adhaarNumber = "Required";
      if (!attachments.panAttachment) newErrors.panAttachment = "Upload required";
      if (!attachments.adhaarAttachment) newErrors.adhaarAttachment = "Upload required";
      if (!attachments.adhaarBackAttachment) newErrors.adhaarBackAttachment = "Upload required";
    }

    if (step === 3) {
      if (!attachments.tenthMarksheetAttachment) newErrors.tenthMarksheetAttachment = "Upload required";
    }

    if (step === 4) {
      if (!formData.nomineeName) newErrors.nomineeName = "Required";
      if (!formData.nomineeRelation) newErrors.nomineeRelation = "Required";
    }

    if (step === 5) {
      if (!formData.accountHolderName) newErrors.accountHolderName = "Required";
      if (!formData.bankName) newErrors.bankName = "Required";
      if (!formData.accountNumber) newErrors.accountNumber = "Required";
      if (!formData.ifscCode) newErrors.ifscCode = "Required";
      if (!formData.branchLocation) newErrors.branchLocation = "Required";
      if (!attachments.cancelledChequeAttachment) newErrors.cancelledChequeAttachment = "Upload required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (urlLoginId) {
      setLoginId(urlLoginId);
      router.replace("/createagent");
    }
  }, [urlLoginId]);

  useEffect(() => {
    if (!loginId) return;
    fetch(`/api/auth/fetchLogin?loginId=${loginId}`)
      .then((r) => r.json())
      .then((d) => {
        const parts = (d.name || "").split(" ");
        setFormData((p) => ({
          ...p,
          firstName: p.firstName || parts[0] || "",
          lastName: p.lastName || parts.slice(1).join(" "),
          email: p.email || d.email || "",
          password: p.password || d.password || "",
        }));
      });
  }, [loginId]);

  useEffect(() => {
    if (!loginId || !isEditMode) return;
    fetch(`/api/agent/by-loginId?loginId=${loginId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d?.agent) return;
        setFormData((p) => ({ ...p, ...d.agent }));
        const rejected = d.agent.rejectedFields || [];
        setRejectedFields(rejected);
        setRejectionRemark(d.agent.rejectionRemark || "");
        setAttachments({
          panAttachment: rejected.includes("panNumber") ? null : d.agent.panAttachment,
          panFileName: rejected.includes("panNumber") ? undefined : "PAN.pdf",
          adhaarAttachment: rejected.includes("adhaarNumber") ? null : d.agent.adhaarAttachment,
          adhaarFileName: rejected.includes("adhaarNumber") ? undefined : "Aadhaar.pdf",
          adhaarBackAttachment: rejected.includes("adhaarBackAttachment") ? null : d.agent.adhaarBackAttachment,
          adhaarBackFileName: rejected.includes("adhaarBackAttachment") ? undefined : "AadhaarBack.pdf",
          nomineePanAttachment: rejected.includes("nomineePanNumber") ? null : d.agent.nomineePanAttachment,
          nomineePanFileName: rejected.includes("nomineePanNumber") ? undefined : "NomineePAN.pdf",
          nomineeAadhaarAttachment: rejected.includes("nomineeAadharNumber") ? null : d.agent.nomineeAadhaarAttachment,
          nomineeAadhaarFileName: rejected.includes("nomineeAadharNumber") ? undefined : "NomineeAadhaar.pdf",
          cancelledChequeAttachment: rejected.includes("accountNumber") ? null : d.agent.cancelledChequeAttachment,
          cancelledChequeFileName: rejected.includes("accountNumber") ? undefined : "Cheque.pdf",
          tenthMarksheetAttachment: rejected.includes("tenthMarksheetAttachment") ? null : d.agent.tenthMarksheetAttachment ?? null,
          tenthMarksheetFileName: rejected.includes("tenthMarksheetAttachment") ? undefined : (d.agent.tenthMarksheetAttachment ? "Certificate.pdf" : undefined),
          // Legacy field — no longer collected (10th/12th marksheets were
          // consolidated into the single tenthMarksheetAttachment above).
          twelfthMarksheetAttachment: null,
        });
      });
  }, [loginId, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.id as keyof FormDataType;
    setFormData((p) => ({ ...p, [id]: e.target.value }));
  };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((p) => ({ ...p, pinCode: value }));
    if (value.length === 6) {
      const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
      const data = await res.json();
      const po = data[0]?.PostOffice?.[0];
      if (po) {
        setFormData((p) => ({ ...p, city: po.District, district: po.Name, state: po.State }));
      }
    }
  };

  const shortFileName = (name: string, limit = 5) => {
    if (!name) return "";
    const extIndex = name.lastIndexOf(".");
    const ext = extIndex !== -1 ? name.slice(extIndex) : "";
    const base = name.slice(0, extIndex !== -1 ? extIndex : name.length);
    return base.length > limit ? base.slice(0, limit) + "..." + ext : name;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.name as keyof AttachmentType;
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize =
      key === "panAttachment" || key === "adhaarAttachment" || key === "adhaarBackAttachment"
        ? 500 * 1024
        : 200 * 1024;

    if (file.size > maxSize) {
      alert(
        key === "panAttachment" || key === "adhaarAttachment" || key === "adhaarBackAttachment"
          ? "Please upload must be 500KB"
          : "File size must be ≤ 200KB"
      );
      e.target.value = "";
      setAttachments((p) => ({
        ...p,
        [key]: null,
        [`${key.replace("Attachment", "")}FileName`]: undefined,
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachments((p) => ({
        ...p,
        [key]: reader.result as string,
        [`${key.replace("Attachment", "")}FileName`]: shortFileName(file.name),
      }));
    };
    reader.readAsDataURL(file);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setFormData((prev) => ({
      ...prev,
      profileImage: base64,
      profileImageFileName: shortFileName(file.name),
    }));
  };

  // Lets the customer clear a wrongly-picked file and go back to "no file
  // chosen" instead of only being able to overwrite it by picking another.
  const clearProfileImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFormData((prev) => ({ ...prev, profileImage: undefined, profileImageFileName: undefined }));
  };

  const clearAttachment = (key: keyof AttachmentType) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAttachments((p) => ({
      ...p,
      [key]: null,
      [`${String(key).replace("Attachment", "")}FileName`]: undefined,
    }));
  };

  const onlyDigits = (value: string, max: number) => value.replace(/\D/g, "").slice(0, max);
  const formatAadhaar = (value: string) =>
    value.replace(/\D/g, "").slice(0, 12).replace(/(.{4})/g, "$1 ").trim();
  const formatPAN = (value: string) =>
    value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const onlyLetters = (value: string) => value.replace(/[^a-zA-Z\s]/g, "");
  const onlyLettersWithHyphen = (value: string) => value.replace(/[^a-zA-Z\s-]/g, "");
  const formatIFSC = (value: string) =>
    value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);

  useEffect(() => {
    setErrors({});
    setSubmittedStep(null);
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    let payload: any = { loginId };

    if (isEditMode) {
      if (rejectedFields.includes("panNumber")) {
        payload.panNumber = formData.panNumber;
        if (attachments.panAttachment) payload.panAttachment = attachments.panAttachment;
      }
      if (rejectedFields.includes("adhaarNumber")) {
        payload.adhaarNumber = formData.adhaarNumber;
        if (attachments.adhaarAttachment) payload.adhaarAttachment = attachments.adhaarAttachment;
      }
      if (rejectedFields.includes("adhaarBackAttachment") && attachments.adhaarBackAttachment) {
        payload.adhaarBackAttachment = attachments.adhaarBackAttachment;
      }
      if (rejectedFields.includes("tenthMarksheetAttachment")) {
        if (attachments.tenthMarksheetAttachment) payload.tenthMarksheetAttachment = attachments.tenthMarksheetAttachment;
      }
      if (rejectedFields.includes("accountNumber")) {
        payload.accountHolderName = formData.accountHolderName;
        payload.bankName = formData.bankName;
        payload.accountNumber = formData.accountNumber;
        payload.ifscCode = formData.ifscCode;
        payload.branchLocation = formData.branchLocation;
        if (attachments.cancelledChequeAttachment) payload.cancelledChequeAttachment = attachments.cancelledChequeAttachment;
      }
    } else {
      payload = { ...formData, ...attachments, loginId };
    }

    const res = await fetch("/api/createagent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) setShowSuccess(true);
  };

  const validateEditFields = () => {
    const newErrors: Record<string, string> = {};

    if (rejectedFields.includes("panNumber")) {
      if (!formData.panNumber) newErrors.panNumber = "Required";
      if (!attachments.panAttachment) newErrors.panAttachment = "Upload required";
    }
    if (rejectedFields.includes("adhaarNumber")) {
      if (!formData.adhaarNumber) newErrors.adhaarNumber = "Required";
      if (!attachments.adhaarAttachment) newErrors.adhaarAttachment = "Upload required";
    }
    if (rejectedFields.includes("adhaarBackAttachment")) {
      if (!attachments.adhaarBackAttachment) newErrors.adhaarBackAttachment = "Upload required";
    }
    if (rejectedFields.includes("tenthMarksheetAttachment")) {
      if (!attachments.tenthMarksheetAttachment) newErrors.tenthMarksheetAttachment = "Upload required";
    }
    if (rejectedFields.includes("accountNumber")) {
      if (!formData.accountHolderName) newErrors.accountHolderName = "Required";
      if (!formData.bankName) newErrors.bankName = "Required";
      if (!formData.accountNumber) newErrors.accountNumber = "Required";
      if (!formData.ifscCode) newErrors.ifscCode = "Required";
      if (!formData.branchLocation) newErrors.branchLocation = "Required";
      if (!attachments.cancelledChequeAttachment) newErrors.cancelledChequeAttachment = "Upload required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEditFields()) return;

    const payload: any = { loginId };

    if (rejectedFields.includes("panNumber")) {
      payload.panNumber = formData.panNumber;
      if (attachments.panAttachment) payload.panAttachment = attachments.panAttachment;
    }
    if (rejectedFields.includes("adhaarNumber")) {
      payload.adhaarNumber = formData.adhaarNumber;
      if (attachments.adhaarAttachment) payload.adhaarAttachment = attachments.adhaarAttachment;
    }
    if (rejectedFields.includes("adhaarBackAttachment") && attachments.adhaarBackAttachment) {
      payload.adhaarBackAttachment = attachments.adhaarBackAttachment;
    }
    if (rejectedFields.includes("tenthMarksheetAttachment")) {
      if (attachments.tenthMarksheetAttachment) payload.tenthMarksheetAttachment = attachments.tenthMarksheetAttachment;
    }
    if (rejectedFields.includes("accountNumber")) {
      payload.accountHolderName = formData.accountHolderName;
      payload.bankName = formData.bankName;
      payload.accountNumber = formData.accountNumber;
      payload.ifscCode = formData.ifscCode;
      payload.branchLocation = formData.branchLocation;
      if (attachments.cancelledChequeAttachment) payload.cancelledChequeAttachment = attachments.cancelledChequeAttachment;
    }

    const res = await fetch("/api/createagent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) setShowSuccess(true);
  };

  const brandHeader = (
    <div className={styles.brandHeader}>
      <div className={styles.brandHeaderLeft}>
        <div className={styles.brandLogoBox}>
          <img src="/logo.png" alt="Zanifest" className={styles.brandLogo} />
        </div>
        <div className={styles.brandTextGroup}>
          <span className={styles.brandTitle}>Zanifest</span>
          <span className={styles.brandSubtitle}>Insurance Broking &amp; Agent Onboarding</span>
        </div>
      </div>
      <span className={styles.brandBadge}>
        {isEditMode ? "📋 Document Resubmission" : "🔒 Secure KYC Verification"}
      </span>
    </div>
  );

  const successModal = showSuccess && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          width: 320,
          textAlign: "center",
        }}
      >
        <p style={{ marginBottom: 20 }}>
          {isEditMode
            ? "Application resubmitted successfully. It will be reviewed again shortly."
            : "Agent application submitted successfully. Status will be updated after verification."}
        </p>
        <button
          onClick={() => {
            setShowSuccess(false);
            router.push("/agentlogin");
          }}
          style={{
            background: "#ff8a1f",
            color: "#fff",
            border: "none",
            padding: "10px 24px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Go to login page
        </button>
      </div>
    </div>
  );

  /* ================= EDIT MODE: REJECTED-FIELDS-ONLY VIEW ================= */
  if (isEditMode && rejectedFields.length > 0) {
    const rejectedLabel = Array.from(
      new Set(rejectedFields.map((f) => REJECTED_FIELD_LABELS[f as string] || f))
    ).join(", ");

    return (
      <div className={styles.container}>
        {brandHeader}

        <div className={styles.header}>
          <h2>Update Your Application</h2>
        </div>

        <div className={styles.rejectionBanner}>
          <strong>Your application was rejected.</strong>
          <p>
            Please reupload these documents and resubmit for review: <b>{rejectedLabel}</b>
          </p>
          {rejectionRemark && (
            <p>
              <b>Reason given by admin:</b> {rejectionRemark}
            </p>
          )}
        </div>

        <form onSubmit={handleEditSubmit} className={styles.form}>
          <div className={styles.step2Grid}>
            {rejectedFields.includes("panNumber") && (
              <>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="panNumber">PAN Number</label>
                  <input
                    id="panNumber"
                    placeholder="PAN Number"
                    value={formData.panNumber}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, panNumber: formatPAN(e.target.value) }))
                    }
                    className={`${styles.input} ${errors.panNumber ? styles.errorInput : ""}`}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>PAN Card</label>
                  <div className={`${styles.fileUpload} ${errors.panAttachment ? styles.errorInput : ""}`}>
                    <label className={styles.fileBox}>
                      <span className={styles.fileBtn}>Choose File</span>
                      {attachments.panFileName ? (
                        <>
                          <span className={styles.fileTextChosen} title={attachments.panFileName}>
                            <FiCheckCircle /> {attachments.panFileName}
                          </span>
                          <button
                            type="button"
                            className={styles.fileRemoveBtn}
                            onClick={clearAttachment("panAttachment")}
                            aria-label="Remove file"
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <span className={styles.fileText}>Upload PAN</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        name="panAttachment"
                        hidden
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {rejectedFields.includes("adhaarNumber") && (
              <>
                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <label className={styles.fieldLabel} htmlFor="adhaarNumber">Aadhaar Number</label>
                  <input
                    id="adhaarNumber"
                    placeholder="Aadhaar Number"
                    value={formData.adhaarNumber}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, adhaarNumber: formatAadhaar(e.target.value) }))
                    }
                    className={`${styles.input} ${errors.adhaarNumber ? styles.errorInput : ""}`}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Aadhaar Front</label>
                  <div className={`${styles.fileUpload} ${errors.adhaarAttachment ? styles.errorInput : ""}`}>
                    <label className={styles.fileBox}>
                      <span className={styles.fileBtn}>Choose File</span>
                      {attachments.adhaarFileName ? (
                        <>
                          <span className={styles.fileTextChosen} title={attachments.adhaarFileName}>
                            <FiCheckCircle /> {attachments.adhaarFileName}
                          </span>
                          <button
                            type="button"
                            className={styles.fileRemoveBtn}
                            onClick={clearAttachment("adhaarAttachment")}
                            aria-label="Remove file"
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <span className={styles.fileText}>Upload Aadhaar Front</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        name="adhaarAttachment"
                        hidden
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {rejectedFields.includes("adhaarBackAttachment") && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Aadhaar Back</label>
                <div className={`${styles.fileUpload} ${errors.adhaarBackAttachment ? styles.errorInput : ""}`}>
                  <label className={styles.fileBox}>
                    <span className={styles.fileBtn}>Choose File</span>
                    {attachments.adhaarBackFileName ? (
                      <>
                        <span className={styles.fileTextChosen} title={attachments.adhaarBackFileName}>
                          <FiCheckCircle /> {attachments.adhaarBackFileName}
                        </span>
                        <button
                          type="button"
                          className={styles.fileRemoveBtn}
                          onClick={clearAttachment("adhaarBackAttachment")}
                          aria-label="Remove file"
                        >
                          <FiX />
                        </button>
                      </>
                    ) : (
                      <span className={styles.fileText}>Upload Aadhaar Backside</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      name="adhaarBackAttachment"
                      hidden
                    />
                  </label>
                </div>
              </div>
            )}

            {rejectedFields.includes("tenthMarksheetAttachment") && (
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel}>Educational Certificate</label>
                <div className={`${styles.fileUpload} ${errors.tenthMarksheetAttachment ? styles.errorInput : ""}`}>
                  <label className={styles.fileBox}>
                    <span className={styles.fileBtn}>Choose File</span>
                    {attachments.tenthMarksheetFileName ? (
                      <>
                        <span className={styles.fileTextChosen} title={attachments.tenthMarksheetFileName}>
                          <FiCheckCircle /> {attachments.tenthMarksheetFileName}
                        </span>
                        <button
                          type="button"
                          className={styles.fileRemoveBtn}
                          onClick={clearAttachment("tenthMarksheetAttachment")}
                          aria-label="Remove file"
                        >
                          <FiX />
                        </button>
                      </>
                    ) : (
                      <span className={styles.fileText}>Upload Educational Certificate</span>
                    )}
                    <input
                      type="file"
                      name="tenthMarksheetAttachment"
                      onChange={handleFileChange}
                      hidden
                    />
                  </label>
                </div>
              </div>
            )}

            {rejectedFields.includes("accountNumber") && (
              <>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="accountHolderName">Account Holder Name</label>
                  <input
                    id="accountHolderName"
                    placeholder="Account Holder Name"
                    value={formData.accountHolderName}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, accountHolderName: onlyLetters(e.target.value) }))
                    }
                    className={`${styles.input} ${errors.accountHolderName ? styles.errorInput : ""}`}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="bankName">Bank Name</label>
                  <input
                    id="bankName"
                    placeholder="Bank Name"
                    value={formData.bankName}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, bankName: onlyLetters(e.target.value) }))
                    }
                    className={`${styles.input} ${errors.bankName ? styles.errorInput : ""}`}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="accountNumber">Account Number</label>
                  <input
                    id="accountNumber"
                    placeholder="Account Number"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, accountNumber: onlyDigits(e.target.value, 18) }))
                    }
                    className={`${styles.input} ${errors.accountNumber ? styles.errorInput : ""}`}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="ifscCode">IFSC Code</label>
                  <input
                    id="ifscCode"
                    placeholder="IFSC Code"
                    value={formData.ifscCode}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, ifscCode: formatIFSC(e.target.value) }))
                    }
                    className={`${styles.input} ${errors.ifscCode ? styles.errorInput : ""}`}
                  />
                </div>
                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <label className={styles.fieldLabel} htmlFor="branchLocation">Branch Location</label>
                  <input
                    id="branchLocation"
                    placeholder="Branch Location"
                    value={formData.branchLocation}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, branchLocation: onlyLettersWithHyphen(e.target.value) }))
                    }
                    className={`${styles.input} ${errors.branchLocation ? styles.errorInput : ""}`}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Cancelled Cheque</label>
                  <div className={`${styles.fileUpload} ${errors.cancelledChequeAttachment ? styles.errorInput : ""}`}>
                    <label className={styles.fileBox}>
                      <span className={styles.fileBtn}>Choose File</span>
                      {attachments.cancelledChequeFileName ? (
                        <>
                          <span className={styles.fileTextChosen} title={attachments.cancelledChequeFileName}>
                            <FiCheckCircle /> {attachments.cancelledChequeFileName}
                          </span>
                          <button
                            type="button"
                            className={styles.fileRemoveBtn}
                            onClick={clearAttachment("cancelledChequeAttachment")}
                            aria-label="Remove file"
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <span className={styles.fileText}>Upload Cancelled Cheque</span>
                      )}
                      <input
                        type="file"
                        name="cancelledChequeAttachment"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        hidden
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={styles.actions} style={{ justifyContent: "flex-end" }}>
            <button type="submit" className={styles.btnNext}>
              Reupload &amp; Resubmit for Review
            </button>
          </div>
        </form>

        {successModal}
      </div>
    );
  }

  /* ================= UI: FULL SIGNUP WIZARD ================= */
  return (
    <div className={styles.container}>
      {brandHeader}

      <div className={styles.header}>
        <h2>Create Agent</h2>

        <div className={styles.stepHeader}>
          <span className={styles.stepText}>Step {step} of {totalSteps}</span>
          <div className={styles.stepDots}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`${styles.dot} ${step >= s ? styles.activeDot : ""}`} />
            ))}
          </div>
          <span className={styles.percentText}>
            {Math.min(100, Math.round((step / totalSteps) * 100))}% complete
          </span>
        </div>
      </div>

      {/* ── Step 1 uses the two-column grid form ── */}
      <form
        onSubmit={handleSubmit}
        className={step === 1 ? styles.formGrid : styles.form}
      >
        {step === 1 && (
          <>
            <h3 className={styles.sectionTitle}>Basic Details</h3>

            {/* Col 1 */}
            <div className={`${styles.fieldGroup} ${styles.colLeft}`}>
              <label className={styles.fieldLabel} htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                placeholder="First Name"
                disabled
                value={formData.firstName}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            {/* Col 2 */}
            <div className={`${styles.fieldGroup} ${styles.colRight}`}>
              <label className={styles.fieldLabel} htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                placeholder="Last Name"
                disabled={isLocked("lastName")}
                value={formData.lastName}
                onChange={handleChange}
                className={`${styles.input} ${errors.lastName ? styles.errorInput : ""}`}
              />
            </div>

            {/* Full row */}
            <div className={`${styles.fieldGroup} ${styles.colFull}`}>
              <label className={styles.fieldLabel} htmlFor="email">Email</label>
              <input
                id="email"
                value={formData.email}
                disabled
                className={styles.input}
              />
            </div>

            {/* Col 1 */}
            <div className={`${styles.fieldGroup} ${styles.colLeft}`}>
              <label className={styles.fieldLabel} htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                placeholder="Phone"
                disabled={isLocked("phone")}
                value={formData.phone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: onlyDigits(e.target.value, 10) }))
                }
                className={`${styles.input} ${errors.phone ? styles.errorInput : ""}`}
              />
            </div>

            {/* Col 2 – Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  disabled
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                />
                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            </div>

            {/* Profile image – full row */}
            <div className={`${styles.fieldGroup} ${styles.colFull}`}>
              <label className={styles.fieldLabel}>Profile Picture</label>
              <label className={`${styles.fileUpload} ${styles.fileBox}`}>
                <span className={styles.fileBtn}>Choose File</span>
                {formData.profileImageFileName ? (
                  <>
                    <span className={styles.fileTextChosen} title={formData.profileImageFileName}>
                      <FiCheckCircle /> {formData.profileImageFileName}
                    </span>
                    <button
                      type="button"
                      className={styles.fileRemoveBtn}
                      onClick={clearProfileImage}
                      aria-label="Remove file"
                    >
                      <FiX />
                    </button>
                  </>
                ) : (
                  <span className={styles.fileText}>Upload your profile picture</span>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleProfileImageChange}
                  hidden
                />
              </label>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className={styles.sectionTitle}>Address & KYC</h3>

            <div className={styles.step2Grid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Pin Code</label>
                <input
                  placeholder="Pin Code"
                  value={formData.pinCode}
                  onChange={handlePincodeChange}
                  className={`${styles.input} ${errors.pinCode ? styles.errorInput : ""}`}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>City</label>
                <input
                  placeholder="City"
                  value={formData.city}
                  disabled
                  className={styles.input}
                />
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel}>State</label>
                <input
                  placeholder="State"
                  value={formData.state}
                  disabled
                  className={styles.input}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="panNumber">PAN Number</label>
                <input
                  id="panNumber"
                  placeholder="PAN Number"
                  disabled={isLocked("panNumber")}
                  value={formData.panNumber}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, panNumber: formatPAN(e.target.value) }))
                  }
                  className={`${styles.input} ${errors.panNumber ? styles.errorInput : ""}`}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>PAN Card</label>
              <div className={`${styles.fileUpload} ${errors.panAttachment ? styles.errorInput : ""}`}>
                <label className={styles.fileBox}>
                  <span className={styles.fileBtn}>Choose File</span>
                  {attachments.panFileName ? (
                    <>
                      <span className={styles.fileTextChosen} title={attachments.panFileName}>
                        <FiCheckCircle /> {attachments.panFileName}
                      </span>
                      <button
                        type="button"
                        className={styles.fileRemoveBtn}
                        onClick={clearAttachment("panAttachment")}
                        aria-label="Remove file"
                      >
                        <FiX />
                      </button>
                    </>
                  ) : (
                    <span className={styles.fileText}>Upload PAN</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    name="panAttachment"
                    disabled={isLocked("panNumber")}
                    hidden
                  />
                </label>
              </div>
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel} htmlFor="adhaarNumber">Aadhaar Number</label>
                <input
                  id="adhaarNumber"
                  placeholder="Aadhaar Number"
                  disabled={isLocked("adhaarNumber")}
                  value={formData.adhaarNumber}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, adhaarNumber: formatAadhaar(e.target.value) }))
                  }
                  className={`${styles.input} ${errors.adhaarNumber ? styles.errorInput : ""}`}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Aadhaar Front</label>
              <div className={`${styles.fileUpload} ${errors.adhaarAttachment ? styles.errorInput : ""}`}>
                <label className={styles.fileBox}>
                  <span className={styles.fileBtn}>Choose File</span>
                  {attachments.adhaarFileName ? (
                    <>
                      <span className={styles.fileTextChosen} title={attachments.adhaarFileName}>
                        <FiCheckCircle /> {attachments.adhaarFileName}
                      </span>
                      <button
                        type="button"
                        className={styles.fileRemoveBtn}
                        onClick={clearAttachment("adhaarAttachment")}
                        aria-label="Remove file"
                      >
                        <FiX />
                      </button>
                    </>
                  ) : (
                    <span className={styles.fileText}>Upload Aadhaar Front</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    name="adhaarAttachment"
                    disabled={isLocked("adhaarNumber")}
                    hidden
                  />
                </label>
              </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Aadhaar Back</label>
              <div className={`${styles.fileUpload} ${errors.adhaarBackAttachment ? styles.errorInput : ""}`}>
                <label className={styles.fileBox}>
                  <span className={styles.fileBtn}>Choose File</span>
                  {attachments.adhaarBackFileName ? (
                    <>
                      <span className={styles.fileTextChosen} title={attachments.adhaarBackFileName}>
                        <FiCheckCircle /> {attachments.adhaarBackFileName}
                      </span>
                      <button
                        type="button"
                        className={styles.fileRemoveBtn}
                        onClick={clearAttachment("adhaarBackAttachment")}
                        aria-label="Remove file"
                      >
                        <FiX />
                      </button>
                    </>
                  ) : (
                    <span className={styles.fileText}>Upload Aadhaar Backside</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    name="adhaarBackAttachment"
                    disabled={isLocked("adhaarBackAttachment")}
                    hidden
                  />
                </label>
              </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className={styles.sectionTitle}>Education Details</h3>

            <div className={styles.step2Grid}>
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel}>Educational Certificate</label>
              <div className={`${styles.fileUpload} ${errors.tenthMarksheetAttachment ? styles.errorInput : ""}`}>
                <label className={styles.fileBox}>
                  <span className={styles.fileBtn}>Choose File</span>
                  {attachments.tenthMarksheetFileName ? (
                    <>
                      <span className={styles.fileTextChosen} title={attachments.tenthMarksheetFileName}>
                        <FiCheckCircle /> {attachments.tenthMarksheetFileName}
                      </span>
                      <button
                        type="button"
                        className={styles.fileRemoveBtn}
                        onClick={clearAttachment("tenthMarksheetAttachment")}
                        aria-label="Remove file"
                      >
                        <FiX />
                      </button>
                    </>
                  ) : (
                    <span className={styles.fileText}>Upload Educational Certificate</span>
                  )}
                  <input
                    type="file"
                    name="tenthMarksheetAttachment"
                    onChange={handleFileChange}
                    disabled={isLocked("tenthMarksheetAttachment")}
                    hidden
                  />
                </label>
              </div>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3 className={styles.sectionTitle}>Nominee Details</h3>

            <div className={styles.step2Grid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="nomineeName">Nominee Name</label>
                <input
                  id="nomineeName"
                  placeholder="Nominee Name"
                  value={formData.nomineeName}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.nomineeName ? styles.errorInput : ""}`}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="nomineeRelation">Relation</label>
                <input
                  id="nomineeRelation"
                  placeholder="Relation"
                  value={formData.nomineeRelation}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.nomineeRelation ? styles.errorInput : ""}`}
                />
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h3 className={styles.sectionTitle}>Bank Details</h3>

            <div className={styles.step2Grid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="accountHolderName">Account Holder Name</label>
                <input
                  id="accountHolderName"
                  placeholder="Account Holder Name"
                  value={formData.accountHolderName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, accountHolderName: onlyLetters(e.target.value) }))
                  }
                  className={`${styles.input} ${submittedStep === 4 && errors.accountHolderName ? styles.errorInput : ""}`}
                  disabled={isLocked("accountNumber")}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="bankName">Bank Name</label>
                <input
                  id="bankName"
                  placeholder="Bank Name"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, bankName: onlyLetters(e.target.value) }))
                  }
                  className={`${styles.input} ${submittedStep === 4 && errors.bankName ? styles.errorInput : ""}`}
                  disabled={isLocked("accountNumber")}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="accountNumber">Account Number</label>
                <input
                  id="accountNumber"
                  placeholder="Account Number"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, accountNumber: onlyDigits(e.target.value, 18) }))
                  }
                  className={`${styles.input} ${submittedStep === 4 && errors.accountNumber ? styles.errorInput : ""}`}
                  disabled={isLocked("accountNumber")}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="ifscCode">IFSC Code</label>
                <input
                  id="ifscCode"
                  placeholder="IFSC Code"
                  value={formData.ifscCode}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, ifscCode: formatIFSC(e.target.value) }))
                  }
                  className={`${styles.input} ${submittedStep === 4 && errors.ifscCode ? styles.errorInput : ""}`}
                  disabled={isLocked("accountNumber")}
                />
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel} htmlFor="branchLocation">Branch Location</label>
                <input
                  id="branchLocation"
                  placeholder="Branch Location"
                  value={formData.branchLocation}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, branchLocation: onlyLettersWithHyphen(e.target.value) }))
                  }
                  className={`${styles.input} ${submittedStep === 4 && errors.branchLocation ? styles.errorInput : ""}`}
                  disabled={isLocked("accountNumber")}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Cancelled Cheque</label>
              <div className={`${styles.fileUpload} ${errors.cancelledChequeAttachment ? styles.errorInput : ""}`}>
                <label className={styles.fileBox}>
                  <span className={styles.fileBtn}>Choose File</span>
                  {attachments.cancelledChequeFileName ? (
                    <>
                      <span className={styles.fileTextChosen} title={attachments.cancelledChequeFileName}>
                        <FiCheckCircle /> {attachments.cancelledChequeFileName}
                      </span>
                      <button
                        type="button"
                        className={styles.fileRemoveBtn}
                        onClick={clearAttachment("cancelledChequeAttachment")}
                        aria-label="Remove file"
                      >
                        <FiX />
                      </button>
                    </>
                  ) : (
                    <span className={styles.fileText}>Upload Cancelled Cheque</span>
                  )}
                  <input
                    type="file"
                    name="cancelledChequeAttachment"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    disabled={isLocked("accountNumber")}
                    hidden
                  />
                </label>
              </div>
              </div>
            </div>
          </>
        )}

        <div className={styles.actions}>
          {step > 1 && (
            <button
              type="button"
              className={styles.btnBack}
              onClick={() => {
                setSubmittedStep(null);
                setErrors({});
                setStep(step - 1);
              }}
            >
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button
              type="button"
              className={styles.btnNext}
              onClick={() => {
                if (validateStep()) setStep(step + 1);
              }}
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              className={styles.btnNext}
              onClick={() => setSubmittedStep(5)}
            >
              {isEditMode ? "Resubmit" : "Submit for Verification"}
            </button>
          )}
        </div>
      </form>

      {successModal}

      <div className={styles.bottomSteps}>
        <div className={`${styles.stepItem} ${step === 1 ? styles.activeStep : ""}`}>
          Step 1 <span>Basic Details</span>
        </div>
        <div className={styles.arrow}>›</div>
        <div className={`${styles.stepItem} ${step === 2 ? styles.activeStep : ""}`}>
          Step 2 <span>Address & KYC</span>
        </div>
        <div className={styles.arrow}>›</div>
        <div className={`${styles.stepItem} ${step === 3 ? styles.activeStep : ""}`}>
          Step 3 <span>Education Details</span>
        </div>
        <div className={styles.arrow}>›</div>
        <div className={`${styles.stepItem} ${step === 4 ? styles.activeStep : ""}`}>
          Step 4 <span>Nominee Details</span>
        </div>
        <div className={styles.arrow}>›</div>
        <div className={`${styles.stepItem} ${step === 5 ? styles.activeStep : ""}`}>
          Step 5 <span>Bank Details</span>
        </div>
      </div>
    </div>
  );
};

export default CreateAgent;