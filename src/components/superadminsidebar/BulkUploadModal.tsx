"use client";

import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import styles from "@/styles/components/superadminsidebar/BulkUploadModal.module.css";
import { FiDownload, FiFile, FiUpload, FiX } from "react-icons/fi";
import { BULK_UPLOAD_COLUMNS, BULK_UPLOAD_ALLOWED_VALUES } from "@/constants/bulkUploadColumns";

interface HistoryEntry {
  fileName: string;
  uploadedAt: Date;
  inserted: number;
  skipped: number;
}

interface SkippedRow {
  row: number;
  reason: string;
}

interface BulkUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
  submitEndpoint?: string;
}

const HEADER_TO_KEY = new Map(BULK_UPLOAD_COLUMNS.map((c) => [c.header, c.key]));

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  onClose,
  onSuccess,
  submitEndpoint = "/api/admin/policies-bulk",
}) => {
  const [tab, setTab] = useState<"upload" | "history">("upload");
  const [templateFormat, setTemplateFormat] = useState<"xlsx" | "csv">("xlsx");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState<{ inserted: number; skipped: SkippedRow[] } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildTemplateSheet = () => {
    const headers = BULK_UPLOAD_COLUMNS.map((c) => c.header);
    const exampleRow = BULK_UPLOAD_COLUMNS.map((c) => c.example);
    return XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  };

  const buildAllowedValuesSheet = () => {
    const rows = [
      ["Field", "Allowed Values"],
      ...BULK_UPLOAD_ALLOWED_VALUES.map((v) => [v.field, v.allowedValues]),
    ];
    return XLSX.utils.aoa_to_sheet(rows);
  };

  const downloadTemplate = () => {
    const worksheet = buildTemplateSheet();
    if (templateFormat === "csv") {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "Policies_Bulk_Upload_Template.csv");
    } else {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Policies");
      // A second, reference-only sheet — the parser only ever reads the
      // first sheet, so this is safe to include without affecting uploads.
      XLSX.utils.book_append_sheet(workbook, buildAllowedValuesSheet(), "Allowed Values");
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        "Policies_Bulk_Upload_Template.xlsx"
      );
    }
  };

  const handleFileSelected = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setFormError("File size must be ≤ 10MB");
      return;
    }
    setFormError("");
    setResult(null);
    setFile(f);
  };

  const handleUploadAndProcess = async () => {
    if (!file) {
      setFormError("Please choose a Policies file to upload");
      return;
    }
    setProcessing(true);
    setFormError("");
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      // Rows keyed by column header (from the template) -> keyed by our internal field name.
      // Any column not recognised from the template is simply ignored, and any recognised
      // column missing from a given row is left blank rather than failing the whole row.
      const mappedRows = rawRows.map((raw) => {
        const mapped: Record<string, any> = {};
        for (const [header, value] of Object.entries(raw)) {
          const key = HEADER_TO_KEY.get(header.trim());
          if (key) mapped[key] = value;
        }
        return mapped;
      });

      const res = await fetch(submitEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rows: mappedRows }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "Bulk upload failed");
        return;
      }

      setResult({ inserted: data.inserted, skipped: data.skipped || [] });
      setHistory((prev) => [
        {
          fileName: file.name,
          uploadedAt: new Date(),
          inserted: data.inserted,
          skipped: (data.skipped || []).length,
        },
        ...prev,
      ]);
      if (data.inserted > 0) onSuccess();
    } catch {
      setFormError("Could not read/process this file. Please check the format and try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Bulk Upload Policies</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "upload" ? styles.tabBtnActive : ""}`}
            onClick={() => setTab("upload")}
          >
            Upload
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "history" ? styles.tabBtnActive : ""}`}
            onClick={() => setTab("history")}
          >
            History
          </button>
        </div>

        <div className={styles.body}>
          {tab === "upload" ? (
            <>
              <div className={styles.section}>
                <div className={styles.sectionHeading}>
                  <FiFile /> Download Template
                </div>
                <p className={styles.sectionHint}>
                  Download the Policies bulk upload template to see required columns. The Excel
                  version includes an "Allowed Values" sheet listing the exact values accepted for
                  each dropdown field (Line of Business, Product, dates, etc.) — rows with values
                  outside these lists will be skipped with an error instead of being imported.
                </p>
                <div className={styles.templateRow}>
                  <select
                    className={styles.formatSelect}
                    value={templateFormat}
                    onChange={(e) => setTemplateFormat(e.target.value as "xlsx" | "csv")}
                  >
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="csv">CSV (.csv)</option>
                  </select>
                  <button type="button" className={styles.downloadBtn} onClick={downloadTemplate}>
                    <FiDownload /> Download Template
                  </button>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeading}>
                  <FiUpload /> Upload File
                </div>
                <label
                  className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFileSelected(e.dataTransfer.files?.[0] || null);
                  }}
                >
                  <FiUpload size={26} className={styles.dropzoneIcon} />
                  <span className={styles.dropzoneTitle}>
                    {file ? file.name : "Drag and drop your Policies file here"}
                  </span>
                  <span className={styles.dropzoneHint}>.xlsx, .xls, .csv up to 10MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {formError && <div className={styles.formErrorBanner}>{formError}</div>}

              {result && (
                <div className={styles.resultBanner}>
                  <p>
                    <strong>{result.inserted}</strong> polic{result.inserted === 1 ? "y" : "ies"} uploaded
                    successfully.
                    {result.skipped.length > 0 && (
                      <>
                        {" "}
                        <strong>{result.skipped.length}</strong> row(s) skipped.
                      </>
                    )}
                  </p>
                  {result.skipped.length > 0 && (
                    <ul className={styles.skippedList}>
                      {result.skipped.slice(0, 10).map((s, i) => (
                        <li key={i}>
                          Row {s.row}: {s.reason}
                        </li>
                      ))}
                      {result.skipped.length > 10 && <li>…and {result.skipped.length - 10} more</li>}
                    </ul>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.historyList}>
              {history.length === 0 ? (
                <div className={styles.emptyHistory}>No uploads yet in this session.</div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className={styles.historyItem}>
                    <div className={styles.historyFileName}>{h.fileName}</div>
                    <div className={styles.historyMeta}>
                      {h.uploadedAt.toLocaleString()} — {h.inserted} inserted
                      {h.skipped > 0 ? `, ${h.skipped} skipped` : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {tab === "upload" && (
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={processing}>
              Cancel
            </button>
            <button type="button" className={styles.uploadBtn} onClick={handleUploadAndProcess} disabled={processing}>
              {processing ? "Processing..." : "Upload & Process"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadModal;
