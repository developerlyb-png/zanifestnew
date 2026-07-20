// src/pages/carinsurance/IdvEditDialog.tsx
import { useEffect, useState } from "react";
import styles from "@/styles/pages/idvEditDialog.module.css";
import { requoteWithIdv } from "@/lib/zuno4w";
import { FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";

interface IdvEditDialogProps {
  open: boolean;
  defaultIdv: number;
  currentIdv: number;
  quoteInput: any;
  addons?: string[];
  onApply: (newIdv: number, updatedPlan: any) => void;
  onClose: () => void;
}

const roundTo100 = (n: number) => Math.round(n / 100) * 100;

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const IdvEditDialog = ({
  open,
  defaultIdv,
  currentIdv,
  quoteInput,
  addons = [],
  onApply,
  onClose,
}: IdvEditDialogProps) => {
  const [mode, setMode] = useState<"recommended" | "custom">("recommended");
  const [draftIdv, setDraftIdv] = useState(currentIdv);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (open) {
      setDraftIdv(currentIdv);
      setMode(currentIdv === defaultIdv ? "recommended" : "custom");
      setError(null);
    }
  }, [open, currentIdv, defaultIdv]);

  if (!open) return null;

  const min = roundTo100(defaultIdv * 0.85);
  const max = roundTo100(defaultIdv * 1.15);
  const finalIdv = mode === "recommended" ? defaultIdv : draftIdv;

  const handleApply = async () => {
    setLoading(true);
    setError(null);
    try {
      const updatedPlan = await requoteWithIdv(quoteInput, finalIdv, addons);
      onApply(finalIdv, updatedPlan);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Car insured value (IDV)</h2>
            <p className={styles.subtitle}>
              What the insurer pays in case of total damage/theft
            </p>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div
          className={`${styles.optionRow} ${
            mode === "recommended" ? styles.optionRowSelected : ""
          }`}
          onClick={() => setMode("recommended")}
        >
          <span className={styles.radio} data-checked={mode === "recommended"} />
          <span className={styles.optionLabel}>Recommended IDV</span>
          <span className={styles.optionValue}>{inr(defaultIdv)}</span>
        </div>

        <div
          className={`${styles.optionRow} ${
            mode === "custom" ? styles.optionRowSelected : ""
          }`}
          onClick={() => setMode("custom")}
        >
          <span className={styles.radio} data-checked={mode === "custom"} />
          <span className={styles.optionLabel}>Choose your own IDV</span>
          <span className={styles.optionValue}>{inr(draftIdv)}</span>
        </div>

        {mode === "custom" && (
          <div className={styles.sliderBlock}>
            <input
              type="range"
              className={styles.slider}
              min={min}
              max={max}
              step={100}
              value={draftIdv}
              onChange={(e) => setDraftIdv(Number(e.target.value))}
            />
            <div className={styles.rangeLabels}>
              <span>{inr(min)}</span>
              <span>{inr(max)}</span>
            </div>
          </div>
        )}

        <div
          className={styles.infoToggle}
          onClick={() => setShowInfo((prev) => !prev)}
        >
          What should be my IDV?{" "}
          {showInfo ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        {showInfo && (
          <p className={styles.infoText}>
            IDV is the maximum amount your insurer pays in case of total loss
            or theft. It's based on your car's current market value after
            depreciation. You can keep the recommended value or choose your
            own within ±15% of it.
          </p>
        )}

        {error && <p className={styles.errorText}>{error}</p>}

        <button
          className={styles.updateBtn}
          onClick={handleApply}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  );
};

export default IdvEditDialog;
