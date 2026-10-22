"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FiArrowLeft, FiDownload, FiEye, FiFile, FiFileText } from "react-icons/fi";
import styles from "@/styles/components/superadminsidebar/Reconcile.module.css";

type Category = "matched" | "mismatched" | "missing_in_mis" | "missing_in_cs";

interface ResultRow {
  policyNo: string;
  insuredName?: string;
  category: Category;
  expectedPremium: number | null;
  actualPremium: number | null;
  expectedCommissionAmount: number | null;
  actualCommissionAmount: number | null;
  expectedCommissionPercentage: number | null;
  actualCommissionPercentage: number | null;
  expectedBasicPremium?: number | null;
  actualBasicPremium?: number | null;
  expectedOdPremium?: number | null;
  actualOdPremium?: number | null;
  expectedTpPremium?: number | null;
  actualTpPremium?: number | null;
  actualTerrorismPremium?: number | null;
}

interface Batch {
  _id: string | null;
  batchNo: number | null;
  insurerName: string;
  insurerBranch?: string;
  fileName: string;
  fileData: string;
  reconciledBy?: string;
  createdAt?: string;
  policiesInDb: number;
  recordsInExcel: number;
  matchedCount: number;
  mismatchedCount: number;
  missingInMisCount: number;
  missingInCsCount: number;
  mappedFields?: string[];
  results: ResultRow[];
}

const BREAKDOWN_COLUMNS: {
  field: "basicPremiumAmount" | "odPremiumAmount" | "tpPremiumAmount" | "terrorismPremiumAmount";
  label: string;
  expectedKey: keyof ResultRow;
  actualKey: keyof ResultRow;
  hasExpected: boolean;
}[] = [
  { field: "basicPremiumAmount", label: "Basic Premium", expectedKey: "expectedBasicPremium", actualKey: "actualBasicPremium", hasExpected: false },
  { field: "odPremiumAmount", label: "OD Premium", expectedKey: "expectedOdPremium", actualKey: "actualOdPremium", hasExpected: true },
  { field: "tpPremiumAmount", label: "TP Premium", expectedKey: "expectedTpPremium", actualKey: "actualTpPremium", hasExpected: true },
  { field: "terrorismPremiumAmount", label: "Terrorism Premium", expectedKey: "actualTerrorismPremium", actualKey: "actualTerrorismPremium", hasExpected: false },
];

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      ", " +
      new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase()
    : "—";
