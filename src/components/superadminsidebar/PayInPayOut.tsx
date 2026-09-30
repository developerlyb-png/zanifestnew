"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import ps from "@/styles/components/superadminsidebar/PayInPayOut.module.css";
import { FiPercent, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import {
  TRANSACTION_TYPES,
  LINES_OF_BUSINESS,
  PRODUCTS_BY_LOB,
  POLICY_TYPES_BY_LOB,
  INSURANCE_COMPANIES,
  MEDIUM_OF_ISSUANCE,
  FUEL_TYPES,
  NCB_OPTIONS,
  MOTOR_MAKES,
} from "@/constants/policyFormOptions";
import {
  ANY,
  BUSINESS_SEGMENTS,
  MOTOR_FIELDS,
  MOTOR_FIELD_LABELS,
} from "@/constants/payinPayoutRule";

interface RuleRow {
  _id: string;
  startDate: string;
  insurer?: string;
  businessSegment?: string;
  lineOfBusiness?: string;
  product?: string;
  policyType?: string;
  transactionType?: string;
  mediumOfInsurance?: string;
  payInPercent: number;
  payOutPercent: number;
  active: boolean;
  createdBy?: string;
  [key: string]: any;
}

const EMPTY_FORM: Record<string, string> = {
  startDate: "",
  insurer: ANY,
  businessSegment: ANY,
  lineOfBusiness: ANY,
  product: ANY,
  policyType: ANY,
  transactionType: ANY,
  mediumOfInsurance: ANY,
  payInPercent: "",
  payOutPercent: "",
  fuel: ANY,
  rto: "",
  manufacture: ANY,
  ncb: ANY,
  volume: "",
  typeOfPolicy: "",
  capacity: "",
  discount: "",
  bodyType: "",
  gvw: "",
  vehicleAge: "",
};

const uniq = (arr: string[]) => Array.from(new Set(arr));
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// Module-level so inputs keep focus between keystrokes.
function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={ps.field}>
      <label className={ps.label}>
        {label}
        {required && <span className={ps.req}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectBox({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select className={ps.input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value={ANY}>{ANY}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function RuleModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const isMotor = form.lineOfBusiness === "Motor";
  const products = useMemo(
    () => (form.lineOfBusiness === ANY ? uniq(Object.values(PRODUCTS_BY_LOB).flat()) : PRODUCTS_BY_LOB[form.lineOfBusiness] || []),
    [form.lineOfBusiness]
  );
  const policyTypes = useMemo(
    () =>
      form.lineOfBusiness === ANY
        ? uniq(Object.values(POLICY_TYPES_BY_LOB).flat())
        : POLICY_TYPES_BY_LOB[form.lineOfBusiness] || [],
    [form.lineOfBusiness]
  );

  const text = (k: string, placeholder?: string, type = "text") => (
    <input
      className={ps.input}
      type={type}
      min={type === "number" ? 0 : undefined}
      value={form[k]}
      placeholder={placeholder}
      onChange={(e) => set(k, e.target.value)}
    />
  );

  const save = async () => {
    if (!form.startDate) return toast.error("Start date is required");
    for (const k of ["payInPercent", "payOutPercent"]) {
      const n = Number(form[k]);
      if (form[k] === "" || !Number.isFinite(n) || n < 0 || n > 100) {
        return toast.error("PayIn % and PayOut % must be between 0 and 100");
      }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/commission-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to save rule");
        return;
      }
      toast.success("Rule created");
      onSaved();
    } catch {
      toast.error("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={ps.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={ps.modal}>
        <div className={ps.modalHead}>
          <div>
            <h3 className={ps.modalTitle}>Create Pay In / Pay Out Rule</h3>
            <p className={ps.modalSub}>
              Set Pay In / Pay Out % for policies matching these criteria
              {isMotor ? " — choosing Motor below adds vehicle-specific criteria" : ""}
            </p>
          </div>
          <button type="button" className={ps.closeBtn} onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        <div className={ps.modalBody}>
          <div className={ps.sectionTitle}>Rule Details</div>
          <div className={ps.grid}>
            <FormField label="Start Date" required>
              {text("startDate", undefined, "date")}
            </FormField>
            <FormField label="Insurance Company">
              <SelectBox value={form.insurer} options={INSURANCE_COMPANIES} onChange={(v) => set("insurer", v)} />
            </FormField>
            <FormField label="Business Segment">
              <SelectBox value={form.businessSegment} options={BUSINESS_SEGMENTS} onChange={(v) => set("businessSegment", v)} />
            </FormField>
            <FormField label="Line Of Business">
              <SelectBox
                value={form.lineOfBusiness}
                options={LINES_OF_BUSINESS}
                onChange={(v) => setForm((f) => ({ ...f, lineOfBusiness: v, product: ANY, policyType: ANY }))}
              />
            </FormField>
            <FormField label="Product">
              <SelectBox value={form.product} options={products} onChange={(v) => set("product", v)} />
            </FormField>
            <FormField label="Policy Type">
              <SelectBox value={form.policyType} options={policyTypes} onChange={(v) => set("policyType", v)} />
            </FormField>
            <FormField label="Transaction Type">
              <SelectBox value={form.transactionType} options={TRANSACTION_TYPES} onChange={(v) => set("transactionType", v)} />
            </FormField>
            <FormField label="Medium of Insurance">
              <SelectBox value={form.mediumOfInsurance} options={MEDIUM_OF_ISSUANCE} onChange={(v) => set("mediumOfInsurance", v)} />
            </FormField>
          </div>

          {isMotor && (
            <>
              <div className={ps.sectionTitle}>Motor Criteria</div>
              <div className={ps.grid}>
                <FormField label={MOTOR_FIELD_LABELS.fuel}>
                  <SelectBox value={form.fuel} options={FUEL_TYPES} onChange={(v) => set("fuel", v)} />
                </FormField>
                <FormField label={MOTOR_FIELD_LABELS.rto}>{text("rto", "e.g. PB10, HR26")}</FormField>
                <FormField label={MOTOR_FIELD_LABELS.manufacture}>
                  <SelectBox value={form.manufacture} options={MOTOR_MAKES} onChange={(v) => set("manufacture", v)} />
                </FormField>
                <FormField label={MOTOR_FIELD_LABELS.ncb}>
                  <SelectBox value={form.ncb} options={NCB_OPTIONS} onChange={(v) => set("ncb", v)} />
                </FormField>
                <FormField label={MOTOR_FIELD_LABELS.volume}>{text("volume", "e.g. 1000000")}</FormField>
                <FormField label={MOTOR_FIELD_LABELS.typeOfPolicy}>{text("typeOfPolicy")}</FormField>
                <FormField label={MOTOR_FIELD_LABELS.capacity}>{text("capacity", "e.g. 1200 cc")}</FormField>
                <FormField label={MOTOR_FIELD_LABELS.discount}>{text("discount", "e.g. 20")}</FormField>
                <FormField label={MOTOR_FIELD_LABELS.bodyType}>{text("bodyType")}</FormField>
                <FormField label={MOTOR_FIELD_LABELS.gvw}>{text("gvw", "e.g. 3500")}</FormField>
                <FormField label={MOTOR_FIELD_LABELS.vehicleAge}>{text("vehicleAge", "e.g. 5", "number")}</FormField>
              </div>
            </>
          )}

          <div className={ps.sectionTitle}>Commission</div>
          <div className={ps.grid}>
            <FormField label="PayIn %" required>
              <input
                className={ps.input}
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.payInPercent}
                placeholder="e.g. 20"
                onChange={(e) => set("payInPercent", e.target.value)}
              />
            </FormField>
            <FormField label="PayOut %" required>
              <input
                className={ps.input}
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.payOutPercent}
                placeholder="e.g. 15"
                onChange={(e) => set("payOutPercent", e.target.value)}
              />
            </FormField>
          </div>
        </div>

        <div className={ps.modalFoot}>
          <button type="button" className={ps.cancelBtn} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className={ps.saveBtn} onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayInPayOut() {
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchRules = () => {
    setLoading(true);
    fetch("/api/admin/commission-rules", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setRules(data.rules || []))
      .catch((err) => console.error("Failed to load rules", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const deleteRule = async (id: string) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      const res = await fetch("/api/admin/commission-rules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setRules((prev) => prev.filter((r) => r._id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete rule");
    }
  };

  const motorSummary = (r: RuleRow) =>
    MOTOR_FIELDS.filter((f) => r[f])
      .map((f) => `${MOTOR_FIELD_LABELS[f]}: ${r[f]}`)
      .join(", ") || "—";

  return (
    <div className={styles.cont}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Pay In Pay Out</h2>
        <div className={styles.headerActions}>
          <button className={styles.primaryBtn} onClick={() => setShowModal(true)}>
            <FiPercent /> Create Rule
          </button>
        </div>
      </div>

      {showModal && (
        <RuleModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchRules();
          }}
        />
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table} style={{ minWidth: 1300 }}>
          <thead>
            <tr>
              <th>Start Date</th>
              <th>Insurance Company</th>
              <th>Segment</th>
              <th>Line Of Business</th>
              <th>Product</th>
              <th>Policy Type</th>
              <th>Transaction</th>
              <th>Medium</th>
              <th>Motor Criteria</th>
              <th>PayIn %</th>
              <th>PayOut %</th>
              <th>Created By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.emptyCell} colSpan={13}>
                  Loading...
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={13}>
                  No rules created yet.
                </td>
              </tr>
            ) : (
              rules.map((r) => (
                <tr key={r._id}>
                  <td>{fmtDate(r.startDate)}</td>
                  <td>{r.insurer || ANY}</td>
                  <td>{r.businessSegment || ANY}</td>
                  <td>{r.lineOfBusiness || ANY}</td>
                  <td>{r.product || ANY}</td>
                  <td>{r.policyType || ANY}</td>
                  <td>{r.transactionType || ANY}</td>
                  <td>{r.mediumOfInsurance || ANY}</td>
                  <td style={{ maxWidth: 260 }}>{r.lineOfBusiness === "Motor" ? motorSummary(r) : "—"}</td>
                  <td>{r.payInPercent}%</td>
                  <td>{r.payOutPercent}%</td>
                  <td>{r.createdBy || "—"}</td>
                  <td>
                    <button className={ps.rowDelete} title="Delete rule" onClick={() => deleteRule(r._id)}>
                      <FiTrash2 />
                    </button>
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
