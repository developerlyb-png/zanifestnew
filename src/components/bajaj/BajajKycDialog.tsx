import { useState } from "react";
import styles from "@/styles/pages/ckycDialog.module.css";
import { FaTimes, FaCheckCircle } from "react-icons/fa";

// Bajaj KYC 2.0 for a motor proposal (see /api/bajaj/4w/kyc):
//   1. PAN or Aadhaar + mobile -> Bajaj sends an OTP
//   2. OTP -> KYC done
// If the OTP route can't verify the customer, Bajaj's fallback is PAN check
// + an address-proof upload. On success the parent gets Bajaj's `kycProof`,
// which issue-policy requires.

type Step = "start" | "otp" | "pan" | "poa" | "done";

const POA_TYPES = [
  { value: "AADHAAR", label: "Aadhaar Card" },
  { value: "DL", label: "Driving Licence" },
  { value: "PASSPORT", label: "Passport" },
  { value: "VOTER", label: "Voter ID" },
];

interface Props {
  open: boolean;
  transactionId: string;
  premium: number;
  isNew: boolean;
  fullName: string;
  mobile: string;
  pan: string;
  // /api/bajaj/4w/kyc or /api/bajaj/2w/kyc (same backend)
  kycUrl?: string;
  onClose: () => void;
  onVerified: (kycProof: string) => void;
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Bajaj's verifyPOAUpload takes ONE document and rejects an Aadhaar without
// both sides ("Aadhaar FRONT_TOP/BACK is missing", seen live). Stack the two
// photos vertically into a single JPEG (base64, no data: prefix).
const MAX_WIDTH = 1600;
const combineImages = async (front: File, back: File) => {
  const load = (f: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Couldn't read ${f.name} as an image`));
      img.src = URL.createObjectURL(f);
    });
  const [a, b] = await Promise.all([load(front), load(back)]);
  const width = Math.min(MAX_WIDTH, Math.max(a.naturalWidth, b.naturalWidth));
  const h = (img: HTMLImageElement) => Math.round((img.naturalHeight * width) / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = h(a) + h(b);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(a, 0, 0, width, h(a));
  ctx.drawImage(b, 0, h(a), width, h(b));
  URL.revokeObjectURL(a.src);
  URL.revokeObjectURL(b.src);
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1] || "";
};