const num = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v.toFixed(2)}%`);

const TABS: { key: Category; label: string }[] = [
  { key: "matched", label: "Matched" },
  { key: "mismatched", label: "Mis-Matched" },
  { key: "missing_in_mis", label: "Missing in MIS" },
  { key: "missing_in_cs", label: "Missing in CS" },
];

export default function ReconciliationDetailView({
  batchId,
  previewBatch,
  onBack,
}: {
  batchId?: string;
  previewBatch?: Batch;
  onBack: () => void;
}) {
  const [batch, setBatch] = useState<Batch | null>(previewBatch || null);
  const [loading, setLoading] = useState(!previewBatch);
  const [tab, setTab] = useState<Category>("matched");

  useEffect(() => {
    if (previewBatch || !batchId) return;
    setLoading(true);
    fetch(`/api/admin/reconcile-batches?id=${batchId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setBatch(d.success ? d.batch : null))
      .catch(() => setBatch(null))
      .finally(() => setLoading(false));
  }, [batchId, previewBatch]);

  const rowsForTab = useMemo(() => (batch?.results || []).filter((r) => r.category === tab), [batch, tab]);

  // Only show a breakdown column (Basic/OD/TP/Terrorism Premium) when this
  // batch's insurer mapping actually had that column configured.
  const activeBreakdownColumns = useMemo(
    () => BREAKDOWN_COLUMNS.filter((c) => (batch?.mappedFields || []).includes(c.field)),
    [batch]
  );

  const exportTab = () => {
    if (rowsForTab.length === 0) return;
    const header = [
      "Policy No",
      "Insured Name",
      "Expected Premium",
      "Actual Premium",
      "Expected Commission Amount",
      "Actual Commission Amount",
      "Expected Commission %",
      "Actual Commission %",
      ...activeBreakdownColumns.flatMap((c) => (c.hasExpected ? [`Expected ${c.label}`, `Actual ${c.label}`] : [`Actual ${c.label}`])),
    ];
    const rows = rowsForTab.map((r) => [
      r.policyNo,
      r.insuredName || "",
      r.expectedPremium ?? "",
      r.actualPremium ?? "",
      r.expectedCommissionAmount ?? "",
      r.actualCommissionAmount ?? "",
      r.expectedCommissionPercentage ?? "",
      r.actualCommissionPercentage ?? "",
      ...activeBreakdownColumns.flatMap((c) =>
        c.hasExpected ? [r[c.expectedKey] ?? "", r[c.actualKey] ?? ""] : [r[c.actualKey] ?? ""]
      ),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `reconcile-${batch?.batchNo ?? "preview"}-${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFile = () => {
    if (!batch?.fileData) return;
    const a = document.createElement("a");
    a.href = batch.fileData;
    a.download = batch.fileName;
    a.click();
  };

  const previewFile = () => {
    if (!batch?.fileData) return;
    const w = window.open();
    if (!w) {
      toast.error("Allow pop-ups to preview the file");
      return;
    }
    w.document.write(
      `<title>${batch.fileName}</title><body style="margin:0"><a href="${batch.fileData}" download="${batch.fileName}">Download ${batch.fileName}</a><p>Spreadsheet preview isn't supported inline — use download instead.</p></body>`
    );
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <button type="button" className={styles.backLink} onClick={onBack}>
          <FiArrowLeft /> Back to reconciliation
        </button>
        <p style={{ color: "#94a3b8", fontSize: 13.5 }}>Loading reconciliation report...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className={styles.wrap}>
        <button type="button" className={styles.backLink} onClick={onBack}>
          <FiArrowLeft /> Back to reconciliation
        </button>
        <p>Reconciliation batch not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.backLink} onClick={onBack}>
        <FiArrowLeft /> Back to reconciliation
      </button>

      <div className={styles.pageHead}>
        <span className={styles.pageIcon}>
          <FiFileText />
        </span>
        <div>
          <h1 className={styles.pageTitle}>
            Reconciliation Report {batch.batchNo ? `— Batch #${batch.batchNo}` : "(Preview)"}
          </h1>
          <div className={styles.metaRow}>
            <span>
              Company: <b>{batch.insurerName}</b>
            </span>
            <span className={styles.metaDivider}>|</span>
            <span>
              File: <b>{batch.fileName}</b>
            </span>
            <span className={styles.metaDivider}>|</span>
            <span>
              By: <b>{batch.reconciledBy || "—"}</b>
            </span>
            <span className={styles.metaDivider}>|</span>
            <span>
              Date: <b>{fmtDate(batch.createdAt)}</b>
            </span>
          </div>
          <div className={styles.metaRow}>
            <span>
              Policies in DB: <b>{batch.policiesInDb}</b>
            </span>
            <span className={styles.metaDivider}>|</span>
            <span>
              Records in Excel: <b>{batch.recordsInExcel}</b>
            </span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Commission Statement File</h3>
        <p className={styles.cardHint}>The uploaded file used for this reconciliation</p>
        <div className={styles.fileCard}>
          <div className={styles.fileCardLeft}>
            <span className={styles.fileTile}>
              <FiFile size={16} />
            </span>
            <div>
              <div className={styles.fileCardName}>{batch.fileName}</div>
              <div className={styles.fileCardMeta}>Uploaded {fmtDate(batch.createdAt)}</div>
            </div>
          </div>
          <div className={styles.fileActions}>
            <button type="button" className={styles.fileActionBtn} onClick={previewFile} title="Preview">
              <FiEye size={14} />
            </button>
            <button type="button" className={styles.fileActionBtn} onClick={downloadFile} title="Download">
              <FiDownload size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Summary</h3>
        <div className={styles.statChipRow} style={{ marginTop: 14 }}>
          <div className={`${styles.statChip} ${styles.statChipGreen}`}>
            <div className={styles.statChipValue}>{batch.matchedCount}</div>
            <div className={styles.statChipLabel}>Matched</div>
          </div>
          <div className={`${styles.statChip} ${styles.statChipRed}`}>
            <div className={styles.statChipValue}>{batch.mismatchedCount}</div>
            <div className={styles.statChipLabel}>Mis Matched</div>
          </div>
          <div className={`${styles.statChip} ${styles.statChipAmber}`}>
            <div className={styles.statChipValue}>{batch.missingInMisCount}</div>
            <div className={styles.statChipLabel}>Missing in MIS</div>
          </div>
          <div className={`${styles.statChip} ${styles.statChipOrange}`}>
            <div className={styles.statChipValue}>{batch.missingInCsCount}</div>
            <div className={styles.statChipLabel}>Missing in Commission Statement</div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Reconciliation Results</h3>
        <p className={styles.cardHint}>Review matched, mismatched and missing records from this run</p>

        <div className={styles.tabBar}>
          {TABS.map((t) => {
            const count =
              t.key === "matched"
                ? batch.matchedCount
                : t.key === "mismatched"
                ? batch.mismatchedCount
                : t.key === "missing_in_mis"
                ? batch.missingInMisCount
                : batch.missingInCsCount;
            return (
              <button
                key={t.key}
                type="button"
                className={`${styles.tabBtn} ${tab === t.key ? styles.tabBtnActive : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>

        {rowsForTab.length === 0 ? (
          <div className={styles.emptyResults}>No {TABS.find((t) => t.key === tab)?.label.toLowerCase()} data found.</div>
        ) : (
          <div className={styles.resultsTableWrap}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ verticalAlign: "bottom" }}>
                    Policy No
                  </th>
                  <th colSpan={2}>Total Premium</th>
                  <th colSpan={2}>Total Commission Amount</th>
                  <th colSpan={2}>Total Commission Percentage</th>
                  {activeBreakdownColumns.map((c) => (
                    <th key={c.field} colSpan={c.hasExpected ? 2 : 1}>
                      {c.label}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th>Expected (MIS)</th>
                  <th>Actual (CS)</th>
                  <th>Expected (MIS)</th>
                  <th>Actual (CS)</th>
                  <th>Expected (MIS)</th>
                  <th>Actual (CS)</th>
                  {activeBreakdownColumns.map((c) =>
                    c.hasExpected ? (
                      <React.Fragment key={c.field}>
                        <th>Expected (MIS)</th>
                        <th>Actual (CS)</th>
                      </React.Fragment>
                    ) : (
                      <th key={c.field}>Actual (CS)</th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rowsForTab.map((r, i) => {
                  const premiumDiff = tab === "mismatched" && r.expectedPremium !== r.actualPremium;
                  const amountDiff = tab === "mismatched" && r.expectedCommissionAmount !== r.actualCommissionAmount;
                  const pctDiff = tab === "mismatched" && r.expectedCommissionPercentage !== r.actualCommissionPercentage;
                  return (
                    <tr key={i}>
                      <td>{r.policyNo}</td>
                      <td>{num(r.expectedPremium)}</td>
                      <td className={premiumDiff ? styles.diffCell : ""}>{num(r.actualPremium)}</td>
                      <td>{num(r.expectedCommissionAmount)}</td>
                      <td className={amountDiff ? styles.diffCell : ""}>{num(r.actualCommissionAmount)}</td>
                      <td>{pct(r.expectedCommissionPercentage)}</td>
                      <td className={pctDiff ? styles.diffCell : ""}>{pct(r.actualCommissionPercentage)}</td>
                      {activeBreakdownColumns.map((c) =>
                        c.hasExpected ? (
                          <React.Fragment key={c.field}>
                            <td>{num(r[c.expectedKey] as number | null)}</td>
                            <td>{num(r[c.actualKey] as number | null)}</td>
                          </React.Fragment>
                        ) : (
                          <td key={c.field}>{num(r[c.actualKey] as number | null)}</td>
                        )
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.resultsFooter}>
          <span>
            Showing {rowsForTab.length} {TABS.find((t) => t.key === tab)?.label.toLowerCase()} polic{rowsForTab.length === 1 ? "y" : "ies"}
          </span>
          <button type="button" className={styles.exportBtn} onClick={exportTab} disabled={rowsForTab.length === 0}>
            <FiDownload size={14} /> Export
          </button>
        </div>
      </div>
    </div>
  );
}
