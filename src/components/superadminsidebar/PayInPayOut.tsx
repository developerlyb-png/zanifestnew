"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import ps from "@/styles/components/superadminsidebar/PayInPayOut.module.css";
import { FiCheck, FiChevronLeft, FiChevronRight, FiPercent, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import {
  INSURANCE_COMPANIES,
  MEDIUM_OF_ISSUANCE,
  MOTOR_MAKES,
  NCB_OPTIONS,
  FUEL_TYPES,
  PRODUCTS_BY_LOB,
  POLICY_TYPES_BY_LOB,
  TRANSACTION_TYPES,
} from "@/constants/policyFormOptions";
import rtoLocation from "@/lib/sbiMasterData/rtoLocation.json";
import { ANY, BUSINESS_SEGMENTS, MOTOR_FIELD_LABELS, MOTOR_TEXT_FIELDS } from "@/constants/payinPayoutRule";

const RTO_CODES: string[] = Array.from(
  new Set((rtoLocation as any[]).map((r) => r.RTO_Code).filter(Boolean))
).sort();

const STEPS = ["Who & when", "What it covers", "Commission"] as const;

interface AgentOption {
  _id: string;
  name: string;
}

interface RuleRow {
  _id: string;
  startDate: string;
  lineOfBusiness?: "Motor" | "Non Motor";
  agentNames?: string[];
  insurer?: string;
  product?: string;
  policyType?: string;
  rtos?: string[];
  manufacturers?: string[];
  payInPercent: number;
  payOutPercent: number;
  createdBy?: string;
}

const EMPTY_FORM: Record<string, string> = {
  startDate: "",
  lineOfBusiness: "",
  insurer: ANY,
  businessSegment: ANY,
  product: ANY,
  policyType: ANY,
  transactionType: ANY,
  mediumOfInsurance: ANY,
  fuel: ANY,
  ncb: ANY,
  volume: "",
  typeOfPolicy: "",
  capacity: "",
  discount: "",
  bodyType: "",
  gvw: "",
  vehicleAge: "",
  payInPercent: "",
  payOutPercent: "",
};

const uniq = (arr: string[]) => Array.from(new Set(arr));
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtInr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const agentLabel = (a: AgentOption) => a.name || "Agent";

// Module-level so inputs keep focus while typing.
function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className={ps.field}>
      <label className={ps.label}>
        {label}
        {required && <span className={ps.req}>*</span>}
      </label>
      {children}
      {hint && <span className={ps.hint}>{hint}</span>}
    </div>
  );
}

