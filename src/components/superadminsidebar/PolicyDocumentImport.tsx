"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDocumentImport.module.css";
import {
  FiArrowLeft,
  FiUploadCloud,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiEye,
  FiTrash2,
  FiInbox,
  FiAlertTriangle,
  FiSave,
} from "react-icons/fi";

interface ExtractedFields {
  policy_number?: string | null;
  proposal_number?: string | null;
  insured_name?: string | null;
  mobile?: string | null;
  email?: string | null;
  insurer?: string | null;
  policy_type?: string | null;
  product_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  gross_premium?: number | null;
  net_premium?: number | null;
  gst?: number | null;
  sum_insured?: number | null;
  idv?: number | null;
  vehicle_number?: string | null;
  make_model?: string | null;
  engine_number?: string | null;
  chassis_number?: string | null;
  nominee?: string | null;
  agent_broker_name?: string | null;
  confidence?: number;
  notes?: string | null;
  [key: string]: any;
}

interface ImportRow {
  _id: string;
  originalName: string;
  status: "processing" | "review" | "failed" | "saved";
  error?: string;
  extracted?: ExtractedFields | null;
  confidence?: number;
  createdAt?: string;
}

const readFileAsDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const viewPdfDataUri = (dataUri: string) => {
  try {
    const [header, base64] = dataUri.split(",");
    const mime = header.match(/data:(.*);base64/)?.[1] || "application/pdf";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(blobUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    console.error("Failed to open PDF", err);
  }
};

const fetchPdfDataUri = async (importId: string): Promise<string | null> => {
  try {
    const res = await fetch(`/api/admin/policy-import/${importId}/pdf`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success || !data.fileData) return null;
    return data.fileData as string;
  } catch (err) {
    console.error("Failed to load PDF", err);
    return null;
  }
};

const StatusPill: React.FC<{ status: ImportRow["status"] }> = ({ status }) => {
  if (status === "processing") {
    return (
      <span className={`${styles.statusPill} ${styles.statusProcessing}`}>
        <FiClock size={12} className={styles.spin} /> Processing
      </span>
    );
  }
  if (status === "review") {
    return (
      <span className={`${styles.statusPill} ${styles.statusReview}`}>
        <FiFileText size={12} /> Ready for review
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className={`${styles.statusPill} ${styles.statusSaved}`}>
        <FiCheckCircle size={12} /> Saved
      </span>
    );
  }
  return (
    <span className={`${styles.statusPill} ${styles.statusFailed}`}>
      <FiXCircle size={12} /> Failed
    </span>
  );
};

const ConfidenceBadge: React.FC<{ value?: number | null }> = ({ value }) => {
  if (value == null) return <>--</>;
  const tone = value >= 80 ? styles.confidenceHigh : value >= 50 ? styles.confidenceMed : styles.confidenceLow;
  return <span className={`${styles.confidenceBadge} ${tone}`}>{Math.round(value)}%</span>;
};

function ProcessingModal({
  rows,
  onDismiss,
}: {
  rows: ImportRow[];
  onDismiss: () => void;
}) {
  const doneCount = rows.filter((r) => r.status !== "processing").length;
  const allDone = rows.length > 0 && doneCount === rows.length;

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.processingModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.processingIconWrap}>
          <FiUploadCloud size={26} className={styles.processingIcon} />
          <span className={styles.processingPulse} />
        </div>

        <h2 className={styles.processingTitle}>
          {allDone ? "Extraction complete" : "Reading your policy documents..."}
        </h2>
        <p className={styles.processingSubtitle}>
          {allDone
            ? "All done — review and edit the fields inline in the table below."
            : "AI is extracting the key fields from each PDF. This usually takes a few seconds per file."}
        </p>

        <div className={styles.processingProgressTrack}>
          <div
            className={styles.processingProgressFill}
            style={{ width: `${rows.length ? (doneCount / rows.length) * 100 : 0}%` }}
          />
        </div>
        <div className={styles.processingCount}>
          {doneCount} of {rows.length} processed
        </div>

        <div className={styles.processingList}>
          {rows.map((row) => (
            <div key={row._id} className={styles.processingItem}>
              {row.status === "processing" ? (
                <FiClock size={14} className={`${styles.processingItemIcon} ${styles.spin}`} />
              ) : row.status === "failed" ? (
                <FiXCircle size={14} className={`${styles.processingItemIcon} ${styles.processingItemIconFailed}`} />
              ) : (
                <FiCheckCircle size={14} className={`${styles.processingItemIcon} ${styles.processingItemIconDone}`} />
              )}
              <span className={styles.processingItemName}>{row.originalName}</span>
              <span className={styles.processingItemStatus}>
                {row.status === "processing" ? "Analyzing..." : row.status === "failed" ? "Failed" : "Extracted"}
              </span>
            </div>
          ))}
        </div>

        <button type="button" className={styles.processingDismissBtn} onClick={onDismiss}>
          Continue in background
        </button>
      </div>
    </div>
  );
}

