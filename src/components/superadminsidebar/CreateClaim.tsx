"use client";

import React, { useState } from "react";
import styles from "@/styles/components/superadminsidebar/Claims.module.css";
import SearchableSelect, { SelectOption } from "./ClaimSearchSelect";
import { toast } from "react-hot-toast";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiChevronUp,
  FiChevronDown,
  FiFileText,
  FiUser,
  FiMapPin,
} from "react-icons/fi";
import {
  CLAIM_TYPES,
  CLAIM_STATUSES,
  REPORTED_CHANNELS,
  DEFAULT_CLAIM_STATUS,
} from "@/constants/claims";

interface Props {
  onCancel: () => void;
  onCreated: () => void;
  // Existing claim to edit; the wizard reopens at step 1 pre-filled.
  initial?: any;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  policyId: "",
  policyNumber: "",
  insuredName: "",
  contactMobile: "",
  contactEmail: "",
  insurer: "",
  lineOfBusiness: "",
  productCode: "",
  claimType: "Non Employee Benefit" as string,
  claimNumber: "",
  reportedChannel: "",
  dateOfLoss: "",
  reportedOn: todayIso(),
  status: DEFAULT_CLAIM_STATUS as string,
  specialRemark: "",
  claimDetails: "",
  estimatedAmount: "",
  claimedAmount: "",
  approvedAmount: "",
  // Non Employee Benefit
  lossCause: "",
  lossDetails: "",
  siteAddress: "",
  sitePinCode: "",
  state: "",
  city: "",
  // Employee Benefit
  patientName: "",
  hospitalName: "",
  diagnosis: "",
  admissionDate: "",
  dischargeDate: "",
  notify: true,
};

type FormState = typeof EMPTY;

const toProductCode = (v: string) =>
  String(v || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const dateInput = (v: any) => (v ? new Date(v).toISOString().slice(0, 10) : "");

function toForm(c: any): FormState {
  const f: any = { ...EMPTY };
  for (const k of Object.keys(EMPTY)) {
    if (c[k] !== undefined && c[k] !== null) f[k] = c[k];
  }
  f.policyId = c.policyId ? String(c.policyId) : "";
  for (const k of ["dateOfLoss", "reportedOn", "admissionDate", "dischargeDate"]) f[k] = dateInput(c[k]);
  for (const k of ["estimatedAmount", "claimedAmount", "approvedAmount"]) {
    f[k] = c[k] ? String(c[k]) : "";
  }
  return f;
}

const money = (v: string) => (v === "" ? "—" : `₹${Number(v).toLocaleString("en-IN")}`);
const fmtDate = (v: string) => (v ? new Date(v).toLocaleDateString("en-US") : "—");

const CHANNEL_OPTIONS: SelectOption[] = REPORTED_CHANNELS.map((c) => ({ value: c, label: c }));

// Kept at module level on purpose — components declared inside CreateClaim
// get a new identity every render, which remounts their children and drops
// input focus on every keystroke.
function Field({
  label,
  required,
  err,
  children,
  full,
}: {
  label: string;
  required?: boolean;
  err?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`${styles.field} ${full ? styles.full : ""}`}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.req}>*</span>}
      </label>
      {children}
      {err && <span className={styles.errorText}>{err}</span>}
    </div>
  );
}