function SelectBox({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
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

interface TickOption {
  value: string;
  label: string;
}

const toOpts = (arr: string[]): TickOption[] => arr.map((v) => ({ value: v, label: v }));

// Tick-box list with search. An empty selection means "All". When onAddNew
// is given, admins can type a value that isn't in the list and add it —
// the caller persists it and this selects it once saved.
function TickList({
  options,
  selected,
  onChange,
  allLabel,
  searchPlaceholder,
  maxResults = 100,
  hint,
  onAddNew,
  addPlaceholder,
}: {
  options: TickOption[];
  selected: string[];
  onChange: (v: string[]) => void;
  allLabel: string;
  searchPlaceholder: string;
  maxResults?: number;
  hint?: string;
  onAddNew?: (value: string) => Promise<string | null>;
  addPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [newValue, setNewValue] = useState("");
  const [adding, setAdding] = useState(false);
  const q = query.trim().toLowerCase();
  const allSelected = selected.length === 0;

  const visible = useMemo(() => {
    const pool = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    return pool.slice(0, maxResults);
  }, [options, q, maxResults]);

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  const addNew = async () => {
    const v = newValue.trim();
    if (!v || !onAddNew || adding) return;
    setAdding(true);
    try {
      const saved = await onAddNew(v);
      if (saved) {
        onChange([...selected, saved]);
        setNewValue("");
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={ps.tickBox}>
      <div className={ps.tickBoxTop}>
        <label className={ps.tickRow}>
          <input type="checkbox" checked={allSelected} onChange={() => onChange([])} />
          <span>{allLabel}</span>
        </label>
        <span className={ps.tickCount}>{allSelected ? "No restriction" : `${selected.length} selected`}</span>
      </div>
      <div className={ps.searchBox}>
        <FiSearch size={14} />
        <input placeholder={searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className={ps.tickScroll}>
        {visible.map((o) => (
          <label key={o.value} className={ps.tickRow}>
            <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
        {visible.length === 0 && <div className={ps.emptyNote}>No matches</div>}
      </div>
      {onAddNew && (
        <div className={ps.addRow}>
          <input
            className={ps.addInput}
            placeholder={addPlaceholder || "Not in the list? Add it"}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNew();
              }
            }}
          />
          <button type="button" className={ps.addBtn} onClick={addNew} disabled={!newValue.trim() || adding}>
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      )}
      {hint && <span className={ps.hint}>{hint}</span>}
    </div>
  );
}

function Stepper({ step, onJump }: { step: number; onJump: (n: number) => void }) {
  return (
    <ol className={ps.stepper}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "active" : "todo";
        return (
          <li key={label} className={ps.stepItem}>
            <button
              type="button"
              className={`${ps.stepBtn} ${ps[state]}`}
              onClick={() => n < step && onJump(n)}
              disabled={n > step}
            >
              <span className={ps.stepDot}>{state === "done" ? <FiCheck size={12} /> : n}</span>
              <span className={ps.stepLabel}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function RuleModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Record<string, string>>({ ...EMPTY_FORM });
  const [rtos, setRtos] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [customMakes, setCustomMakes] = useState<string[]>([]);
  const [customRtos, setCustomRtos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Same list POSP Management shows; "onboarded" = training and assessment both completed.
    fetch("/api/admin/posp-management", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const onboarded = (d.agents || [])
          .filter((a: any) => a.trainingCompleted && a.assessmentCompleted)
          .map((a: any) => ({ _id: a._id, name: a.name || a.email || "Agent" }))
          .sort((x: AgentOption, y: AgentOption) => x.name.localeCompare(y.name));
        setAgents(onboarded);
      })
      .catch(() => setAgents([]));
    fetch("/api/admin/motormakes", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCustomMakes(d.makes || []))
      .catch(() => setCustomMakes([]));
    fetch("/api/admin/rtocodes", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCustomRtos(d.codes || []))
      .catch(() => setCustomRtos([]));
  }, []);

  const addManufacturer = async (name: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/admin/motormakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to add manufacturer");
        return null;
      }
      setCustomMakes((prev) => uniq([...prev, data.make]));
      toast.success(`${data.make} added`);
      return data.make;
    } catch {
      toast.error("Failed to add manufacturer");
      return null;
    }
  };

  const addRto = async (code: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/admin/rtocodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to add RTO");
        return null;
      }
      setCustomRtos((prev) => uniq([...prev, data.code]));
      toast.success(`${data.code} added`);
      return data.code;
    } catch {
      toast.error("Failed to add RTO");
      return null;
    }
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isMotor = form.lineOfBusiness === "Motor";
  // "All" covers both families, so its product and policy-type lists are the union.
  const lobKey = form.lineOfBusiness === "All" ? null : isMotor ? "Motor" : "Non Motor";
  const selectedAgents = agents.filter((a) => agentIds.includes(a._id));

  const makeOptions = useMemo(
    () => uniq([...MOTOR_MAKES, ...customMakes]).sort((a, b) => a.localeCompare(b)),
    [customMakes]
  );
  const rtoOptions = useMemo(
    () => uniq([...RTO_CODES, ...customRtos]).sort((a, b) => a.localeCompare(b)),
    [customRtos]
  );
  // "All" covers both families, so offer the union of their product and policy-type lists.
  const productOptions = !form.lineOfBusiness
    ? []
    : !lobKey
    ? uniq(Object.values(PRODUCTS_BY_LOB).flat())
    : PRODUCTS_BY_LOB[lobKey] || [];
  const policyTypeOptions = !form.lineOfBusiness
    ? []
    : !lobKey
    ? uniq(Object.values(POLICY_TYPES_BY_LOB).flat())
    : POLICY_TYPES_BY_LOB[lobKey] || [];

  const payIn = Number(form.payInPercent) || 0;
  const payOut = Number(form.payOutPercent) || 0;
  const SAMPLE_PREMIUM = 10000;

  // Each step validates only its own fields before moving on.
  const stepError = (): string | null => {
    if (step === 1) {
      if (!form.startDate) return "Choose a start date";
      if (!form.lineOfBusiness) return "Choose Motor or Non Motor";
    }
    if (step === 3) {
      if (form.payInPercent === "" || form.payOutPercent === "") return "Enter PayIn % and PayOut %";
      if (payIn < 0 || payIn > 100 || payOut < 0 || payOut > 100) return "Percentages must be between 0 and 100";
    }
    return null;
  };

  const next = () => {
    const err = stepError();
    if (err) return toast.error(err);
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const save = async () => {
    const err = stepError();
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/commission-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, rtos, manufacturers, agentIds }),
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
      <div className={ps.modal} role="dialog" aria-label="Create Pay In Pay Out rule">
        <header className={ps.modalHead}>
          <div>
            <h3 className={ps.modalTitle}>New Pay In / Pay Out rule</h3>
            <p className={ps.modalSub}>Set what the insurer pays us and what we pay the agent.</p>
          </div>
          <button type="button" className={ps.closeBtn} onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </header>

        <Stepper step={step} onJump={setStep} />

        <div className={ps.modalBody}>
          {step === 1 && (
            <div className={ps.stack}>
              <Field label="Line of business" required hint="Choose the product family first — the next step adapts to it.">
                <div className={ps.segmented} role="radiogroup">
                  {(["All", "Motor", "Non Motor"] as const).map((lob) => (
                    <button
                      key={lob}
                      type="button"
                      role="radio"
                      aria-checked={form.lineOfBusiness === lob}
                      className={`${ps.segment} ${form.lineOfBusiness === lob ? ps.segmentOn : ""}`}
                      onClick={() => {
                        set("lineOfBusiness", lob);
                        set("product", ANY);
                        set("policyType", ANY);
                        setRtos([]);
                        setManufacturers([]);
                      }}
                    >
                      {lob}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Start date" required>
                <input type="date" className={ps.input} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </Field>

              <Field label="Agent" hint="Tick one or more. Leave All to apply to everyone.">
                <TickList
                  options={agents.map((a) => ({ value: a._id, label: agentLabel(a) }))}
                  selected={agentIds}
                  onChange={setAgentIds}
                  allLabel="All agents"
                  searchPlaceholder="Search agent"
                />
              </Field>

              {selectedAgents.length > 0 && (
                <div className={ps.callout}>
                  Only policies sold by <b>{selectedAgents.map(agentLabel).join(", ")}</b> will use this rule.
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className={ps.stack}>
              {!form.lineOfBusiness && <div className={ps.callout}>Go back and choose a line of business first.</div>}

              {form.lineOfBusiness && (
                <div className={ps.grid2}>
                  <Field label="Insurance company">
                    <SelectBox value={form.insurer} options={INSURANCE_COMPANIES} onChange={(v) => set("insurer", v)} />
                  </Field>
                  <Field label="Business segment">
                    <SelectBox value={form.businessSegment} options={BUSINESS_SEGMENTS} onChange={(v) => set("businessSegment", v)} />
                  </Field>
                  <Field label="Product">
                    <SelectBox value={form.product} options={productOptions} onChange={(v) => set("product", v)} />
                  </Field>
                  <Field label="Policy type">
                    <SelectBox value={form.policyType} options={policyTypeOptions} onChange={(v) => set("policyType", v)} />
                  </Field>
                  <Field label="Transaction type">
                    <SelectBox value={form.transactionType} options={TRANSACTION_TYPES} onChange={(v) => set("transactionType", v)} />
                  </Field>
                  <Field label="Medium of insurance">
                    <SelectBox value={form.mediumOfInsurance} options={MEDIUM_OF_ISSUANCE} onChange={(v) => set("mediumOfInsurance", v)} />
                  </Field>
                </div>
              )}

              {isMotor && (
                <>
                  <div className={ps.twoCol}>
                    <Field label="Manufacturer" hint="Tick one or more, or add one not listed. Leave All to cover every make.">
                      <TickList
                        options={toOpts(makeOptions)}
                        selected={manufacturers}
                        onChange={setManufacturers}
                        allLabel="All manufacturers"
                        searchPlaceholder="Search manufacturer"
                        onAddNew={addManufacturer}
                        addPlaceholder="Add a manufacturer"
                      />
                    </Field>
                    <Field label="RTO" hint="Matched from the registration number, e.g. UP14… → UP-14.">
                      <TickList
                        options={toOpts(rtoOptions)}
                        selected={rtos}
                        onChange={setRtos}
                        allLabel="All RTO"
                        searchPlaceholder="Search RTO, e.g. UP-14"
                        maxResults={80}
                        onAddNew={addRto}
                        addPlaceholder="Add an RTO code, e.g. UP-99"
                      />
                    </Field>
                  </div>

                  <div className={ps.grid2}>
                    <Field label="Fuel">
                      <SelectBox value={form.fuel} options={FUEL_TYPES} onChange={(v) => set("fuel", v)} />
                    </Field>
                    <Field label="NCB">
                      <SelectBox value={form.ncb} options={NCB_OPTIONS} onChange={(v) => set("ncb", v)} />
                    </Field>
                  </div>

                  <details className={ps.more}>
                    <summary>More vehicle criteria</summary>
                    <div className={ps.grid2}>
                      {MOTOR_TEXT_FIELDS.filter((f) => f !== "fuel" && f !== "ncb").map((f) => (
                        <Field
                          key={f}
                          label={MOTOR_FIELD_LABELS[f]}
                          hint={["volume", "capacity", "discount", "bodyType", "gvw", "vehicleAge", "typeOfPolicy"].includes(f) ? "Saved, but not checked against policies yet." : undefined}
                        >
                          <input className={ps.input} value={form[f]} placeholder="Any" onChange={(e) => set(f, e.target.value)} />
                        </Field>
                      ))}
                    </div>
                  </details>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className={ps.stack}>
              <div className={ps.grid2}>
                <Field label="PayIn % (from insurer)" required>
                  <div className={ps.suffix}>
                    <input className={ps.input} type="number" min={0} max={100} step="0.01" value={form.payInPercent} placeholder="e.g. 20" onChange={(e) => set("payInPercent", e.target.value)} />
                    <span>%</span>
                  </div>
                </Field>
                <Field label="PayOut % (to agent)" required>
                  <div className={ps.suffix}>
                    <input className={ps.input} type="number" min={0} max={100} step="0.01" value={form.payOutPercent} placeholder="e.g. 15" onChange={(e) => set("payOutPercent", e.target.value)} />
                    <span>%</span>
                  </div>
                </Field>
              </div>

              <div className={ps.summary}>
                <div className={ps.summaryRow}><span>Applies to</span><b>{selectedAgents.length ? selectedAgents.map(agentLabel).join(", ") : "All agents"}</b></div>
                <div className={ps.summaryRow}><span>Line of business</span><b>{form.lineOfBusiness || "—"}</b></div>
                <div className={ps.summaryRow}><span>Starts</span><b>{form.startDate || "—"}</b></div>
                {isMotor && (
                  <div className={ps.summaryRow}>
                    <span>Vehicles</span>
                    <b>{manufacturers.length ? manufacturers.join(", ") : "All makes"} · {rtos.length ? rtos.join(", ") : "All RTO"}</b>
                  </div>
                )}
              </div>

              {form.payInPercent !== "" && form.payOutPercent !== "" && (
                <div className={ps.preview}>
                  <FiPercent />
                  <span>
                    On a {fmtInr(SAMPLE_PREMIUM)} premium we receive <b>{fmtInr((SAMPLE_PREMIUM * payIn) / 100)}</b> and the
                    agent gets <b>{fmtInr((SAMPLE_PREMIUM * payOut) / 100)}</b>.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className={ps.modalFoot}>
          <button type="button" className={ps.ghostBtn} onClick={step === 1 ? onClose : () => setStep((s) => s - 1)} disabled={saving}>
            {step === 1 ? "Cancel" : (<><FiChevronLeft /> Back</>)}
          </button>
          {step < STEPS.length ? (
            <button type="button" className={ps.primaryBtn} onClick={next}>
              Continue <FiChevronRight />
            </button>
          ) : (
            <button type="button" className={ps.primaryBtn} onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save rule"}
            </button>
          )}
        </footer>
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

  const listOrAll = (list?: string[]) => (list && list.length ? list.join(", ") : "All");

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
              <th>Line Of Business</th>
              <th>Agent</th>
              <th>Insurance Company</th>
              <th>Manufacturer</th>
              <th>RTO</th>
              <th>Product</th>
              <th>Policy Type</th>
              <th>PayIn %</th>
              <th>PayOut %</th>
              <th>Created By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.emptyCell} colSpan={12}>Loading...</td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={12}>No rules created yet.</td>
              </tr>
            ) : (
              rules.map((r) => (
                <tr key={r._id}>
                  <td>{fmtDate(r.startDate)}</td>
                  <td>{r.lineOfBusiness || "All"}</td>
                  <td>{r.agentNames?.length ? r.agentNames.join(", ") : "All agents"}</td>
                  <td>{r.insurer || ANY}</td>
                  <td>{r.lineOfBusiness === "Motor" ? listOrAll(r.manufacturers) : "—"}</td>
                  <td>{r.lineOfBusiness === "Motor" ? listOrAll(r.rtos) : "—"}</td>
                  <td>{r.product || ANY}</td>
                  <td>{r.policyType || ANY}</td>
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
