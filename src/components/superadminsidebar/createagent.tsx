"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "@/styles/components/superadminsidebar/createagent.module.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { th } from "framer-motion/client";

/* ================= TYPES ================= */
type FormDataType = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  profileImage?: string;
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
  error?: boolean; // ✅ ADD THIS

  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileInput: React.FC<FileInputProps> = ({
  label,
  name,
  fileName,
  error,
  onChange,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`${styles.simpleUploadWrapper} ${
        error ? styles.errorInput : ""
      }`}
    >
      <label>{label}</label>

      <div className={styles.simpleUploadBox}>
        <button type="button" onClick={() => fileRef.current?.click()}>
          Choose File
        </button>

        <span title={fileName || "No file chosen"}>
          {fileName || "No file chosen"}
        </span>

        <input
          ref={fileRef}
          type="file"
          name={name}
          hidden
          onChange={onChange}
        />
      </div>
    </div>
  );
};

/* ================= MAIN ================= */
const CreateAgent = () => {
  const searchParams = useSearchParams();
  const urlLoginId = searchParams.get("loginId");
  const isEditMode = searchParams.get("mode") === "edit";
  const router = useRouter();

  const [loginId, setLoginId] = useState<string | null>(urlLoginId);

  useEffect(() => {
    if (urlLoginId) {
      setLoginId(urlLoginId);
      router.replace("/createagent");
    }
  }, [urlLoginId]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [rejectedFields, setRejectedFields] = useState<(keyof FormDataType)[]>([]);

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
  const isLocked = (field: keyof FormDataType) => {
    if (!isEditMode) return false;
    if (rejectedFields.length === 0) return true;
    return !rejectedFields.includes(field);
  };

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

  if (!attachments.panAttachment) {
    newErrors.panAttachment = "Upload required";
  }

  if (!attachments.adhaarAttachment) {
    newErrors.adhaarAttachment = "Upload required";
  }

  if (!attachments.adhaarBackAttachment) {
    newErrors.adhaarBackAttachment = "Upload required";
  }
}

if (step === 3) {

  // 10th required
  if (!formData.yearofpassing10th)
    newErrors.yearofpassing10th = "Required";

  if (!attachments.tenthMarksheetAttachment)
    newErrors.tenthMarksheetAttachment = "Upload required";

  // 12th optional
  if (formData.yearofpassing12th && !attachments.twelfthMarksheetAttachment) {
    newErrors.twelfthMarksheetAttachment = "Upload required";
  }

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
  if (!attachments.cancelledChequeAttachment)
    newErrors.cancelledChequeAttachment = "Upload required";
}


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= PREFILL LOGIN DATA ================= */
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

  /* ================= PREFILL REJECTED AGENT ================= */
  useEffect(() => {
    if (!loginId || !isEditMode) return;

    fetch(`/api/agent/by-loginId?loginId=${loginId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d?.agent) return;

        setFormData((p) => ({ ...p, ...d.agent }));
        const rejected = d.agent.rejectedFields || [];
        setRejectedFields(rejected);

        // ✅ NON-REJECTED = PREFILL
        // ❌ REJECTED = EMPTY
        setAttachments({
          panAttachment: rejected.includes("panNumber")
            ? null
            : d.agent.panAttachment,
          panFileName: rejected.includes("panNumber") ? undefined : "PAN.pdf",

          adhaarAttachment: rejected.includes("adhaarNumber")
            ? null
            : d.agent.adhaarAttachment,
          adhaarFileName: rejected.includes("adhaarNumber")
            ? undefined
            : "Aadhaar.pdf",
              adhaarBackAttachment: rejected.includes("adhaarNumber")
    ? null
    : d.agent.adhaarBackAttachment,
  adhaarBackFileName: rejected.includes("adhaarNumber")
    ? undefined
    : "AadhaarBack.pdf",


          nomineePanAttachment: rejected.includes("nomineePanNumber")
            ? null
            : d.agent.nomineePanAttachment,
          nomineePanFileName: rejected.includes("nomineePanNumber")
            ? undefined
            : "NomineePAN.pdf",

          nomineeAadhaarAttachment: rejected.includes("nomineeAadharNumber")
            ? null
            : d.agent.nomineeAadhaarAttachment,
          nomineeAadhaarFileName: rejected.includes("nomineeAadharNumber")
            ? undefined
            : "NomineeAadhaar.pdf",

          cancelledChequeAttachment: rejected.includes("accountNumber")
            ? null
            : d.agent.cancelledChequeAttachment,
          cancelledChequeFileName: rejected.includes("accountNumber")
            ? undefined
            : "Cheque.pdf",
              tenthMarksheetAttachment: rejected.includes("yearofpassing10th")
          ? null
          : d.agent.tenthMarksheetAttachment ?? null,

        twelfthMarksheetAttachment: rejected.includes("yearofpassing12th")
          ? null
          : d.agent.twelfthMarksheetAttachment ?? null,
        });
      });
  }, [loginId, isEditMode]);

  /* ================= HANDLERS ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.id as keyof FormDataType;
    setFormData((p) => ({ ...p, [id]: e.target.value }));
  };
  const handlePincodeChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((p) => ({ ...p, pinCode: value }));

    if (value.length === 6) {
      const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
      const data = await res.json();
      const po = data[0]?.PostOffice?.[0];
      if (po) {
        setFormData((p) => ({
          ...p,
          city: po.District,
          district: po.Name,
          state: po.State,
        }));
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

  // ✅ Different size limit
  const maxSize =
    key === "panAttachment" ||
      key === "adhaarAttachment" ||
      key === "adhaarBackAttachment" ? 500 * 1024 : 200 * 1024;

  if (file.size > maxSize) {
    alert(
      key === "panAttachment" ||
      key === "adhaarAttachment" ||
      key === "adhaarBackAttachment"
        ? "Please Upload must be 500KB"
        : "File size must be ≤ 200KB"
    );

    // clear input
    e.target.value = "";

    // clear state
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
  /* ================= VALIDATION ================= */
const validateBeforeSubmit = () => {
  const requiredFields: (keyof FormDataType)[] = [
    "firstName",
    "lastName",
    "phone",
    "pinCode",
    "panNumber",
    "adhaarNumber",
    "nomineeName",
    "nomineeRelation",
    "nomineePanNumber",
    "nomineeAadharNumber",
    "accountHolderName",
    "bankName",
    "accountNumber",
    "ifscCode",
    "branchLocation",
    "yearofpassing10th",
    // "yearofpassing12th"
  ];

  for (const field of requiredFields) {
    if (!formData[field]) {
      alert(`Missing required field: ${field}`);
      return false;
    }
  }

  const requiredAttachments: (keyof AttachmentType)[] = [
    "panAttachment",
    "adhaarAttachment",
    "adhaarBackAttachment",
    "nomineePanAttachment",
    "nomineeAadhaarAttachment",
    "cancelledChequeAttachment",
    "tenthMarksheetAttachment",
    // "twelfthMarksheetAttachment",
  ];

  for (const att of requiredAttachments) {
    if (!attachments[att]) {
      alert(`Please upload ${att}`);
      return false;
    }
  }

  return true;
};
  const attachmentMap: Partial<
    Record<keyof FormDataType, keyof AttachmentType>
  > = {
    panNumber: "panAttachment",
    adhaarNumber: "adhaarAttachment",
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    let payload: any = { loginId };

    if (isEditMode) {
      // ✅ ONLY PAN & AADHAAR IF REJECTED
      if (rejectedFields.includes("panNumber")) {
        payload.panNumber = formData.panNumber;
        if (attachments.panAttachment) {
          payload.panAttachment = attachments.panAttachment;
        }
      }

      if (rejectedFields.includes("adhaarNumber")) {
        payload.adhaarNumber = formData.adhaarNumber;
        if (attachments.adhaarAttachment) {
          payload.adhaarAttachment = attachments.adhaarAttachment;
        }
      }
       if (attachments.adhaarBackAttachment) {
    payload.adhaarBackAttachment = attachments.adhaarBackAttachment;
  }
    } else {
      // ✅ New submission
      payload = {
        ...formData,
        ...attachments,
        loginId,
      };
    }

    const res = await fetch("/api/createagent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) setShowSuccess(true);
  };

  /* ================= PROFILE IMAGE HANDLER (ADD THIS) ================= */

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const handleProfileImageChange = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const base64 = await fileToBase64(file);

  setFormData((prev) => ({
    ...prev,
    profileImage: base64,
  }));
};

  // only digits helper
  const onlyDigits = (value: string, max: number) =>
    value.replace(/\D/g, "").slice(0, max);

  // Aadhaar formatter 1234 5678 9012
  const formatAadhaar = (value: string) =>
    value
      .replace(/\D/g, "")
      .slice(0, 12)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  // PAN formatter ABCDE1234F
  const formatPAN = (value: string) =>
    value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);

  const onlyLetters = (value: string) => value.replace(/[^a-zA-Z\s]/g, "");

  const onlyLettersWithHyphen = (value: string) =>
    value.replace(/[^a-zA-Z\s-]/g, "");

  const formatIFSC = (value: string) =>
    value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 11);
  useEffect(() => {
    setErrors({});
    setSubmittedStep(null);
  }, [step]);

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Create Agent</h2>

        <div className={styles.stepHeader}>
          <span className={styles.stepText}>
            Step {step} of {totalSteps}
          </span>

          <div className={styles.stepDots}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`${styles.dot} ${step >= s ? styles.activeDot : ""}`}
              />
            ))}
          </div>

          <span className={styles.percentText}>
{Math.min(100, Math.round((step / totalSteps) * 100))}% complete
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={step === 1 ? styles.basicDetailsGrid : ""}>
        {step === 1 && (
          <>
            <h3>Basic Details</h3>
            <input
              id="firstName"
              placeholder="First Name"
              disabled
              value={formData.firstName}
              onChange={handleChange}
            />
            <input
              id="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? styles.errorInput : ""}
            />
            <input id="email" value={formData.email} disabled />
            <input
              id="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  phone: onlyDigits(e.target.value, 10),
                }))
              }
              className={errors.phone ? styles.errorInput : ""}
            />
       <div className={styles.fileUpload}>
  <label className={styles.fileBox}>
    <span className={styles.fileBtn}>Choose File</span>

    <span className={styles.fileText}>
      {formData.profileImage
        ? "File selected"
        : "Upload your profile picture"}
    </span>

    <input
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      onChange={handleProfileImageChange}
      hidden
    />
  </label>
</div>
                     
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
          </>
        )}

  {step === 2 && (
  <>
    <h3>Address & KYC</h3>

    <div className={styles.step2Grid}>
      <input
        placeholder="Pin Code"
        value={formData.pinCode}
        onChange={handlePincodeChange}
        className={errors.pinCode ? styles.errorInput : ""}
      />

      <input placeholder="City" value={formData.city} disabled />

      <input
        placeholder="State"
        value={formData.state}
        disabled
        className={styles.fullWidth}
      />

      <input
        id="panNumber"
        placeholder="PAN Number"
        value={formData.panNumber}
        onChange={(e) =>
          setFormData((p) => ({
            ...p,
            panNumber: formatPAN(e.target.value),
          }))
        }
        className={errors.panNumber ? styles.errorInput : ""}
      />

      {/* PAN Upload */}
      <div className={styles.fileUpload}>
        <label className={styles.fileBox}>
          <span className={styles.fileBtn}>Choose File</span>

          <span className={styles.fileText}>
            {attachments.panAttachment
              ? "File selected"
              : "Upload PAN"}
          </span>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            name="panAttachment"
            hidden
          />
        </label>
      </div>

      <input
        id="adhaarNumber"
        placeholder="Aadhaar Number"
        disabled={isLocked("adhaarNumber")}
        value={formData.adhaarNumber}
        onChange={(e) =>
          setFormData((p) => ({
            ...p,
            adhaarNumber: formatAadhaar(e.target.value),
          }))
        }
        className={`${styles.fullWidth} ${
          errors.adhaarNumber ? styles.errorInput : ""
        }`}
      />

      {/* Aadhaar Front */}
      <div className={styles.fileUpload}>
        <label className={styles.fileBox}>
          <span className={styles.fileBtn}>Choose File</span>

          <span className={styles.fileText}>
            {attachments.adhaarAttachment
              ? "File selected"
              : "Upload Aadhaar Front "}
          </span>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            name="adhaarAttachment"
            hidden
          />
        </label>
      </div>

      {/* Aadhaar Back */}
      <div className={styles.fileUpload}>
        <label className={styles.fileBox}>
          <span className={styles.fileBtn}>Choose File</span>

          <span className={styles.fileText}>
            {attachments.adhaarBackAttachment
              ? "File selected"
              : "Upload Aadhaar Backside "}
          </span>

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
  </>
)}
{step === 3 && (
  <>
    <h3>Education Details</h3>

    <div className={styles.step2Grid}>
      
      {/* 10th Passing Year */}
      <select
        id="yearofpassing10th"
        value={formData.yearofpassing10th || ""}
        onChange={(e) =>
          setFormData((p) => ({
            ...p,
            yearofpassing10th: e.target.value,
            yearofpassing12th: "" // reset 12th
          }))
        }
        className={errors.yearofpassing10th ? styles.errorInput : ""}
      >
        <option value="">Select 10th Passing Year</option>

        {Array.from({ length: 2025 - 1970 + 1 }, (_, i) => {
          const year = 1970 + i;
          return (
            <option key={year} value={year}>
              {year}
            </option>
          );
        })}
      </select>


      {/* 10th Marksheet Upload */}
      <div className={styles.fileUpload}>
        <label className={styles.fileBox}>
          <span className={styles.fileBtn}>Choose File</span>

          <span className={styles.fileText}>
            {attachments.tenthMarksheetAttachment
              ? "File selected"
              : "Upload 10th Marksheet"}
          </span>

          <input
            type="file"
            name="tenthMarksheetAttachment"
            onChange={handleFileChange}
            hidden
          />
        </label>
      </div>


      {/* 12th Passing Year */}
      <select
        id="yearofpassing12th"
        value={formData.yearofpassing12th || ""}
        onChange={(e) =>
          setFormData((p) => ({
            ...p,
            yearofpassing12th: e.target.value
          }))
        }
        className={errors.yearofpassing12th ? styles.errorInput : ""}
      >
        <option value="">Select 12th Passing Year</option>

        {formData.yearofpassing10th &&
          Array.from(
            { length: 2025 - (Number(formData.yearofpassing10th) + 2) + 1 },
            (_, i) => {
              const year = Number(formData.yearofpassing10th) + 2 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            }
          )}
      </select>


      {/* 12th Marksheet Upload */}
      <div className={styles.fileUpload}>
        <label className={styles.fileBox}>
          <span className={styles.fileBtn}>Choose File</span>

          <span className={styles.fileText}>
            {attachments.twelfthMarksheetAttachment
              ? "File selected"
              : "Upload 12th Marksheet"}
          </span>

          <input
            type="file"
            name="twelfthMarksheetAttachment"
            onChange={handleFileChange}
            hidden
          />
        </label>
      </div>

    </div>
  </>
)}



    {step === 4 && (
  <>
    <h3>Nominee Details</h3>

    <div className={styles.step2Grid}>
      <input
        id="nomineeName"
        placeholder="Nominee Name"
        value={formData.nomineeName}
        onChange={handleChange}
        className={errors.nomineeName ? styles.errorInput : ""}
      />

      <input
        id="nomineeRelation"
        placeholder="Relation"
        value={formData.nomineeRelation}
        onChange={handleChange}
        className={errors.nomineeRelation ? styles.errorInput : ""}
      />
    </div>

    {/* Nominee PAN (Hidden) */}
    {false && (
      <div className={styles.docRow}>
        <input
          id="nomineePanNumber"
          placeholder="Nominee PAN Number"
          value={formData.nomineePanNumber}
          onChange={(e) =>
            setFormData((p) => ({
              ...p,
              nomineePanNumber: formatPAN(e.target.value),
            }))
          }
          className={errors.nomineePanNumber ? styles.errorInput : ""}
        />

        <FileInput
          label="Upload PAN (Max upload size 200kb)"
          name="nomineePanAttachment"
          fileName={attachments.nomineePanFileName}
          onChange={handleFileChange}
          error={!!errors.nomineePanAttachment}
        />
      </div>
    )}

    {/* Nominee Aadhaar (Hidden) */}
    {false && (
      <div className={styles.docRow}>
        <input
          id="nomineeAadharNumber"
          placeholder="Nominee Aadhaar Number"
          value={formData.nomineeAadharNumber}
          onChange={(e) =>
            setFormData((p) => ({
              ...p,
              nomineeAadharNumber: formatAadhaar(e.target.value),
            }))
          }
          className={errors.nomineeAadharNumber ? styles.errorInput : ""}
        />

        <FileInput
          label="Upload Aadhaar (Max upload size 200kb)"
          name="nomineeAadhaarAttachment"
          fileName={attachments.nomineeAadhaarFileName}
          onChange={handleFileChange}
          error={!!errors.nomineeAadhaarAttachment}
        />
      </div>
    )}
  </>
)}

        {step === 5 && (
  <>
    <h3>Bank Details</h3>

    <div className={styles.step2Grid}>

      <input
        id="accountHolderName"
        placeholder="Account Holder Name"
        value={formData.accountHolderName}
        onChange={(e) =>
          setFormData((p) => ({
            ...p,
            accountHolderName: onlyLetters(e.target.value),
          }))
        }
        className={
          submittedStep === 4 && errors.accountHolderName
            ? styles.errorInput
            : ""
        }
      />

      <input
        id="bankName"
        placeholder="Bank Name"
        value={formData.bankName}
        onChange={(e) =>
          setFormData((p) => ({
            ...p,
            bankName: onlyLetters(e.target.value),
          }))
        }
        className={
          submittedStep === 4 && errors.bankName ? styles.errorInput : ""
        }
      />

      <input
        id="accountNumber"
        placeholder="Account Number"
        value={formData.accountNumber}
        onChange={(e) =>
          setFormData((p) => ({
            ...p,
            accountNumber: onlyDigits(e.target.value, 18),
          }))
        }
        className={
          submittedStep === 4 && errors.accountNumber
            ? styles.errorInput
            : ""
        }
      />

      <input
        id="ifscCode"
        placeholder="IFSC Code"
        value={formData.ifscCode}
        onChange={(e) =>
          setFormData((p) => ({
            ...p,
            ifscCode: formatIFSC(e.target.value),
          }))
        }
        className={
          submittedStep === 4 && errors.ifscCode ? styles.errorInput : ""
        }
      />

      <input
        id="branchLocation"
        placeholder="Branch Location"
        value={formData.branchLocation}
        onChange={(e) =>
          setFormData((p) => ({
            ...p,
            branchLocation: onlyLettersWithHyphen(e.target.value),
          }))
        }
        className={
          submittedStep === 4 && errors.branchLocation
            ? styles.errorInput
            : ""
        }
      />

      <div className={styles.fileUpload}>
  <label className={styles.fileBox}>
    <span className={styles.fileBtn}>Choose File</span>

    <span className={styles.fileText}>
      {attachments.cancelledChequeAttachment
        ? "File selected"
        : "Upload Cancelled Cheque"}
    </span>

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

        <div className={styles.actions}>
          {step > 1 && (
            <button
              type="button"
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
              onClick={() => {
                if (validateStep()) {
                  setStep(step + 1);
                }
              }}
            >
              Continue
            </button>
          ) : (
<button type="submit" onClick={() => setSubmittedStep(5)}>
              {isEditMode ? "Resubmit" : "Submit for Verification"}
            </button>
          )}
        </div>
      </form>
      {showSuccess && (
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
              Agent application submitted successfully. Status will be updated
              after verification.
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                router.push("/");
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
              Go to home page
            </button>
          </div>
        </div>
      )}

      {/* ===== BOTTOM STEP INDICATOR ===== */}
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
