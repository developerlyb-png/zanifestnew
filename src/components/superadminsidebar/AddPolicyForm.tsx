"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/AddPolicyForm.module.css";
import { FiCheck, FiPlus, FiX } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import InsuredNameSelect from "./InsuredNameSelect";
import { ClientRecord } from "./AddClientModal";
import {
  TRANSACTION_TYPES,
  LINES_OF_BUSINESS,
  PRODUCTS_BY_LOB,
  VEHICLE_TYPES,
  FUEL_TYPES,
  NCB_OPTIONS,
  POLICY_TYPES,
  INSURANCE_COMPANIES,
  POLICY_REMARKS,
  MEDIUM_OF_ISSUANCE,
  MODE_OF_PAYMENT,
  REWARD_STATUS,
  BRANCH_NAMES,
  PREMIUM_ROW_LABELS,
} from "@/constants/policyFormOptions";

const STEP_LABELS = ["Basic Information", "Policy Details & Assignment", "Premium, Payment & Documents"];
const TOTAL_STEPS = 3;
const GST_RATE = 0.18;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Manager {
  _id: string;
  firstName?: string;
  lastName?: string;
  managerId?: string;
}

interface Agent {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  assignedTo?: string;
}

interface PremiumRow {
  label: string;
  sumInsured: string;
  premiumAmount: string;
  commissionPercent: string;
}

interface FileEntry {
  data: string;
  fileName: string;
}

interface FormDataType {
  transactionType: string;
  lineOfBusiness: string;
  product: string;
  paymentReceivedDate: string;
  subInsuredName: string;
  insuredMobile: string;
  insuredEmail: string;
  address: string;

  vehicleType: string;
  fuelType: string;
  modelYear: string;
  motorMake: string;
  itemsCovered: string;
  registrationNumber: string;
  ncbApplicable: string;

  policyTypeStructure: string;
  policyNumber: string;
  previousPolicyNo: string;
  insurer: string;
  policyRemark: string;
  startDate: string;
  endDate: string;

  branchName: string;
  reportingManagerId: string;
  pospPartner: string;

  mediumOfIssuance: string;
  additionalRemarks: string;

  gstAmount: string;
  paymentMode: string;
  transactionId: string;
  transactionDate: string;
  transactionAmount: string;

  rewardStatus: string;
  commissionRemark: string;
}

const EMPTY_FORM: FormDataType = {
  transactionType: "",
  lineOfBusiness: "",
  product: "",
  paymentReceivedDate: "",
  subInsuredName: "",
  insuredMobile: "",
  insuredEmail: "",
  address: "",

  vehicleType: "",
  fuelType: "",
  modelYear: "",
  motorMake: "",
  itemsCovered: "",
  registrationNumber: "",
  ncbApplicable: "",

  policyTypeStructure: "",
  policyNumber: "",
  previousPolicyNo: "",
  insurer: "",
  policyRemark: "",
  startDate: "",
  endDate: "",

  branchName: "",
  reportingManagerId: "",
  pospPartner: "Direct Policy (No POSP Partner)",

  mediumOfIssuance: "",
  additionalRemarks: "",

  gstAmount: "",
  paymentMode: "",
  transactionId: "",
  transactionDate: "",
  transactionAmount: "",

  rewardStatus: "",
  commissionRemark: "",
};

const EMPTY_PREMIUM_ROWS: PremiumRow[] = PREMIUM_ROW_LABELS.map((label) => ({
  label,
  sumInsured: "",
  premiumAmount: "",
  commissionPercent: "",
}));

const Label: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
  <label className={styles.label}>
    {text} {required && <span className={styles.required}>*</span>}
  </label>
);