function ReviewCard({
  icon,
  title,
  sub,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  rows: [string, string][];
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={styles.reviewCard}>
      <button type="button" className={styles.reviewHead} onClick={() => setOpen((o) => !o)}>
        <span className={styles.reviewIcon}>{icon}</span>
        <span className={styles.reviewHeadText}>
          <span className={styles.reviewTitle}>{title}</span>
          <span className={styles.reviewSub}>{sub}</span>
        </span>
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {open && (
        <div className={styles.reviewBody}>
          {rows.map(([k, v]) => (
            <div className={styles.reviewRow} key={k}>
              <span className={styles.reviewKey}>{k}</span>
              <span className={styles.reviewVal}>{v || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateClaim({ onCancel, onCreated, initial }: Props) {
  const isEdit = !!initial?._id;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(() => (initial ? toForm(initial) : EMPTY));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const bind = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set({ [key]: e.target.value } as any),
  });
  const cls = (base: string, key: string) => `${base} ${errors[key] ? styles.errorInput : ""}`;

  const searchPolicies = async (q: string): Promise<SelectOption[]> => {
    const res = await fetch(`/api/admin/claim-policy-search?q=${encodeURIComponent(q)}`, {
      credentials: "include",
    });
    const data = await res.json();
    return (data.policies || []).map((p: any) => ({
      value: p._id,
      label: p.policyNumber,
      sub: p.customer?.fullName || "",
      right: p.insurer || "",
      rightSub: p.lineOfBusiness || p.policyType || "",
      data: p,
    }));
  };

  // Picking a policy fills everything we already know about it; the rest
  // (channel, dates, amounts, remarks, loss details) stay manual.
  const onPolicySelect = (o: SelectOption) => {
    const p = o.data;
    set({
      policyId: p._id,
      policyNumber: p.policyNumber,
      insuredName: p.customer?.fullName || "",
      contactMobile: p.customer?.mobile || "",
      contactEmail: p.customer?.email || "",
      insurer: p.insurer || "",
      lineOfBusiness: p.lineOfBusiness || p.policyType || "",
      productCode: toProductCode(p.product || p.policyType || p.lineOfBusiness),
    });
    setErrors((e) => ({ ...e, policyNumber: "" }));
  };

  const clearPolicy = () =>
    set({
      policyId: "",
      policyNumber: "",
      insuredName: "",
      contactMobile: "",
      contactEmail: "",
      insurer: "",
      lineOfBusiness: "",
      productCode: "",
    });

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.policyNumber) e.policyNumber = "Select a policy";
      if (!form.claimType) e.claimType = "Required";
      if (!form.reportedChannel) e.reportedChannel = "Required";
      if (!form.specialRemark.trim()) e.specialRemark = "Required";
    }
    if (s === 2) {
      const req =
        form.claimType === "Non Employee Benefit"
          ? ["lossCause", "lossDetails", "siteAddress", "sitePinCode", "state", "city"]
          : ["patientName", "hospitalName", "diagnosis"];
      req.forEach((k) => {
        if (!String((form as any)[k]).trim()) e[k] = "Required";
      });
    }
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Please fill all required fields");
      return false;
    }
    return true;
  };

  const next = () => validate(step) && setStep((s) => s + 1);
  const prev = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/claims", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isEdit ? { ...form, id: initial._id } : form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to save claim");
        return;
      }
      toast.success(isEdit ? "Claim updated" : "Claim submitted");
      onCreated();
    } catch (err) {
      console.log("SUBMIT CLAIM ERROR", err);
      toast.error("Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  const isNEB = form.claimType === "Non Employee Benefit";
  const pct = step === 1 ? 0 : step === 2 ? 50 : 100;
  const stepLabels = ["Claim Details", "Additional Details", "Review & Submit"];

  return (
    <div className={styles.wizard}>
      <button type="button" className={styles.dBack} onClick={onCancel}>
        <FiArrowLeft /> {isEdit ? "Back to Claim" : "Back to Claims"}
      </button>
      <h1 className={styles.wizTitle}>{isEdit ? "Edit Claim" : "Create New Claim"}</h1>
      <p className={styles.wizSub}>
        {isEdit ? "Update the claim details" : "Fill in the details to submit a new claim"}
      </p>

      <div className={styles.stepper}>
        {stepLabels.map((label, i) => {
          const n = i + 1;
          const state = n < step ? styles.stepDone : n === step ? styles.stepActive : "";
          return (
            <div key={label} className={`${styles.stepItem} ${state}`}>
              <div className={styles.stepCircle}>{n < step ? <FiCheck /> : n}</div>
              {label}
            </div>
          );
        })}
      </div>

      <div className={styles.progressMeta}>
        <span>
          Step {step} of 3 — {stepLabels[step - 1]}
        </span>
        <span className={styles.progressPct}>{pct}%</span>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>

      {/* ============ STEP 1 ============ */}
      {step === 1 && (
        <>
          <h2 className={styles.stepHeading}>Step 1: Claim Details</h2>
          <p className={styles.stepSub}>Enter the basic claim information</p>

          <div className={styles.formCard}>
            <h3 className={styles.cardTitle}>Policy &amp; Basic Information</h3>
            <div className={styles.grid2}>
              <Field label="Policy Number" required err={errors.policyNumber}>
                <SearchableSelect
                  placeholder="Search policy number or insured name"
                  valueLabel={form.policyNumber}
                  onSearch={searchPolicies}
                  onSelect={onPolicySelect}
                  onClear={clearPolicy}
                  error={!!errors.policyNumber}
                />
              </Field>
              <Field label="Insured Name">
                <input className={styles.input} value={form.insuredName} readOnly placeholder="Auto-filled from policy" />
              </Field>
              <Field label="Contact Mobile">
                <input className={styles.input} {...bind("contactMobile")} placeholder="Auto-filled from policy" />
              </Field>
              <Field label="Contact Email">
                <input className={styles.input} {...bind("contactEmail")} placeholder="Auto-filled from policy" />
              </Field>
              <Field label="Product Code">
                <input className={styles.input} {...bind("productCode")} placeholder="Auto-filled from policy" />
              </Field>
            </div>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.cardTitle}>Claim Reporting Details</h3>
            <div className={styles.grid2}>
              <Field label="Claim Type" required err={errors.claimType}>
                <select className={cls(styles.select, "claimType")} {...bind("claimType")}>
                  {CLAIM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Claim No">
                <input className={styles.input} {...bind("claimNumber")} placeholder="Enter claim number" />
                <span className={styles.hint}>Leave blank to auto-generate (TEMP_CL-No_1, 2, ...)</span>
              </Field>
              <Field label="Reported Channel" required err={errors.reportedChannel}>
                <SearchableSelect
                  placeholder="Select channel"
                  valueLabel={form.reportedChannel}
                  options={CHANNEL_OPTIONS}
                  onSelect={(o) => {
                    set({ reportedChannel: o.value });
                    setErrors((e) => ({ ...e, reportedChannel: "" }));
                  }}
                  error={!!errors.reportedChannel}
                />
              </Field>
              <Field label="Date of Loss/Hospitalization date">
                <input type="date" className={styles.input} {...bind("dateOfLoss")} />
              </Field>
              <Field label="Reported On">
                <input type="date" className={styles.input} {...bind("reportedOn")} />
              </Field>
              <Field label="Claim Status">
                <select className={styles.select} {...bind("status")}>
                  {CLAIM_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Special remark" required err={errors.specialRemark}>
                <textarea className={cls(styles.textarea, "specialRemark")} {...bind("specialRemark")} />
              </Field>
              <Field label="Claim details / loss detail / hospitalization detail">
                <textarea
                  className={styles.textarea}
                  {...bind("claimDetails")}
                  placeholder="Enter a brief summary of the claim..."
                />
              </Field>
            </div>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.cardTitle}>Claim Amount Details</h3>
            <div className={styles.grid3}>
              <Field label="Estimated Amount (₹)">
                <input type="number" min={0} className={styles.input} {...bind("estimatedAmount")} />
              </Field>
              <Field label="Claimed Amount (₹)">
                <input type="number" min={0} className={styles.input} {...bind("claimedAmount")} />
              </Field>
              <Field label="Approved Amount (₹)">
                <input type="number" min={0} className={styles.input} {...bind("approvedAmount")} />
              </Field>
            </div>
          </div>

          <div className={styles.navRow}>
            <button type="button" className={styles.btnCancel} onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className={styles.btnNext} onClick={next}>
              Next <FiArrowRight />
            </button>
          </div>
        </>
      )}

      {/* ============ STEP 2 ============ */}
      {step === 2 && (
        <>
          <h2 className={styles.stepHeading}>Step 2: Additional Details - {form.claimType}</h2>
          <p className={styles.stepSub}>
            {isNEB ? "Property and marine insurance specific details" : "Health and employee benefit specific details"}
          </p>

          {isNEB ? (
            <>
              <div className={styles.formCard}>
                <h3 className={styles.cardTitle}>Loss Information</h3>
                <div className={styles.grid2}>
                  <Field label="Loss Cause" required err={errors.lossCause}>
                    <input className={cls(styles.input, "lossCause")} {...bind("lossCause")} />
                  </Field>
                  <Field label="Loss Details" required err={errors.lossDetails}>
                    <textarea className={cls(styles.textarea, "lossDetails")} {...bind("lossDetails")} />
                  </Field>
                </div>
              </div>

              <div className={styles.formCard}>
                <h3 className={styles.cardTitle}>Site Information</h3>
                <div className={styles.grid2}>
                  <Field label="Site Address" required err={errors.siteAddress} full>
                    <textarea className={cls(styles.textarea, "siteAddress")} {...bind("siteAddress")} />
                  </Field>
                  <Field label="Site PIN Code" required err={errors.sitePinCode} full>
                    <input
                      className={cls(styles.input, "sitePinCode")}
                      value={form.sitePinCode}
                      maxLength={6}
                      onChange={(e) => set({ sitePinCode: e.target.value.replace(/\D/g, "") })}
                    />
                  </Field>
                  <Field label="State" required err={errors.state}>
                    <input className={cls(styles.input, "state")} {...bind("state")} />
                  </Field>
                  <Field label="City" required err={errors.city}>
                    <input className={cls(styles.input, "city")} {...bind("city")} />
                  </Field>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.formCard}>
              <h3 className={styles.cardTitle}>Hospitalization Information</h3>
              <div className={styles.grid2}>
                <Field label="Patient Name" required err={errors.patientName}>
                  <input className={cls(styles.input, "patientName")} {...bind("patientName")} />
                </Field>
                <Field label="Hospital Name" required err={errors.hospitalName}>
                  <input className={cls(styles.input, "hospitalName")} {...bind("hospitalName")} />
                </Field>
                <Field label="Diagnosis / Ailment" required err={errors.diagnosis} full>
                  <textarea className={cls(styles.textarea, "diagnosis")} {...bind("diagnosis")} />
                </Field>
                <Field label="Admission Date">
                  <input type="date" className={styles.input} {...bind("admissionDate")} />
                </Field>
                <Field label="Discharge Date">
                  <input type="date" className={styles.input} {...bind("dischargeDate")} />
                </Field>
              </div>
            </div>
          )}

          <div className={styles.navRow}>
            <button type="button" className={styles.btnPrev} onClick={prev}>
              <FiArrowLeft /> Previous
            </button>
            <button type="button" className={styles.btnNext} onClick={next}>
              Next <FiArrowRight />
            </button>
          </div>
        </>
      )}

      {/* ============ STEP 3 ============ */}
      {step === 3 && (
        <>
          <div className={styles.reviewGrid}>
            <ReviewCard
              icon={<FiFileText />}
              title="Claim Snapshot"
              sub="Overview of claim details"
              rows={[
                ["Claim Number", form.claimNumber || "Auto-generated"],
                ["Product Code", form.productCode],
                ["Claim Type", form.claimType],
                ["Policy Number", form.policyNumber],
                ["Status", form.status],
                ["Estimated Amount", money(form.estimatedAmount)],
                ["Claimed Amount", money(form.claimedAmount)],
                ["Approved Amount", money(form.approvedAmount)],
                ["Date of Loss", fmtDate(form.dateOfLoss)],
              ]}
            />
            <ReviewCard
              icon={<FiUser />}
              title="Insured & Contact"
              sub="Policyholder information"
              rows={[
                ["Insured Name", form.insuredName],
                ["Mobile", form.contactMobile],
                ["Reported Via", form.reportedChannel],
              ]}
            />
            <ReviewCard
              icon={<FiMapPin />}
              title={isNEB ? "Loss Details" : "Hospitalization Details"}
              sub={isNEB ? "Location and loss information" : "Patient and hospital information"}
              rows={
                isNEB
                  ? [
                      ["Loss Cause", form.lossCause],
                      ["City", form.city],
                      ["State", form.state],
                      ["PIN Code", form.sitePinCode],
                    ]
                  : [
                      ["Patient Name", form.patientName],
                      ["Hospital Name", form.hospitalName],
                      ["Diagnosis", form.diagnosis],
                      ["Admission Date", fmtDate(form.admissionDate)],
                      ["Discharge Date", fmtDate(form.dischargeDate)],
                    ]
              }
            />
          </div>

          <div className={styles.notifyBox}>
            <label className={styles.notifyRow}>
              <input
                type="checkbox"
                checked={form.notify}
                onChange={(e) => set({ notify: e.target.checked })}
              />
              Notify via WhatsApp &amp; Email on submit and on every status change
            </label>
            <div className={styles.notifyNav}>
              <button type="button" className={styles.btnPrev} onClick={prev}>
                <FiArrowLeft /> Previous
              </button>
              <button type="button" className={styles.btnNext} onClick={submit} disabled={submitting}>
                <FiCheckCircle /> {submitting ? "Saving..." : isEdit ? "Save Changes" : "Submit Claim"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
