import React from "react";
import { FaCloudUploadAlt, FaCheckCircle } from "react-icons/fa";
import styles from "@/styles/components/cart/ShriramCheckoutForm.module.css";
import DateSelect from "./DateSelect";

// Shriram General proposal form for the car cart. Presentational only: the
// cart owns the state and the submit (handleProposalShriram), so the same
// values feed the summary card and the proposal API.

export type ShriramKycMode = "PAN" | "FORM60";

export interface ShriramFormValues {
  firstName: string;
  lastName: string;
  gender: string; // "Male" | "Female"
  dob: string; // yyyy-mm-dd
  mobile: string;
  email: string;
  address1: string;
  city: string;
  pincode: string;
  fatherName: string;
  kycMode: ShriramKycMode;
  pan: string;
  aadhaar: string;
  panFile: File | null; // PAN card, or the filled Form 60
  aadhaarFile: File | null; // Form 60 only
  photoFile: File | null; // Form 60 only
  prevInsurer: string;
  prevPolicyNo: string;
  tpPolicyNo: string;
  tpInsurer: string;
  tpFrom: string;
  tpTo: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeDob: string;
  physicalPolicy: boolean;
}

interface Props {
  values: ShriramFormValues;
  onChange: <K extends keyof ShriramFormValues>(key: K, value: ShriramFormValues[K]) => void;
  odOnly: boolean;
  insurerOptions: string[];
  tpInsurerOptions: string[];
  tpWarning?: string | null;
}

// Official Income Tax Department page for Form 60 (declaration when no PAN)
const FORM_60_URL = "https://incometaxindia.gov.in/w/form-60";

const NOMINEE_RELATIONS = ["Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister"];
const THIS_YEAR = new Date().getFullYear();
const fmt = (iso: string) => (iso ? iso.split("-").reverse().join("-") : "");

function Section(props: { step: number; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.stepNo}>{props.step}</span>
        <div>
          <h3 className={styles.sectionTitle}>{props.title}</h3>
          {props.sub && <p className={styles.sectionSub}>{props.sub}</p>}
        </div>
      </div>
      <div className={styles.sectionBody}>{props.children}</div>
    </div>
  );
}

function Field(props: { label: string; optional?: boolean; full?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className={`${styles.field} ${props.full ? styles.full : ""}`}>
      <label className={styles.label}>
        {props.label} {props.optional && <span className={styles.optional}>(optional)</span>}
      </label>
      {props.children}
      {props.hint && <p className={styles.hint}>{props.hint}</p>}
    </div>
  );
}

