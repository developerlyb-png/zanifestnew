// src/pages/carinsurance/ClaimDetailDialog.tsx
import styles from "@/styles/pages/claimDetailDialog.module.css";
import { FaTimes } from "react-icons/fa";

export type ClaimAnswer = "Yes" | "No" | "NotSure";

interface ClaimDetailDialogProps {
  open: boolean;
  onSelect: (answer: ClaimAnswer) => void;
  onClose: () => void;
}

const OPTIONS: { label: string; value: ClaimAnswer }[] = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
  { label: "Not sure", value: "NotSure" },
];

const ClaimDetailDialog = ({
  open,
  onSelect,
  onClose,
}: ClaimDetailDialogProps) => {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Claim detail</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <p className={styles.question}>
          Did you make a claim in your existing policy?
        </p>

        <div className={styles.options}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={styles.optionButton}
              onClick={() => onSelect(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClaimDetailDialog;