export default function PolicyDocumentImport({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [processingBatch, setProcessingBatch] = useState<string[] | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [batchSummary, setBatchSummary] = useState<string | null>(null);
  // Spreadsheet-style inline edits, keyed by import id — lets several rows
  // be corrected directly in the table before "Save All" submits them together.
  const [edits, setEdits] = useState<Record<string, Partial<ExtractedFields>>>({});
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldFor = (row: ImportRow, key: keyof ExtractedFields) =>
    edits[row._id]?.[key] !== undefined ? edits[row._id][key] : row.extracted?.[key];

  const setField = (rowId: string, key: keyof ExtractedFields, value: any) =>
    setEdits((prev) => ({ ...prev, [rowId]: { ...prev[rowId], [key]: value } }));

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/policy-import", { credentials: "include" });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load policy imports", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Poll while anything is still processing.
  useEffect(() => {
    const hasProcessing = items.some((i) => i.status === "processing");
    if (!hasProcessing) return;
    const t = setInterval(fetchItems, 2500);
    return () => clearInterval(t);
  }, [items, fetchItems]);

  const processingBatchRows = processingBatch
    ? processingBatch.map((id) => items.find((i) => i._id === id)).filter(Boolean) as ImportRow[]
    : [];

  // Once every file in the batch has finished (review or failed), auto-close
  // the processing modal after a brief moment so the final checkmarks are
  // visible, leaving the rows editable inline in the table.
  useEffect(() => {
    if (!processingBatch) return;
    if (processingBatchRows.length === 0) return;
    const stillGoing = processingBatchRows.some((r) => r.status === "processing");
    if (stillGoing) return;
    const t = setTimeout(() => setProcessingBatch(null), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingBatchRows.map((r) => r.status).join(","), processingBatch]);

  const addFiles = (files: FileList | File[]) => {
    const pdfs = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    setPendingFiles((prev) => [...prev, ...pdfs].slice(0, 25));
  };

  // Uploaded one file per request — a 25-file batch at up to 15MB each would
  // be ~500MB of base64 in a single JSON body, so each PDF goes up on its
  // own small request instead, and every returned id is folded into one
  // processing batch the popup tracks together.
  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    const allIds: string[] = [];
    const failedNames: string[] = [];
    try {
      for (const f of pendingFiles) {
        try {
          const fileData = await readFileAsDataUri(f);
          const res = await fetch("/api/admin/policy-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ files: [{ fileName: f.name, fileData }] }),
          });
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.ids)) {
            allIds.push(...data.ids);
          } else {
            failedNames.push(f.name);
          }
        } catch (err) {
          console.error(`Upload failed for ${f.name}`, err);
          failedNames.push(f.name);
        }
      }
      setPendingFiles([]);
      if (allIds.length > 0) setProcessingBatch(allIds);
      if (failedNames.length > 0) {
        alert(`Failed to upload: ${failedNames.join(", ")}`);
      }
      await fetchItems();
    } finally {
      setUploading(false);
    }
  };

  const handleViewPdf = async (importId: string) => {
    const data = await fetchPdfDataUri(importId);
    if (data) viewPdfDataUri(data);
    else alert("Failed to load PDF");
  };

  const handleRetry = async (row: ImportRow) => {
    try {
      await fetch(`/api/admin/policy-import/${row._id}/retry`, { method: "POST", credentials: "include" });
      seenIdsRef.current.delete(row._id);
      await fetchItems();
    } catch (err) {
      console.error("Retry failed", err);
    }
  };

  const handleDelete = async (row: ImportRow) => {
    const note =
      row.status === "saved"
        ? " The policy it already saved to the Customer Dashboard will NOT be deleted — only this upload entry."
        : "";
    if (!window.confirm(`Remove "${row.originalName}" from this list?${note}`)) return;
    try {
      const res = await fetch(`/api/admin/policy-import/${row._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to delete");
        return;
      }
      seenIdsRef.current.delete(row._id);
      setSelectedIds((prev) => {
        if (!prev.has(row._id)) return prev;
        const next = new Set(prev);
        next.delete(row._id);
        return next;
      });
      setItems((prev) => prev.filter((i) => i._id !== row._id));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const includesSaved = items.some((i) => ids.includes(i._id) && i.status === "saved");
    const note = includesSaved
      ? " Any already-saved policies will NOT be deleted — only their upload entries."
      : "";
    if (!window.confirm(`Remove ${ids.length} selected item(s) from this list?${note}`)) return;
    setDeletingSelected(true);
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/api/admin/policy-import/${id}`, {
              method: "DELETE",
              credentials: "include",
            });
            const data = await res.json();
            return res.ok && data.success ? id : null;
          } catch (err) {
            console.error("Delete failed", err);
            return null;
          }
        })
      );
      const removedIds = new Set(results.filter(Boolean) as string[]);
      removedIds.forEach((id) => seenIdsRef.current.delete(id));
      setItems((prev) => prev.filter((i) => !removedIds.has(i._id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        removedIds.forEach((id) => next.delete(id));
        return next;
      });
      if (removedIds.size < ids.length) {
        alert(`${removedIds.size} of ${ids.length} item(s) removed. Some failed to delete.`);
      }
    } finally {
      setDeletingSelected(false);
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i._id))
    );
  };

  // Saves every "review" row in one shot, using whatever's currently in its
  // table cells (AI-extracted, or corrected inline) — the spreadsheet-style
  // bulk-edit path.
  const handleSaveAll = async () => {
    const reviewRows = items.filter((i) => i.status === "review");
    if (reviewRows.length === 0) return;
    setSavingAll(true);
    setBatchSummary(null);
    try {
      const res = await fetch("/api/admin/policy-import/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rows: reviewRows.map((r) => ({ id: r._id, data: edits[r._id] || {} })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Bulk save failed");
        return;
      }
      setBatchSummary(
        `${data.saved} saved${data.skippedDuplicates ? `, ${data.skippedDuplicates} duplicate(s) skipped` : ""}.`
      );
      reviewRows.forEach((r) => seenIdsRef.current.add(r._id));
      await fetchItems();
    } catch (err) {
      console.error("Bulk save failed", err);
      alert("Bulk save failed");
    } finally {
      setSavingAll(false);
    }
  };

  // Saves a single row inline — same edited-fields payload as "Save All",
  // scoped to one row for when only one needs saving right now.
  const handleSaveRow = async (row: ImportRow) => {
    setSavingRowId(row._id);
    try {
      const res = await fetch(`/api/admin/policy-import/${row._id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data: edits[row._id] || {} }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const dup = data.duplicate;
        alert(
          dup
            ? `Duplicate policy: ${dup.reasonLabel || dup.reason} (existing policy ${dup.policyNumber || dup.id})`
            : data.message || "Failed to save"
        );
        return;
      }
      seenIdsRef.current.add(row._id);
      await fetchItems();
    } catch (err) {
      console.error("Save row failed", err);
      alert("Failed to save");
    } finally {
      setSavingRowId(null);
    }
  };

  const reviewCount = items.filter((i) => i.status === "review").length;

  return (
    <div className={styles.panel}>
      <button type="button" className={styles.backLink} onClick={onBack}>
        <FiArrowLeft /> Back to Customer Dashboard
      </button>

      <div className={styles.panelTitleRow}>
        <div>
          <h3 className={styles.panelTitle}>Import from Policy Document</h3>
          <p className={styles.panelHint}>
            Upload policy PDFs — AI reads each one automatically. Correct anything right in the table
            below, then save it to the Customer Dashboard.
          </p>
        </div>
      </div>

      <div
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <FiUploadCloud size={26} className={styles.dropzoneIcon} />
        <span className={styles.dropzoneTitle}>Drag and drop policy PDFs here, or click to choose</span>
        <span className={styles.dropzoneHint}>PDF only &middot; up to 25 files &middot; 15MB each</span>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          accept="application/pdf,.pdf"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {pendingFiles.length > 0 && (
        <div className={styles.pendingList}>
          {pendingFiles.map((f, i) => (
            <div key={i} className={styles.pendingItem}>
              <FiFileText size={13} />
              <span className={styles.pendingName}>{f.name}</span>
              <button
                type="button"
                className={styles.pendingRemove}
                onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Remove"
              >
                <FiTrash2 size={12} />
              </button>
            </div>
          ))}
          <button type="button" className={styles.uploadBtn} onClick={handleUpload} disabled={uploading}>
            <FiUploadCloud size={14} /> {uploading ? "Uploading..." : `Upload & Extract (${pendingFiles.length})`}
          </button>
        </div>
      )}

      <div className={styles.queueHeaderRow}>
        <h4 className={styles.queueTitle}>Uploaded Documents</h4>
        <div className={styles.queueHeaderActions}>
          {selectedIds.size > 0 && (
            <button
              type="button"
              className={styles.deleteSelectedBtn}
              onClick={handleDeleteSelected}
              disabled={deletingSelected}
            >
              <FiTrash2 size={14} />{" "}
              {deletingSelected ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
            </button>
          )}
          {reviewCount > 0 && (
            <button type="button" className={styles.saveAllBtn} onClick={handleSaveAll} disabled={savingAll}>
              <FiCheckCircle size={14} /> {savingAll ? "Saving..." : `Save All Unique (${reviewCount})`}
            </button>
          )}
        </div>
      </div>

      {batchSummary && <div className={styles.batchSummary}>{batchSummary}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.size === items.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th>File</th>
              <th>Status</th>
              <th>Policy No.</th>
              <th>Insured Name</th>
              <th>Insurer</th>
              <th>Policy Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Gross Premium</th>
              <th>Confidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className={styles.emptyState}>
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={12} className={styles.emptyState}>
                  <FiInbox size={28} />
                  <span>No imports yet — upload a policy PDF above to get started.</span>
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <React.Fragment key={row._id}>
                  <tr>
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row._id)}
                        onChange={() => toggleSelectRow(row._id)}
                        aria-label={`Select ${row.originalName}`}
                      />
                    </td>
                    <td className={styles.fileCell}>{row.originalName}</td>
                    <td>
                      <StatusPill status={row.status} />
                    </td>
                    {row.status === "processing" ? (
                      <>
                        <td>
                          <span className={styles.skeleton} />
                        </td>
                        <td>
                          <span className={styles.skeleton} />
                        </td>
                        <td>
                          <span className={styles.skeleton} />
                        </td>
                        <td>
                          <span className={styles.skeleton} />
                        </td>
                        <td>
                          <span className={styles.skeleton} />
                        </td>
                        <td>
                          <span className={styles.skeleton} />
                        </td>
                        <td>
                          <span className={styles.skeleton} />
                        </td>
                      </>
                    ) : row.status === "review" ? (
                      <>
                        <td>
                          <input
                            className={styles.cellInput}
                            value={(fieldFor(row, "policy_number") as string) || ""}
                            onChange={(e) => setField(row._id, "policy_number", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.cellInput}
                            value={(fieldFor(row, "insured_name") as string) || ""}
                            onChange={(e) => setField(row._id, "insured_name", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.cellInput}
                            value={(fieldFor(row, "insurer") as string) || ""}
                            onChange={(e) => setField(row._id, "insurer", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.cellInput}
                            value={(fieldFor(row, "policy_type") as string) || ""}
                            onChange={(e) => setField(row._id, "policy_type", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className={styles.cellInput}
                            value={(fieldFor(row, "start_date") as string) || ""}
                            onChange={(e) => setField(row._id, "start_date", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className={styles.cellInput}
                            value={(fieldFor(row, "end_date") as string) || ""}
                            onChange={(e) => setField(row._id, "end_date", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className={styles.cellInput}
                            value={(fieldFor(row, "gross_premium") as number) ?? ""}
                            onChange={(e) =>
                              setField(row._id, "gross_premium", e.target.value === "" ? null : Number(e.target.value))
                            }
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{row.extracted?.policy_number || "--"}</td>
                        <td>{row.extracted?.insured_name || "--"}</td>
                        <td>{row.extracted?.insurer || "--"}</td>
                        <td>{row.extracted?.policy_type || "--"}</td>
                        <td>{row.extracted?.start_date || "--"}</td>
                        <td>{row.extracted?.end_date || "--"}</td>
                        <td>{row.extracted?.gross_premium ?? "--"}</td>
                      </>
                    )}
                    <td>
                      <ConfidenceBadge value={row.confidence} />
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleViewPdf(row._id)}
                          title="View original PDF"
                        >
                          <FiEye size={14} />
                        </button>
                        {row.status === "review" && (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleSaveRow(row)}
                            disabled={savingRowId === row._id}
                            title="Save this row"
                          >
                            <FiSave size={14} />
                          </button>
                        )}
                        {row.status === "failed" && (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleRetry(row)}
                            title="Retry extraction"
                          >
                            <FiRefreshCw size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDelete(row)}
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {row.status === "failed" && row.error && (
                    <tr>
                      <td colSpan={6} className={styles.errorRow}>
                        <FiAlertTriangle size={12} /> {row.error}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {processingBatch && (
        <ProcessingModal rows={processingBatchRows} onDismiss={() => setProcessingBatch(null)} />
      )}
    </div>
  );
}
