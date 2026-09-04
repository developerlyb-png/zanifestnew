// src/pages/carinsurance/CkycDialog.tsx
import { useEffect, useState } from "react";
import styles from "@/styles/pages/ckycDialog.module.css";
import { FaTimes, FaCheckCircle, FaCloudUploadAlt } from "react-icons/fa";
import sbiStateTable from "@/lib/sbiMasterData/state.json";

// Manual OVD's address only has city/pincode, no state — but SBI's
// City/District master-data matching is scoped by state, and the customer's
// own state can genuinely differ from the vehicle's registration state
// (confirmed live: a Delhi-registered car with a Noida/UP-resident owner
// failed to match "Noida" against Delhi's city table). Dedupe the raw
// branch-level state table down to one entry per state.
const SBI_STATES: { code: string; name: string }[] = Array.from(
  new Map(
    (sbiStateTable as any[]).map((s) => [s.State_Code, { code: s.State_Code, name: s.State_Name }])
  ).values()
).sort((a, b) => a.name.localeCompare(b.name));

// Confirmed from SBI's CKYC integration kit's ID-type table.
const ID_TYPES = [
  { value: "C", label: "PAN" },
  { value: "E", label: "Aadhaar Card Number" },
  { value: "A", label: "Passport" },
  { value: "B", label: "Voter ID" },
  { value: "D", label: "Driving License" },
  { value: "Z", label: "CKYC Identifier" },
];

// Attachment codes accepted by the Manual/OVD upload endpoint for an
// Individual customer's proof of address (confirmed via the CKYC Offline
// Metadata FL1 spec + the DocType enum sheet).
const MANUAL_ID_TYPES = [
  { value: "AadharCard", label: "Aadhaar Card" },
  { value: "Passport", label: "Passport" },
  { value: "DrivingLicence", label: "Driving Licence" },
  { value: "VoterID", label: "Voter ID" },
  // NREGA dropped — SBI's FullQuote validates the proposer's DOCTypeId
  // against CERSAI's own T_CKYC_DOCTYPE code table (A/B/C/D/E/Z below), and
  // NREGA has no code in that table; the OVD upload itself would still take
  // it, but FullQuote would then reject the policy outright.
];

// FullQuote validates PolicyCustomerList[0].DOCTypeId against a table SBI
// calls "T_CKYC_DOCTYPE" — confirmed live twice: both the OVD attachment-code
// string ("AadharCard") AND CERSAI's own single-letter code ("E") were
// rejected as "not within the code table value range". No file named exactly
// that exists anywhere in the integration kit, but SBI_T_PartyIDType (a real
// master-data table) uses this exact numeric scheme, and a genuine captured
// FullQuote sample used "IdType": "1" for a PAN holder — "1" there matches
// SBI_T_PartyIDType's PAN=1 exactly. Best-evidenced guess, still unconfirmed
// for this specific field name.
const MANUAL_ID_TYPE_TO_DOCTYPE_ID: Record<string, string> = {
  AadharCard: "5", // Gov UID
  Passport: "2",
  DrivingLicence: "6",
  VoterID: "4",
};

const PREFIXES = ["Mr", "Mrs", "Ms", "Mx"];

// Per the integration doc: 3 OTP attempts per CKYC transaction ID before a
// fresh Search Download call (new transaction) is required.
const MAX_OTP_ATTEMPTS = 3;

type Step = "id" | "otp" | "success" | "manual" | "manualSuccess";