function Segment<T extends string>(props: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className={styles.segment}>
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={props.value === o.value ? styles.active : ""}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FileUpload(props: {
  file: File | null;
  onChange: (f: File | null) => void;
  prompt: string;
  accept?: string;
  formats?: string;
}) {
  const id = React.useId();
  const f = props.file;
  return (
    <label htmlFor={id} className={`${styles.upload} ${f ? styles.uploadDone : ""}`}>
      {f ? <FaCheckCircle className={styles.uploadIcon} /> : <FaCloudUploadAlt className={styles.uploadIcon} />}
      <span className={styles.uploadText}>
        <span className={styles.uploadName}>{f ? f.name : props.prompt}</span>
        <span className={styles.uploadMeta}>
          {f ? `${(f.size / 1024 / 1024).toFixed(2)} MB` : `${props.formats || "PDF, JPG or PNG"} · up to 4 MB`}
        </span>
      </span>
      <span className={styles.uploadAction}>{f ? "Change" : "Browse"}</span>
      <input
        id={id}
        type="file"
        className={styles.hiddenFile}
        accept={props.accept || ".pdf,.jpg,.jpeg,.png"}
        onChange={(e) => props.onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}

export default function ShriramCheckoutForm({ values: v, onChange, odOnly, insurerOptions, tpInsurerOptions, tpWarning }: Props) {
  const text = (key: keyof ShriramFormValues, transform?: (s: string) => string) => ({
    className: styles.input,
    value: String(v[key] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(key, (transform ? transform(e.target.value) : e.target.value) as any),
  });
  const digits = (max: number) => (s: string) => s.replace(/\D/g, "").slice(0, max);
  const form60 = v.kycMode === "FORM60";

  return (
    <div className={styles.stack}>
      <Section step={1} title="Owner details" sub="As per the vehicle's registration certificate">
        <div className={styles.grid}>
          <Field label="First name">
            <input {...text("firstName")} placeholder="First name" />
          </Field>
          <Field label="Last name">
            <input {...text("lastName")} placeholder="Last name" />
          </Field>
          <Field label="Gender">
            <Segment
              value={v.gender.toUpperCase().startsWith("F") ? "Female" : "Male"}
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
              ]}
              onChange={(g) => onChange("gender", g)}
            />
          </Field>
          <Field label="Date of birth">
            <DateSelect
              value={v.dob}
              onChange={(d) => onChange("dob", d)}
              minYear={THIS_YEAR - 100}
              maxYear={THIS_YEAR - 18}
              ariaLabel="Date of birth"
            />
          </Field>
          <Field label="Father's name">
            <input {...text("fatherName")} placeholder="Father's full name" />
          </Field>
          <Field label="Mobile number">
            <input {...text("mobile", digits(10))} inputMode="numeric" placeholder="10-digit mobile" />
          </Field>
          <Field label="Email" full>
            <input {...text("email")} type="email" placeholder="you@example.com" />
          </Field>
          <Field label="Address" full>
            <input {...text("address1")} placeholder="House no, street, area" />
          </Field>
          <Field label="City">
            <input {...text("city")} placeholder="City" />
          </Field>
          <Field label="Pincode">
            <input {...text("pincode", digits(6))} inputMode="numeric" placeholder="6-digit pincode" />
          </Field>
        </div>
      </Section>

      <Section step={2} title="KYC verification" sub="Required by Shriram General Insurance before issuing the policy">
        {/* Almost every car owner has a PAN, so Form 60 is a quiet fallback
            rather than an up-front choice. */}
        {form60 && (
          <p className={styles.info}>
            <strong>No PAN? Submit Form 60.</strong> Form 60 is the Income Tax declaration for people without a
            PAN. Download it from the{" "}
            <a href={FORM_60_URL} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
              Income Tax Department website
            </a>
            , fill and sign it, then upload it below with your Aadhaar card and a recent photo.{" "}
            <button type="button" className={styles.linkBtn} onClick={() => onChange("kycMode", "PAN")}>
              I have a PAN
            </button>
          </p>
        )}

        <div className={styles.grid}>
          {!form60 && (
            <Field label="PAN number">
              <input
                {...text("pan", (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                placeholder="ABCDE1234F"
              />
              <button type="button" className={styles.linkBtn} onClick={() => onChange("kycMode", "FORM60")}>
                Don&apos;t have a PAN? Submit Form 60 instead
              </button>
            </Field>
          )}
          <Field label="Aadhaar number" full={form60}>
            <input {...text("aadhaar", digits(12))} inputMode="numeric" placeholder="12-digit Aadhaar" />
          </Field>
          <Field label={form60 ? "Signed Form 60" : "PAN card"} full>
            <FileUpload
              file={v.panFile}
              onChange={(f) => onChange("panFile", f)}
              prompt={form60 ? "Upload signed Form 60" : "Upload PAN card"}
            />
          </Field>
          {form60 && (
            <>
              <Field label="Aadhaar card" full>
                <FileUpload
                  file={v.aadhaarFile}
                  onChange={(f) => onChange("aadhaarFile", f)}
                  prompt="Upload Aadhaar card (front and back)"
                />
              </Field>
              <Field label="Your photo" full>
                <FileUpload
                  file={v.photoFile}
                  onChange={(f) => onChange("photoFile", f)}
                  prompt="Upload a recent passport-size photo"
                  accept=".jpg,.jpeg,.png"
                  formats="JPG or PNG"
                />
              </Field>
            </>
          )}
        </div>
      </Section>

      <Section step={3} title="Previous policy" sub="Filled from your RC — please check">
        <div className={styles.grid}>
          <Field label="Previous insurer" full>
            <select
              className={styles.select}
              value={v.prevInsurer}
              onChange={(e) => onChange("prevInsurer", e.target.value)}
            >
              <option value="">Select insurer</option>
              {insurerOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Previous policy number" full>
            <input {...text("prevPolicyNo", (s) => s.trim())} placeholder="As printed on your policy" />
          </Field>
        </div>

        {odOnly && (
          <>
            <p className={styles.info}>
              Your car is under 3 years old, so it already has a 3-year third-party policy. This purchase covers own
              damage only — please confirm the third-party policy below.
            </p>
            <div className={styles.grid}>
              <Field label="Third-party policy number" full>
                <input {...text("tpPolicyNo", (s) => s.trim())} placeholder="Usually same as the policy above" />
              </Field>
              <Field label="Third-party insurer" full>
                <select
                  className={styles.select}
                  value={v.tpInsurer}
                  onChange={(e) => onChange("tpInsurer", e.target.value)}
                >
                  <option value="">Select insurer</option>
                  {tpInsurerOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="TP policy start date">
                <DateSelect
                  value={v.tpFrom}
                  onChange={(d) => onChange("tpFrom", d)}
                  minYear={THIS_YEAR - 4}
                  maxYear={THIS_YEAR}
                  ariaLabel="Third-party policy start date"
                />
              </Field>
              <Field label="TP policy end date" hint="Always 3 years from the start date">
                <input className={styles.input} value={fmt(v.tpTo)} readOnly placeholder="Set from start date" />
              </Field>
            </div>
            {tpWarning && <p className={styles.warn}>{tpWarning}</p>}
          </>
        )}
      </Section>

      <Section step={4} title="Nominee" sub="Receives the personal accident cover benefit">
        <div className={styles.grid}>
          <Field label="Nominee name" full>
            <input {...text("nomineeName")} placeholder="Nominee's full name" />
          </Field>
          <Field label="Relation">
            <select
              className={styles.select}
              value={v.nomineeRelation}
              onChange={(e) => onChange("nomineeRelation", e.target.value)}
            >
              {NOMINEE_RELATIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Nominee date of birth" hint="Nominee must be 18 or older">
            <DateSelect
              value={v.nomineeDob}
              onChange={(d) => onChange("nomineeDob", d)}
              minYear={THIS_YEAR - 100}
              maxYear={THIS_YEAR - 18}
              ariaLabel="Nominee date of birth"
            />
          </Field>
        </div>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={v.physicalPolicy}
            onChange={(e) => onChange("physicalPolicy", e.target.checked)}
          />
          Also send me a printed copy of the policy by post
        </label>
      </Section>
    </div>
  );
}