interface AddPolicyFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const AddPolicyForm: React.FC<AddPolicyFormProps> = ({ onCancel, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormDataType>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [premiumRows, setPremiumRows] = useState<PremiumRow[]>(EMPTY_PREMIUM_ROWS);
  const [rewardAmount, setRewardAmount] = useState("");
  const [gstManuallyEdited, setGstManuallyEdited] = useState(false);
  const [transactionProof, setTransactionProof] = useState<FileEntry | null>(null);
  const [policyDocuments, setPolicyDocuments] = useState<FileEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [customBranches, setCustomBranches] = useState<string[]>([]);
  const [newBranchName, setNewBranchName] = useState("");

  useEffect(() => {
    fetch("/api/getallmanagers")
      .then((r) => r.json())
      .then((d) => setManagers(Array.isArray(d) ? d : []))
      .catch(() => setManagers([]));

    fetch("/api/getallagents")
      .then((r) => r.json())
      .then((d) => setAgents(Array.isArray(d) ? d : []))
      .catch(() => setAgents([]));

    fetch("/api/admin/branches", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCustomBranches(d.branches || []))
      .catch(() => setCustomBranches([]));
  }, []);

  const selectedManager = managers.find((m) => m._id === formData.reportingManagerId);
  const agentsUnderManager = selectedManager
    ? agents.filter((a) => a.assignedTo === selectedManager.managerId)
    : [];
  const selectedAgent = agentsUnderManager.find((a) => a._id === formData.pospPartner);

  const setField = (key: keyof FormDataType, value: string) =>
    setFormData((p) => ({ ...p, [key]: value }));

  const isMotor = formData.lineOfBusiness === "Motor";

  const monthLabel = formData.paymentReceivedDate
    ? MONTH_NAMES[new Date(formData.paymentReceivedDate).getMonth()]
    : "";

  const totals = useMemo(() => {
    let sumInsured = 0;
    let premiumAmount = 0;
    let commissionPercentSum = 0;
    let commissionAmount = 0;
    premiumRows.forEach((r) => {
      const si = Number(r.sumInsured) || 0;
      const pa = Number(r.premiumAmount) || 0;
      const cp = Number(r.commissionPercent) || 0;
      sumInsured += si;
      premiumAmount += pa;
      commissionPercentSum += cp;
      commissionAmount += (pa * cp) / 100;
    });
    const reward = Number(rewardAmount) || 0;
    return {
      sumInsured,
      premiumAmount,
      commissionPercentSum,
      commissionAmount: commissionAmount + reward,
    };
  }, [premiumRows, rewardAmount]);

  useEffect(() => {
    if (gstManuallyEdited) return;
    const computed = (totals.premiumAmount * GST_RATE).toFixed(2);
    setFormData((p) => ({ ...p, gstAmount: computed }));
  }, [totals.premiumAmount, gstManuallyEdited]);

  const grossPremium = (totals.premiumAmount + (Number(formData.gstAmount) || 0)).toFixed(2);

  const updatePremiumRow = (index: number, key: keyof PremiumRow, value: string) => {
    setPremiumRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  };

  const rowCommissionAmount = (row: PremiumRow) => {
    const pa = Number(row.premiumAmount) || 0;
    const cp = Number(row.commissionPercent) || 0;
    return ((pa * cp) / 100).toFixed(2);
  };

  const handleTransactionProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be ≤ 10MB");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setTransactionProof({ data: reader.result as string, fileName: file.name });
    reader.readAsDataURL(file);
  };

  const handlePolicyDocuments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (policyDocuments.length + files.length > 5) {
      alert("Maximum 5 files allowed");
      e.target.value = "";
      return;
    }
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds 10MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPolicyDocuments((prev) => [...prev, { data: reader.result as string, fileName: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePolicyDocument = (index: number) => {
    setPolicyDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};

    if (s === 1) {
      if (!formData.transactionType) e.transactionType = "Required";
      if (!formData.lineOfBusiness) e.lineOfBusiness = "Required";
      if (!formData.product) e.product = "Required";
      if (!formData.paymentReceivedDate) e.paymentReceivedDate = "Required";
      if (!selectedClient) e.insuredName = "Required";

      if (isMotor) {
        if (!formData.vehicleType) e.vehicleType = "Required";
        if (!formData.fuelType) e.fuelType = "Required";
        if (!formData.modelYear) e.modelYear = "Required";
        if (!formData.motorMake) e.motorMake = "Required";
        if (!formData.itemsCovered) e.itemsCovered = "Required";
        if (!formData.registrationNumber) e.registrationNumber = "Required";
        if (!formData.ncbApplicable) e.ncbApplicable = "Required";
      }
    }

    if (s === 2) {
      if (!formData.policyTypeStructure) e.policyTypeStructure = "Required";
      if (!formData.policyNumber) e.policyNumber = "Required";
      if (!formData.insurer) e.insurer = "Required";
      if (!formData.policyRemark) e.policyRemark = "Required";
      if (!formData.startDate) e.startDate = "Required";
      if (!formData.endDate) e.endDate = "Required";
      if (!formData.branchName) e.branchName = "Required";
      if (!formData.reportingManagerId) e.reportingManagerId = "Required";
      if (!formData.pospPartner) e.pospPartner = "Required";
      if (!formData.mediumOfIssuance) e.mediumOfIssuance = "Required";
    }

    if (s === 3) {
      if (totals.premiumAmount <= 0) e.premiumAmount = "Enter at least one premium amount";
      if (!formData.paymentMode) e.paymentMode = "Required";
      if (!formData.rewardStatus) e.rewardStatus = "Required";
      if (!formData.commissionRemark) e.commissionRemark = "Required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const addCustomBranch = async () => {
    const name = newBranchName.trim();
    if (!name) return;
    setField("branchName", name);
    setNewBranchName("");

    if ([...BRANCH_NAMES, ...customBranches].some((b) => b.toLowerCase() === name.toLowerCase())) {
      return;
    }
    setCustomBranches((prev) => [...prev, name]);

    try {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success && data.branch && data.branch !== name) {
        setCustomBranches((prev) => prev.map((b) => (b === name ? data.branch : b)));
        setField("branchName", data.branch);
      }
    } catch {
      // Branch still usable for this session even if persistence failed.
    }
  };

  const buildPayload = (status?: string) => {
    const manager = managers.find((m) => m._id === formData.reportingManagerId);
    const managerName = manager ? `${manager.firstName ?? ""} ${manager.lastName ?? ""}`.trim() : undefined;
    const agentName = selectedAgent
      ? `${selectedAgent.firstName ?? ""} ${selectedAgent.lastName ?? ""}`.trim() || selectedAgent.email
      : undefined;
    const pospPartnerLabel = selectedAgent ? agentName : formData.pospPartner;

    return {
      policyNumber: formData.policyNumber,
      insurer: formData.insurer,
      policyType: formData.lineOfBusiness,
      lineOfBusiness: formData.lineOfBusiness,
      product: formData.product,
      transactionType: formData.transactionType,
      paymentReceivedDate: formData.paymentReceivedDate || undefined,
      paymentMode: formData.paymentMode,
      policyTypeStructure: formData.policyTypeStructure,
      mediumOfIssuance: formData.mediumOfIssuance,
      subInsured: formData.subInsuredName,
      endorsementNo: "-",
      pospPartner: pospPartnerLabel,
      policyRemark: formData.policyRemark,
      status: status || "Active",
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      customer: {
        fullName: selectedClient?.name || "",
        email: formData.insuredEmail || selectedClient?.email,
        mobile: formData.insuredMobile || selectedClient?.phone,
        address: formData.address || selectedClient?.address,
        clientId:
          selectedClient?._id && !selectedClient._id.startsWith("policy-")
            ? selectedClient._id
            : undefined,
        subClientName: formData.subInsuredName,
      },
      vehicle: isMotor
        ? {
            number: formData.registrationNumber,
            make: formData.motorMake,
            model: formData.product,
            type: formData.vehicleType,
            fuelType: formData.fuelType,
            modelYear: formData.modelYear,
            itemsCovered: formData.itemsCovered,
            ncbApplicable: formData.ncbApplicable,
          }
        : undefined,
      assignment: {
        branchName: formData.branchName,
        reportingManager: formData.reportingManagerId
          ? { id: formData.reportingManagerId, name: managerName }
          : undefined,
        pospPartner: pospPartnerLabel,
        pospAgent: selectedAgent ? { id: selectedAgent._id, name: agentName } : undefined,
      },
      premiumBreakdown: premiumRows.map((r) => ({
        label: r.label,
        sumInsured: Number(r.sumInsured) || 0,
        premiumAmount: Number(r.premiumAmount) || 0,
        commissionPercent: Number(r.commissionPercent) || 0,
        commissionAmount: Number(rowCommissionAmount(r)),
      })),
      rewardAmount: Number(rewardAmount) || 0,
      gstAmount: Number(formData.gstAmount) || 0,
      premium: totals.premiumAmount,
      grossPremium: Number(grossPremium),
      commissionAmount: totals.commissionAmount,
      payoutStatus: formData.rewardStatus === "Received" ? "PAID" : "PENDING",
      paymentDetails: {
        mode: formData.paymentMode,
        transactionId: formData.transactionId,
        transactionDate: formData.transactionDate || undefined,
        transactionAmount: Number(formData.transactionAmount) || undefined,
        transactionProof: transactionProof || undefined,
      },
      rewardStatus: formData.rewardStatus,
      commissionRemark: formData.commissionRemark,
      policyDocuments,
    };
  };

  const submitPayload = async (payload: any) => {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "Failed to save policy");
        return;
      }
      onSuccess();
    } catch {
      setFormError("Failed to save policy. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    submitPayload(buildPayload("Active"));
  };

  const handleSaveDraft = () => {
    if (!formData.policyNumber || !formData.insurer || !formData.lineOfBusiness) {
      setFormError("Policy Number, Insurer and Line of Business are required, even for a draft.");
      return;
    }
    submitPayload(buildPayload("Draft"));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Add New Policy</h2>
        <div className={styles.headerRight}>
          <button type="button" className={styles.viewDraftsBtn} disabled>
            View Drafts ‹
          </button>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>
            <FiX size={20} />
          </button>
        </div>
      </div>

      <div className={styles.stepper}>
        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          const done = step > s;
          return (
            <div key={label} className={styles.stepperItem}>
              <div
                className={`${styles.stepCircle} ${done ? styles.stepCircleDone : ""} ${
                  step === s ? styles.stepCircleActive : ""
                }`}
              >
                {done ? <FiCheck /> : s}
              </div>
              <span className={`${styles.stepLabel} ${step === s ? styles.stepLabelActive : ""} ${done ? styles.stepLabelDone : ""}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.progressMeta}>
        <span>
          Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
        </span>
        <span className={styles.progressPercent}>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${Math.round((step / TOTAL_STEPS) * 100)}%` }} />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {step === 1 && (
          <>
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Business &amp; Insured Details</h3>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <Label text="Transaction Type" required />
                  <select
                    className={`${styles.select} ${errors.transactionType ? styles.errorInput : ""}`}
                    value={formData.transactionType}
                    onChange={(e) => setField("transactionType", e.target.value)}
                  >
                    <option value="">Select</option>
                    {TRANSACTION_TYPES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.transactionType && <span className={styles.errorText}>{errors.transactionType}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Line of Business (LOB)" required />
                  <select
                    className={`${styles.select} ${errors.lineOfBusiness ? styles.errorInput : ""}`}
                    value={formData.lineOfBusiness}
                    disabled={!formData.transactionType}
                    onChange={(e) => {
                      setField("lineOfBusiness", e.target.value);
                      setField("product", "");
                    }}
                  >
                    <option value="">{formData.transactionType ? "Select" : "Select Transaction Type first"}</option>
                    {LINES_OF_BUSINESS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.lineOfBusiness && <span className={styles.errorText}>{errors.lineOfBusiness}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Product" required />
                  <select
                    className={`${styles.select} ${errors.product ? styles.errorInput : ""}`}
                    value={formData.product}
                    disabled={!formData.lineOfBusiness}
                    onChange={(e) => setField("product", e.target.value)}
                  >
                    <option value="">{formData.lineOfBusiness ? "Select" : "Select LOB first"}</option>
                    {(PRODUCTS_BY_LOB[formData.lineOfBusiness] || []).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.product && <span className={styles.errorText}>{errors.product}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Month" />
                  <input className={styles.input} value={monthLabel} disabled placeholder="Auto" />
                </div>

                <div className={styles.field}>
                  <Label text="Payment Received Date" required />
                  <input
                    type="date"
                    className={`${styles.input} ${errors.paymentReceivedDate ? styles.errorInput : ""}`}
                    value={formData.paymentReceivedDate}
                    onChange={(e) => setField("paymentReceivedDate", e.target.value)}
                  />
                  {errors.paymentReceivedDate && <span className={styles.errorText}>{errors.paymentReceivedDate}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Insured Name" required />
                  <InsuredNameSelect
                    value={selectedClient}
                    error={!!errors.insuredName}
                    onSelect={(c) => {
                      setSelectedClient(c);
                      setField("subInsuredName", "");
                      if (!formData.insuredMobile) setField("insuredMobile", c.phone || "");
                      if (!formData.insuredEmail) setField("insuredEmail", c.email || "");
                      if (!formData.address) setField("address", c.address || "");
                    }}
                  />
                  {errors.insuredName && <span className={styles.errorText}>{errors.insuredName}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Sub Insured Name" />
                  <select
                    className={styles.select}
                    value={formData.subInsuredName}
                    onChange={(e) => setField("subInsuredName", e.target.value)}
                  >
                    <option value="">No Sub Insured</option>
                    {(selectedClient?.subClients || []).map((sc, i) => (
                      <option key={i} value={sc.name}>{sc.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <Label text="Insured Mobile Number" />
                  <input
                    className={styles.input}
                    value={formData.insuredMobile}
                    onChange={(e) => setField("insuredMobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  />
                </div>

                <div className={styles.field}>
                  <Label text="Insured Email Address" />
                  <input
                    type="email"
                    className={styles.input}
                    value={formData.insuredEmail}
                    onChange={(e) => setField("insuredEmail", e.target.value)}
                  />
                </div>

                <div className={`${styles.field} ${styles.colSpan2}`}>
                  <Label text="Address" />
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setField("address", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {isMotor && (
              <div className={styles.card}>
                <h3 className={styles.sectionTitle}>Motor Details</h3>
                <div className={styles.grid3}>
                  <div className={styles.field}>
                    <Label text="Vehicle Type" required />
                    <select
                      className={`${styles.select} ${errors.vehicleType ? styles.errorInput : ""}`}
                      value={formData.vehicleType}
                      onChange={(e) => setField("vehicleType", e.target.value)}
                    >
                      <option value="">Select an option...</option>
                      {VEHICLE_TYPES.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {errors.vehicleType && <span className={styles.errorText}>{errors.vehicleType}</span>}
                  </div>

                  <div className={styles.field}>
                    <Label text="Fuel Type" required />
                    <select
                      className={`${styles.select} ${errors.fuelType ? styles.errorInput : ""}`}
                      value={formData.fuelType}
                      onChange={(e) => setField("fuelType", e.target.value)}
                    >
                      <option value="">Select an option...</option>
                      {FUEL_TYPES.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {errors.fuelType && <span className={styles.errorText}>{errors.fuelType}</span>}
                  </div>

                  <div className={styles.field}>
                    <Label text="Model Year" required />
                    <DatePicker
                      selected={formData.modelYear ? new Date(Number(formData.modelYear), 0, 1) : null}
                      onChange={(date: Date | null) =>
                        setField("modelYear", date ? String(date.getFullYear()) : "")
                      }
                      showYearPicker
                      dateFormat="yyyy"
                      placeholderText="Select year..."
                      maxDate={new Date()}
                      minDate={new Date(1980, 0, 1)}
                      className={`${styles.input} ${errors.modelYear ? styles.errorInput : ""}`}
                      wrapperClassName={styles.datePickerWrapper}
                    />
                    {errors.modelYear && <span className={styles.errorText}>{errors.modelYear}</span>}
                  </div>

                  <div className={styles.field}>
                    <Label text="Motor Make" required />
                    <input
                      className={`${styles.input} ${errors.motorMake ? styles.errorInput : ""}`}
                      value={formData.motorMake}
                      onChange={(e) => setField("motorMake", e.target.value)}
                    />
                    {errors.motorMake && <span className={styles.errorText}>{errors.motorMake}</span>}
                  </div>

                  <div className={styles.field}>
                    <Label text="Model Items Covered" required />
                    <input
                      className={`${styles.input} ${errors.itemsCovered ? styles.errorInput : ""}`}
                      value={formData.itemsCovered}
                      onChange={(e) => setField("itemsCovered", e.target.value)}
                    />
                    {errors.itemsCovered && <span className={styles.errorText}>{errors.itemsCovered}</span>}
                  </div>

                  <div className={styles.field}>
                    <Label text="Registration Number" required />
                    <input
                      className={`${styles.input} ${errors.registrationNumber ? styles.errorInput : ""}`}
                      value={formData.registrationNumber}
                      onChange={(e) => setField("registrationNumber", e.target.value.toUpperCase())}
                    />
                    {errors.registrationNumber && <span className={styles.errorText}>{errors.registrationNumber}</span>}
                  </div>

                  <div className={styles.field}>
                    <Label text="NCB Applicable" required />
                    <select
                      className={`${styles.select} ${errors.ncbApplicable ? styles.errorInput : ""}`}
                      value={formData.ncbApplicable}
                      onChange={(e) => setField("ncbApplicable", e.target.value)}
                    >
                      <option value="">Select an option...</option>
                      {NCB_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {errors.ncbApplicable && <span className={styles.errorText}>{errors.ncbApplicable}</span>}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Policy Details</h3>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <Label text="Policy Type" required />
                  <select
                    className={`${styles.select} ${errors.policyTypeStructure ? styles.errorInput : ""}`}
                    value={formData.policyTypeStructure}
                    onChange={(e) => setField("policyTypeStructure", e.target.value)}
                  >
                    <option value="">Select</option>
                    {POLICY_TYPES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.policyTypeStructure && <span className={styles.errorText}>{errors.policyTypeStructure}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Policy No." required />
                  <input
                    className={`${styles.input} ${errors.policyNumber ? styles.errorInput : ""}`}
                    value={formData.policyNumber}
                    onChange={(e) => setField("policyNumber", e.target.value)}
                  />
                  {errors.policyNumber && <span className={styles.errorText}>{errors.policyNumber}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Previous Policy No." />
                  <input
                    className={styles.input}
                    value={formData.previousPolicyNo}
                    onChange={(e) => setField("previousPolicyNo", e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <Label text="Insurance Company" required />
                  <select
                    className={`${styles.select} ${errors.insurer ? styles.errorInput : ""}`}
                    value={formData.insurer}
                    onChange={(e) => setField("insurer", e.target.value)}
                  >
                    <option value="">Select</option>
                    {INSURANCE_COMPANIES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.insurer && <span className={styles.errorText}>{errors.insurer}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Policy Remark" required />
                  <select
                    className={`${styles.select} ${errors.policyRemark ? styles.errorInput : ""}`}
                    value={formData.policyRemark}
                    onChange={(e) => setField("policyRemark", e.target.value)}
                  >
                    <option value="">Select</option>
                    {POLICY_REMARKS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.policyRemark && <span className={styles.errorText}>{errors.policyRemark}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Risk Start Date" required />
                  <input
                    type="date"
                    className={`${styles.input} ${errors.startDate ? styles.errorInput : ""}`}
                    value={formData.startDate}
                    onChange={(e) => setField("startDate", e.target.value)}
                  />
                  {errors.startDate && <span className={styles.errorText}>{errors.startDate}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Risk End Date" required />
                  <input
                    type="date"
                    className={`${styles.input} ${errors.endDate ? styles.errorInput : ""}`}
                    value={formData.endDate}
                    onChange={(e) => setField("endDate", e.target.value)}
                  />
                  {errors.endDate && <span className={styles.errorText}>{errors.endDate}</span>}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Assignment</h3>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <Label text="Branch Name" required />
                  <div className={styles.addRow}>
                    <input
                      className={styles.input}
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomBranch();
                        }
                      }}
                      placeholder="Add a new branch name..."
                    />
                    <button type="button" className={styles.addRowBtn} onClick={addCustomBranch}>
                      <FiPlus size={14} /> Add
                    </button>
                  </div>
                  <select
                    className={`${styles.select} ${errors.branchName ? styles.errorInput : ""}`}
                    value={formData.branchName}
                    onChange={(e) => setField("branchName", e.target.value)}
                  >
                    <option value="">Select</option>
                    {[...BRANCH_NAMES, ...customBranches].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.branchName && <span className={styles.errorText}>{errors.branchName}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Reporting Manager" required />
                  <select
                    className={`${styles.select} ${errors.reportingManagerId ? styles.errorInput : ""}`}
                    value={formData.reportingManagerId}
                    onChange={(e) => {
                      setField("reportingManagerId", e.target.value);
                      setField("pospPartner", "Direct Policy (No POSP Partner)");
                    }}
                  >
                    <option value="">Select</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {`${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.managerId}
                      </option>
                    ))}
                  </select>
                  {errors.reportingManagerId && <span className={styles.errorText}>{errors.reportingManagerId}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="POSP Partner" required />
                  <select
                    className={`${styles.select} ${errors.pospPartner ? styles.errorInput : ""}`}
                    value={formData.pospPartner}
                    disabled={!formData.reportingManagerId}
                    onChange={(e) => setField("pospPartner", e.target.value)}
                  >
                    <option value="">
                      {formData.reportingManagerId ? "Select" : "Select Reporting Manager first"}
                    </option>
                    <option value="Direct Policy (No POSP Partner)">Direct Policy (No POSP Partner)</option>
                    {agentsUnderManager.map((a) => (
                      <option key={a._id} value={a._id}>
                        {`${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || a.email}
                      </option>
                    ))}
                  </select>
                  {formData.reportingManagerId && agentsUnderManager.length === 0 && (
                    <span className={styles.errorText}>No agents found under this manager.</span>
                  )}
                  {errors.pospPartner && <span className={styles.errorText}>{errors.pospPartner}</span>}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Additional Information</h3>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <Label text="Medium of Issuance" required />
                  <select
                    className={`${styles.select} ${errors.mediumOfIssuance ? styles.errorInput : ""}`}
                    value={formData.mediumOfIssuance}
                    onChange={(e) => setField("mediumOfIssuance", e.target.value)}
                  >
                    <option value="">Select</option>
                    {MEDIUM_OF_ISSUANCE.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.mediumOfIssuance && <span className={styles.errorText}>{errors.mediumOfIssuance}</span>}
                </div>

                <div className={`${styles.field} ${styles.colSpan2}`}>
                  <Label text="Remarks" />
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    value={formData.additionalRemarks}
                    onChange={(e) => setField("additionalRemarks", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Premium Breakdown &amp; Commission</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.premiumTable}>
                  <thead>
                    <tr>
                      <th>Sum Insured ₹</th>
                      <th>Premium Type</th>
                      <th>Premium Amount ₹</th>
                      <th>Commission %</th>
                      <th>Commission Amount ₹</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premiumRows.map((row, i) => (
                      <tr key={row.label}>
                        <td>
                          <input
                            type="number"
                            className={styles.tableInput}
                            value={row.sumInsured}
                            onChange={(e) => updatePremiumRow(i, "sumInsured", e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td className={styles.premiumTypeCell}>{row.label}</td>
                        <td>
                          <input
                            type="number"
                            className={styles.tableInput}
                            value={row.premiumAmount}
                            onChange={(e) => updatePremiumRow(i, "premiumAmount", e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className={styles.tableInput}
                            value={row.commissionPercent}
                            onChange={(e) => updatePremiumRow(i, "commissionPercent", e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <input
                            className={styles.tableInput}
                            value={rowCommissionAmount(row)}
                            disabled
                          />
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={4} className={styles.rewardLabelCell}>Reward Amount</td>
                      <td>
                        <input
                          type="number"
                          className={styles.tableInput}
                          value={rewardAmount}
                          onChange={(e) => setRewardAmount(e.target.value)}
                          placeholder="0"
                        />
                      </td>
                    </tr>
                    <tr className={styles.totalRow}>
                      <td>{totals.sumInsured.toFixed(2)}</td>
                      <td>Total</td>
                      <td>{totals.premiumAmount.toFixed(2)}</td>
                      <td>{totals.commissionPercentSum.toFixed(2)}</td>
                      <td>{totals.commissionAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {errors.premiumAmount && <span className={styles.errorText}>{errors.premiumAmount}</span>}
            </div>

            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Tax &amp; Final Premium</h3>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <Label text="Service Tax/GST (18%) (₹)" required />
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.gstAmount}
                    onChange={(e) => {
                      setGstManuallyEdited(true);
                      setField("gstAmount", e.target.value);
                    }}
                  />
                </div>
                <div className={styles.field}>
                  <Label text="Gross Premium (₹)" required />
                  <input className={styles.input} value={grossPremium} disabled />
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Payment Details</h3>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <Label text="Mode of Payment" required />
                  <select
                    className={`${styles.select} ${errors.paymentMode ? styles.errorInput : ""}`}
                    value={formData.paymentMode}
                    onChange={(e) => setField("paymentMode", e.target.value)}
                  >
                    <option value="">Select an option...</option>
                    {MODE_OF_PAYMENT.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.paymentMode && <span className={styles.errorText}>{errors.paymentMode}</span>}
                </div>

                <div className={styles.field}>
                  <Label text="Transaction ID" />
                  <input
                    className={styles.input}
                    value={formData.transactionId}
                    onChange={(e) => setField("transactionId", e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <Label text="Transaction Date" />
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.transactionDate}
                    onChange={(e) => setField("transactionDate", e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <Label text="Transaction Amount (₹)" />
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.transactionAmount}
                    onChange={(e) => setField("transactionAmount", e.target.value)}
                  />
                </div>

                <div className={`${styles.field} ${styles.colSpan2}`}>
                  <Label text="Transaction Proof Document" />
                  <label className={styles.dropzone}>
                    <span className={styles.dropzoneTitle}>Upload transaction proof document</span>
                    <span className={styles.dropzoneHint}>PDF, JPG, PNG, DOC, DOCX up to 10MB</span>
                    <input type="file" hidden onChange={handleTransactionProofChange} />
                  </label>
                  {transactionProof && <span className={styles.fileChip}>{transactionProof.fileName}</span>}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Commission Status</h3>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <Label text="Reward Status" required />
                  <select
                    className={`${styles.select} ${errors.rewardStatus ? styles.errorInput : ""}`}
                    value={formData.rewardStatus}
                    onChange={(e) => setField("rewardStatus", e.target.value)}
                  >
                    <option value="">Select an option...</option>
                    {REWARD_STATUS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.rewardStatus && <span className={styles.errorText}>{errors.rewardStatus}</span>}
                </div>

                <div className={`${styles.field} ${styles.colSpan2}`}>
                  <Label text="Commission Received Remarks" required />
                  <input
                    className={`${styles.input} ${errors.commissionRemark ? styles.errorInput : ""}`}
                    value={formData.commissionRemark}
                    onChange={(e) => setField("commissionRemark", e.target.value)}
                  />
                  {errors.commissionRemark && <span className={styles.errorText}>{errors.commissionRemark}</span>}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Policy Documents</h3>
              <div className={styles.field}>
                <Label text="Upload Document Files" />
                <label className={styles.dropzoneLarge}>
                  <span className={styles.dropzoneTitle}>Drop policy documents here</span>
                  <span className={styles.dropzoneHint}>PDF, Images, Word documents up to 10MB each (max 5 files)</span>
                  <input type="file" hidden multiple onChange={handlePolicyDocuments} />
                </label>
                {policyDocuments.length > 0 && (
                  <div className={styles.fileList}>
                    {policyDocuments.map((f, i) => (
                      <span key={i} className={styles.fileChip}>
                        {f.fileName}
                        <button type="button" onClick={() => removePolicyDocument(i)}>
                          <FiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {formError && <div className={styles.formErrorBanner}>{formError}</div>}

        <div className={styles.actions}>
          <div className={styles.actionsLeft}>
            {step > 1 && (
              <button type="button" className={styles.backBtn} onClick={handleBack} disabled={submitting}>
                Previous
              </button>
            )}
          </div>
          <div className={styles.actionsRight}>
            <button type="button" className={styles.draftBtn} onClick={handleSaveDraft} disabled={submitting}>
              Save as Draft
            </button>
            {step < TOTAL_STEPS ? (
              <button type="button" className={styles.nextBtn} onClick={handleNext}>
                Next
              </button>
            ) : (
              <button type="submit" className={styles.nextBtn} disabled={submitting}>
                {submitting ? "Saving..." : "Save Policy"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddPolicyForm;