const MONTHS3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// <input type="date"> gives "yyyy-mm-dd" — SBI wants "dd-MMM-yyyy".
const toDdMmmYyyy = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}-${MONTHS3[Number(m) - 1]}-${y}`;
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const extOf = (file: File) => {
  const fromName = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";
  return fromName || (file.type === "image/png" ? ".png" : ".jpeg");
};

export interface CkycResult {
  ckycTagsForFullQuote: Record<string, any>;
  record: any;
}

interface CkycDialogProps {
  open: boolean;
  onClose: () => void;
  onVerified: (result: CkycResult) => void;
}

const CkycDialog = ({ open, onClose, onVerified }: CkycDialogProps) => {
  const [step, setStep] = useState<Step>("id");
  const [idType, setIdType] = useState("C");
  const [idNumber, setIdNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [attempts, setAttempts] = useState(0);

  const [requestId, setRequestId] = useState<string | null>(null);
  const [ckycTransactionId, setCkycTransactionId] = useState<string | null>(null);
  const [maskedMobileMsg, setMaskedMobileMsg] = useState<string | null>(null);
  const [record, setRecord] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Manual/OVD fallback form state ----
  const [mPrefix, setMPrefix] = useState("Mr");
  const [mFirstName, setMFirstName] = useState("");
  const [mMiddleName, setMMiddleName] = useState("");
  const [mLastName, setMLastName] = useState("");
  const [mDob, setMDob] = useState("");
  const [mFatherFirstName, setMFatherFirstName] = useState("");
  const [mFatherLastName, setMFatherLastName] = useState("");
  const [mIdType, setMIdType] = useState("AadharCard");
  const [mIdNumber, setMIdNumber] = useState("");
  const [mMobile, setMMobile] = useState("");
  const [mEmail, setMEmail] = useState("");
  const [mPan, setMPan] = useState("");
  const [mHasNoPan, setMHasNoPan] = useState(false);
  const [mAddressLine1, setMAddressLine1] = useState("");
  const [mAddressCity, setMAddressCity] = useState("");
  const [mAddressState, setMAddressState] = useState("");
  const [mAddressPincode, setMAddressPincode] = useState("");
  const [mIdProofFile, setMIdProofFile] = useState<{ base64: string; ext: string; name: string } | null>(null);
  const [mPhotoFile, setMPhotoFile] = useState<{ base64: string; ext: string; name: string } | null>(null);
  const [manualReference, setManualReference] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep("id");
      setIdNumber("");
      setOtp("");
      setAttempts(0);
      setRequestId(null);
      setCkycTransactionId(null);
      setError(null);
      setMPrefix("Mr");
      setMFirstName("");
      setMMiddleName("");
      setMLastName("");
      setMDob("");
      setMFatherFirstName("");
      setMFatherLastName("");
      setMIdType("AadharCard");
      setMIdNumber("");
      setMMobile("");
      setMEmail("");
      setMPan("");
      setMHasNoPan(false);
      setMAddressLine1("");
      setMAddressCity("");
      setMAddressState("");
      setMAddressPincode("");
      setMIdProofFile(null);
      setMPhotoFile(null);
      setManualReference(null);
      // Prefill mobile/email from whatever the customer already verified at
      // login, if available — still editable since CKYC's registered mobile
      // may differ. Once CKYC (either path) succeeds, these become the
      // identity of record for SBI's checkout — no need to re-collect them.
      try {
        const saved = localStorage.getItem("user");
        if (saved && saved !== "undefined") {
          const user = JSON.parse(saved);
          if (user?.mobile) {
            setMobileNumber(String(user.mobile));
            setMMobile(String(user.mobile));
          }
          if (user?.email) setMEmail(String(user.email));
        }
      } catch {
        // ignore
      }
    }
  }, [open]);

  if (!open) return null;

  const startSearchDownload = async () => {
    if (!idNumber.trim() || !mobileNumber.trim()) {
      setError("Enter your ID number and registered mobile number");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sbi/ckyc/search-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idType, idNumber: idNumber.trim(), mobileNumber: mobileNumber.trim() }),
      });
      const data = await res.json();

      if (!data.success) {
        // No record / invalid mobile against CERSAI — fall back to manual OVD.
        setStep("manual");
        return;
      }

      setRequestId(data.requestId);
      setCkycTransactionId(data.ckycTransactionId);
      setMaskedMobileMsg(data.message || null);
      setAttempts(0);
      setOtp("");
      setStep("otp");
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (isResend = false) => {
    if (!isResend && !otp.trim()) {
      setError("Enter the OTP sent to your registered mobile");
      return;
    }
    if (!requestId || !ckycTransactionId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sbi/ckyc/fetch-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idType,
          idNumber: idNumber.trim(),
          ckycTransactionId,
          requestId,
          otp: isResend ? "" : otp.trim(),
          isResendOtp: isResend,
        }),
      });
      const data = await res.json();

      if (isResend) {
        // Resend doesn't consume an OTP-entry attempt.
        setOtp("");
        return;
      }

      if (!data.success) {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (nextAttempts >= MAX_OTP_ATTEMPTS) {
          // Attempts exhausted on this transaction — per the integration
          // doc, a fresh Search Download call (new transaction ID) is
          // required rather than retrying Fetch Record again.
          setError("Too many incorrect attempts. Requesting a new OTP...");
          await startSearchDownload();
        } else {
          setError(`Incorrect OTP. ${MAX_OTP_ATTEMPTS - nextAttempts} attempt(s) left.`);
        }
        return;
      }

      setRecord(data);
      setStep("success");
      onVerified({ ckycTagsForFullQuote: data.ckycTagsForFullQuote, record: data });
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: { base64: string; ext: string; name: string }) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Each file must be under 5MB");
      return;
    }
    const base64 = await fileToBase64(file);
    setter({ base64, ext: extOf(file), name: file.name });
  };

  const submitManualKyc = async () => {
    if (
      !mFirstName.trim() ||
      !mLastName.trim() ||
      !mDob ||
      !mFatherFirstName.trim() ||
      !mFatherLastName.trim() ||
      !mIdNumber.trim() ||
      !mMobile.trim() ||
      !mAddressLine1.trim() ||
      !mAddressCity.trim() ||
      !mAddressState
    ) {
      setError("Please fill in all required fields");
      return;
    }
    if (!mPan.trim() && !mHasNoPan) {
      setError("Enter your PAN, or confirm you don't have one (Form 60)");
      return;
    }
    if (!mIdProofFile || !mPhotoFile) {
      setError("Please upload both your ID proof and a photograph");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sbi/ckyc/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: mFirstName.trim(),
          middleName: mMiddleName.trim(),
          lastName: mLastName.trim(),
          prefix: mPrefix,
          dob: toDdMmmYyyy(mDob),
          fatherFirstName: mFatherFirstName.trim(),
          fatherLastName: mFatherLastName.trim(),
          idType: mIdType,
          idNumber: mIdNumber.trim(),
          pan: mPan.trim().toUpperCase(),
          hasNoPan: mHasNoPan,
          addressLine1: mAddressLine1.trim(),
          addressCity: mAddressCity.trim(),
          addressPincode: mAddressPincode.trim(),
          idProofImageBase64: mIdProofFile.base64,
          idProofImageExtension: mIdProofFile.ext,
          photographImageBase64: mPhotoFile.base64,
          photographImageExtension: mPhotoFile.ext,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "We couldn't submit your documents. Please try again.");
        return;
      }

      setManualReference(data.referenceNumber || data.recordIdentifier || null);
      setStep("manualSuccess");
      onVerified({
        ckycTagsForFullQuote: {
          CKYCVerified: "N",
          KYCCKYCNo: "",
          DOCTypeId: MANUAL_ID_TYPE_TO_DOCTYPE_ID[mIdType] || "",
          DOCTypeName: mIdNumber.trim(),
          CKYCUniqueId: data.recordIdentifier || "",
          CKYCSourceType: "SBIG",
        },
        // Same shape as the OTP path's fetch-record response — so the SBI
        // checkout page can treat "identity came from CKYC" the same way
        // regardless of which path actually verified it, and never has to
        // ask the customer to re-type their own details.
        record: {
          fullName: `${mFirstName.trim()} ${mLastName.trim()}`.trim(),
          dob: mDob,
          gender: mPrefix === "Mrs" || mPrefix === "Ms" ? "F" : mPrefix === "Mx" ? "T" : "M",
          email: mEmail.trim(),
          mobile: mMobile.trim(),
          correspondenceAddress: {
            line1: mAddressLine1.trim(),
            city: mAddressCity.trim(),
            state: mAddressState,
            pincode: mAddressPincode.trim(),
          },
          idType: mIdType,
          idNumber: mIdNumber.trim(),
          data,
        },
      });
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={step === "manual" ? `${styles.box} ${styles.wideBox}` : styles.box}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Verify your KYC</h2>
            <p className={styles.subtitle}>
              {step === "id" && "Required before we can issue your SBI policy"}
              {step === "otp" && (maskedMobileMsg || "Enter the OTP sent to your registered mobile")}
              {step === "success" && "KYC verified successfully"}
              {step === "manual" && "We couldn't find a CKYC record for you — upload your ID proof instead"}
              {step === "manualSuccess" && "Documents submitted successfully"}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        {step === "id" && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>ID Type</label>
              <select
                className={styles.select}
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
              >
                {ID_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>ID Number</label>
              <input
                className={styles.input}
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
                placeholder="Enter ID number"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Mobile Number (registered with CERSAI)</label>
              <input
                className={styles.input}
                value={mobileNumber}
                maxLength={10}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
              />
            </div>

            <button className={styles.primaryBtn} onClick={startSearchDownload} disabled={loading}>
              {loading ? "Checking..." : "Send OTP"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Enter OTP</label>
              <input
                className={styles.otpInput}
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="------"
              />
              <p className={styles.hint}>
                {attempts > 0 ? `${MAX_OTP_ATTEMPTS - attempts} attempt(s) left` : "Valid for a limited time"}
              </p>
            </div>

            <button className={styles.primaryBtn} onClick={() => verifyOtp(false)} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <span
              className={styles.resendLink}
              data-disabled={loading}
              onClick={() => !loading && verifyOtp(true)}
            >
              Resend OTP
            </span>
          </>
        )}

        {step === "success" && record && (
          <>
            <div className={styles.successBanner}>
              <FaCheckCircle /> KYC verified via CKYC
            </div>
            <div className={styles.detailRow}>
              <span>Name</span>
              <strong>{record.fullName}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Date of Birth</span>
              <strong>{record.dob}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Address</span>
              <strong>
                {[record.correspondenceAddress?.line1, record.correspondenceAddress?.line2, record.correspondenceAddress?.city]
                  .filter(Boolean)
                  .join(", ")}
              </strong>
            </div>
            <button className={styles.primaryBtn} onClick={onClose}>
              Continue
            </button>
          </>
        )}

        {step === "manual" && (
          <>
            <div className={styles.manualBanner}>
              We couldn&apos;t retrieve your KYC details from CERSAI automatically. Please fill in your
              details below and upload your documents to complete verification manually.
            </div>

            <div className={styles.sectionLabel}>Personal Details</div>
            <div className={styles.row3}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-prefix">Prefix</label>
                <select
                  id="ckyc-m-prefix"
                  className={styles.select}
                  value={mPrefix}
                  onChange={(e) => setMPrefix(e.target.value)}
                >
                  {PREFIXES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-first">First Name</label>
                <input
                  id="ckyc-m-first"
                  className={styles.input}
                  value={mFirstName}
                  onChange={(e) => setMFirstName(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-last">Last Name</label>
                <input
                  id="ckyc-m-last"
                  className={styles.input}
                  value={mLastName}
                  onChange={(e) => setMLastName(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-middle">Middle Name (optional)</label>
                <input
                  id="ckyc-m-middle"
                  className={styles.input}
                  value={mMiddleName}
                  onChange={(e) => setMMiddleName(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-dob">Date of Birth</label>
                <input
                  id="ckyc-m-dob"
                  type="date"
                  className={styles.input}
                  value={mDob}
                  onChange={(e) => setMDob(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-father-first">Father&apos;s First Name</label>
                <input
                  id="ckyc-m-father-first"
                  className={styles.input}
                  value={mFatherFirstName}
                  onChange={(e) => setMFatherFirstName(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-father-last">Father&apos;s Last Name</label>
                <input
                  id="ckyc-m-father-last"
                  className={styles.input}
                  value={mFatherLastName}
                  onChange={(e) => setMFatherLastName(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.sectionLabel}>Identity Proof</div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-idtype">ID Type</label>
                <select
                  id="ckyc-m-idtype"
                  className={styles.select}
                  value={mIdType}
                  onChange={(e) => setMIdType(e.target.value)}
                >
                  {MANUAL_ID_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-idnum">ID Number</label>
                <input
                  id="ckyc-m-idnum"
                  className={styles.input}
                  value={mIdNumber}
                  onChange={(e) => setMIdNumber(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-mobile">Mobile Number</label>
                <input
                  id="ckyc-m-mobile"
                  className={styles.input}
                  value={mMobile}
                  maxLength={10}
                  onChange={(e) => setMMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-email">Email</label>
                <input
                  id="ckyc-m-email"
                  className={styles.input}
                  value={mEmail}
                  onChange={(e) => setMEmail(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="ckyc-m-pan">PAN</label>
              <input
                id="ckyc-m-pan"
                className={styles.input}
                value={mPan}
                disabled={mHasNoPan}
                maxLength={10}
                placeholder="ABCDE1234F"
                onChange={(e) => setMPan(e.target.value.toUpperCase())}
              />
            </div>
            <label className={styles.checkboxRow} htmlFor="ckyc-m-nopan">
              <input
                id="ckyc-m-nopan"
                type="checkbox"
                checked={mHasNoPan}
                onChange={(e) => {
                  setMHasNoPan(e.target.checked);
                  if (e.target.checked) setMPan("");
                }}
              />
              I don&apos;t have a PAN (declare Form 60 instead)
            </label>

            <div className={styles.sectionLabel}>Address</div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ckyc-m-addr1">Address Line 1</label>
              <input
                id="ckyc-m-addr1"
                className={styles.input}
                value={mAddressLine1}
                onChange={(e) => setMAddressLine1(e.target.value)}
              />
            </div>
            <div className={styles.row3}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-city">City</label>
                <input
                  id="ckyc-m-city"
                  className={styles.input}
                  value={mAddressCity}
                  onChange={(e) => setMAddressCity(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-state">State</label>
                <select
                  id="ckyc-m-state"
                  className={styles.select}
                  value={mAddressState}
                  onChange={(e) => setMAddressState(e.target.value)}
                >
                  <option value="">Select</option>
                  {SBI_STATES.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ckyc-m-pin">Pincode</label>
                <input
                  id="ckyc-m-pin"
                  className={styles.input}
                  value={mAddressPincode}
                  maxLength={6}
                  onChange={(e) => setMAddressPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
            </div>

            <div className={styles.sectionLabel}>Documents</div>
            <div className={styles.uploadRow}>
              <label className={styles.uploadBox} htmlFor="ckyc-m-idfile">
                <input
                  id="ckyc-m-idfile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleManualFile(e, setMIdProofFile)}
                />
                <div className={styles.uploadIcon}><FaCloudUploadAlt /></div>
                <div className={styles.uploadLabel}>ID Proof Document</div>
                {mIdProofFile && <div className={styles.uploadFileName}>{mIdProofFile.name}</div>}
              </label>
              <label className={styles.uploadBox} htmlFor="ckyc-m-photofile">
                <input
                  id="ckyc-m-photofile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleManualFile(e, setMPhotoFile)}
                />
                <div className={styles.uploadIcon}><FaCloudUploadAlt /></div>
                <div className={styles.uploadLabel}>Photograph</div>
                {mPhotoFile && <div className={styles.uploadFileName}>{mPhotoFile.name}</div>}
              </label>
            </div>

            <button type="button" className={styles.primaryBtn} onClick={submitManualKyc} disabled={loading}>
              {loading ? "Submitting..." : "Submit Documents"}
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={() => setStep("id")}>
              Try a different ID instead
            </button>
          </>
        )}

        {step === "manualSuccess" && (
          <>
            <div className={styles.successBanner}>
              <FaCheckCircle /> Documents submitted for verification
            </div>
            <p className={styles.subtitle}>
              Your KYC documents have been received{manualReference ? ` (reference: ${manualReference})` : ""}.
              You can continue with your policy purchase while verification completes.
            </p>
            <button type="button" className={styles.primaryBtn} onClick={onClose}>
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CkycDialog;
