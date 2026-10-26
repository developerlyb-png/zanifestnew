"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiArrowLeft, FiFile, FiRefreshCw, FiSettings, FiUpload, FiX } from "react-icons/fi";
import styles from "@/styles/components/superadminsidebar/Reconcile.module.css";

interface CompanyOption {
  _id: string;
  name: string;
  branch: string;
}

export default function NewReconciliation({
  onCancel,
  onCreated,
  onPreview,
}: {
  onCancel: () => void;
  onCreated: (batchId: string) => void;
  onPreview: (batch: any) => void;
}) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companyId, setCompanyId] = useState("");
  const [file, setFile] = useState<{ name: string; size: number; data: string } | null>(null);
  const [dryRun, setDryRun] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config-insurance-companies", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCompanies(d.items || []))
      .catch(() => setCompanies([]))
      .finally(() => setLoadingCompanies(false));
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File exceeds 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, size: f.size, data: reader.result as string });
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const fmtSize = (bytes: number) => `${(bytes / 1024).toFixed(2)} KB`;

  const handleStart = async () => {
    if (!companyId) return toast.error("Select an insurance company");
    if (!file) return toast.error("Upload a commission statement file");

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/reconcile-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          insuranceCompanyConfigId: companyId,
          fileName: file.name,
          fileData: file.data,
          dryRun,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to run reconciliation");
        return;
      }
      if (dryRun) {
        toast.success("Preview generated (nothing was saved)");
        onPreview(data.batch);
      } else {
        toast.success(`Reconciliation batch #${data.batch.batchNo} created`);
        onCreated(data.batch._id);
      }
    } catch {
      toast.error("Failed to run reconciliation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.backLink} onClick={onCancel}>
        <FiArrowLeft /> Back to reconciliation
      </button>

      <div className={styles.pageHead}>
        <span className={styles.pageIcon}>
          <FiRefreshCw />
        </span>
        <div>
          <h1 className={styles.pageTitle}>New Reconciliation</h1>
          <p className={styles.pageSub}>Select an insurance company and upload the commission statement.</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardTitleIcon}>
            <FiSettings />
          </span>
          <h3 className={styles.cardTitle}>Process</h3>
        </div>
        <p className={styles.cardHint}>Select an insurance company and upload the Commission Statement.</p>

        <div className={styles.formGrid2}>
          <div className={styles.field}>
            <label className={styles.label}>
              Insurance Company <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select className={styles.select} value={companyId} onChange={(e) => setCompanyId(e.target.value)} disabled={loadingCompanies}>
              <option value="">{loadingCompanies ? "Loading..." : "Select an insurance company"}</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.branch})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Upload Commission Statement</label>
            {file ? (
              <div className={styles.fileChosen}>
                <div className={styles.fileChosenInfo}>
                  <span className={styles.fileIcon}>
                    <FiFile size={16} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileMeta}>{fmtSize(file.size)}</div>
                  </div>
                </div>
                <button type="button" className={styles.fileRemoveBtn} onClick={() => setFile(null)}>
                  <FiX size={16} />
                </button>
              </div>
            ) : (
              <label className={styles.dropzone}>
                <FiUpload size={22} color="#94a3b8" />
                <span className={styles.dropzoneTitle}>Upload file with commission data</span>
                <span className={styles.dropzoneHint}>Supported formats: XLSX, XLS, CSV up to 10MB</span>
                <input type="file" hidden accept=".xlsx,.xls,.csv" onChange={handleFile} />
              </label>
            )}
          </div>
        </div>

        <label className={styles.checkboxRow}>
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          Preview only (dry run) — do not store the statement or reconciliation history
        </label>

        <div className={styles.navRow}>
          <button type="button" className={styles.btnPrimary} onClick={handleStart} disabled={submitting}>
            <FiRefreshCw /> {submitting ? "Reconciling..." : "Start Reconciliation"}
          </button>
        </div>
      </div>
    </div>
  );
}