export default function BajajKycDialog(props: Props) {
  const [step, setStep] = useState<Step>("start");
  const [docType, setDocType] = useState<"PAN" | "AADHAAR">("PAN");
  const [docNumber, setDocNumber] = useState(props.pan || "");
  const [mobile, setMobile] = useState(props.mobile || "");
  const [otpId, setOtpId] = useState("");
  const [otp, setOtp] = useState("");
  const [panNumber, setPanNumber] = useState(props.pan || "");
  const [poaType, setPoaType] = useState("AADHAAR");
  const [poaFront, setPoaFront] = useState<File | null>(null);
  const [poaBack, setPoaBack] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!props.open) return null;

  const call = async (action: string, extra: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(props.kycUrl || "/api/bajaj/4w/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          transactionId: props.transactionId,
          premium: props.premium,
          isNew: props.isNew,
          fullName: props.fullName,
          ...extra,
        }),
      });
      const data = await res.json();
      if (!data.success) setError(data.message || "Bajaj couldn't verify these details");
      return data;
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const finish = (data: any) => {
    setStep("done");
    props.onVerified(data.kycProof);
  };

  const sendOtp = async () => {
    const valid = docType === "PAN" ? /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(docNumber) : /^\d{12}$/.test(docNumber);
    if (!valid) return setError(docType === "PAN" ? "Enter a valid PAN" : "Enter your 12-digit Aadhaar number");
    if (!/^[6-9]\d{9}$/.test(mobile)) return setError("Enter a valid 10-digit mobile number");
    const data = await call("send-otp", { docType, docNumber, mobile });
    if (data.success) {
      setOtpId(String(data.otpId));
      setOtp("");
      setStep("otp");
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{4,8}$/.test(otp)) return setError("Enter the OTP sent to your mobile");
    const data = await call("verify-otp", { docType, docNumber, otpId, otp });
    if (data.success) finish(data);
  };

  const verifyPan = async () => {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) return setError("Enter a valid PAN");
    const data = await call("verify-pan", { docNumber: panNumber });
    if (data.success) setStep("poa");
  };

  const isPdf = (f: File | null) => !!f && /pdf$/i.test(f.type || f.name);

  const uploadPoa = async () => {
    if (!poaFront) return setError("Upload the front of your document");
    if ([poaFront, poaBack].some((f) => f && f.size > 4 * 1024 * 1024)) {
      return setError("Each file must be under 4 MB");
    }
    // One PDF holding both sides goes as-is; two photos are joined into one
    if (!poaBack && !isPdf(poaFront)) {
      return setError("Upload the back as well, or one PDF with both sides");
    }
    if (poaBack && (isPdf(poaFront) || isPdf(poaBack))) {
      return setError("For front and back, upload two photos (JPG/PNG), or one PDF with both sides as the front");
    }
    let documentBase64 = "";
    try {
      documentBase64 = poaBack ? await combineImages(poaFront, poaBack) : await fileToBase64(poaFront);
    } catch (e: any) {
      return setError(e.message || "Couldn't read the files");
    }
    const data = await call("upload-poa", { docType: poaType, documentBase64 });
    if (data.success) finish(data);
  };

  return (
    <div className={styles.overlay} onClick={props.onClose}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Verify your KYC</h2>
            <p className={styles.subtitle}>Required by Bajaj Allianz before your policy is issued.</p>
          </div>
          <button className={styles.closeBtn} onClick={props.onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        {step === "start" && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>ID Type</label>
              <select
                className={styles.select}
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value as "PAN" | "AADHAAR");
                  setDocNumber(e.target.value === "PAN" ? props.pan || "" : "");
                }}
              >
                <option value="PAN">PAN</option>
                <option value="AADHAAR">Aadhaar</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{docType === "PAN" ? "PAN Number" : "Aadhaar Number"}</label>
              <input
                className={styles.input}
                value={docNumber}
                maxLength={docType === "PAN" ? 10 : 12}
                onChange={(e) =>
                  setDocNumber(docType === "PAN" ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Mobile Number</label>
              <input
                className={styles.input}
                value={mobile}
                maxLength={10}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <button className={styles.primaryBtn} onClick={sendOtp} disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
            {/* e.g. the PAN's CKYC record has a different mobile (Bajaj 204) */}
            {error && (
              <button
                className={styles.resendLink}
                onClick={() => {
                  setError(null);
                  if (docType === "PAN") setPanNumber(docNumber);
                  setStep("pan");
                }}
              >
                Verify with documents instead
              </button>
            )}
          </>
        )}

        {step === "otp" && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Enter OTP</label>
              <input
                className={styles.otpInput}
                value={otp}
                maxLength={8}
                inputMode="numeric"
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
              <p className={styles.hint}>Sent by Bajaj Allianz to {mobile}.</p>
            </div>
            <button className={styles.primaryBtn} onClick={verifyOtp} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button className={styles.resendLink} onClick={sendOtp} disabled={loading}>
              Resend OTP
            </button>
            {error && (
              <button
                className={styles.resendLink}
                onClick={() => {
                  setError(null);
                  setStep("pan");
                }}
              >
                Verify with documents instead
              </button>
            )}
          </>
        )}

        {step === "pan" && (
          <>
            <div className={styles.manualBanner}>Step 1 of 2: confirm your PAN</div>
            <div className={styles.field}>
              <label className={styles.label}>PAN Number</label>
              <input
                className={styles.input}
                value={panNumber}
                maxLength={10}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              />
            </div>
            <button className={styles.primaryBtn} onClick={verifyPan} disabled={loading}>
              {loading ? "Checking..." : "Continue"}
            </button>
          </>
        )}

        {step === "poa" && (
          <>
            <div className={styles.manualBanner}>Step 2 of 2: upload an address proof</div>
            <div className={styles.field}>
              <label className={styles.label}>Document</label>
              <select className={styles.select} value={poaType} onChange={(e) => setPoaType(e.target.value)}>
                {POA_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Front side (photo, or one PDF with both sides)</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setPoaFront(e.target.files?.[0] || null)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Back side (photo)</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => setPoaBack(e.target.files?.[0] || null)}
              />
              <p className={styles.hint}>Bajaj needs both sides, e.g. the Aadhaar back with your address.</p>
            </div>
            <button className={styles.primaryBtn} onClick={uploadPoa} disabled={loading}>
              {loading ? "Uploading..." : "Verify"}
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <div className={styles.successBanner}>
              <FaCheckCircle /> KYC verified
            </div>
            <p className={styles.hint}>Taking you to payment…</p>
          </>
        )}
      </div>
    </div>
  );
}
