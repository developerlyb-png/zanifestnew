"use client";
import React, { useState } from "react";

/* =========================
   TYPES
========================= */
export type Summary = {
  insuredName: string;
  policyNo: string;
  companyName: string;
  amount: string;
  expiryDate: string;
  pdfUrl?: string;
  assignedAt?: string;
};

type LockedFile = {
  file: File;
  password: string;
};

export default function PdfUpload({
  onBulkUpload,
}: {
  onBulkUpload: (rows: Summary[]) => void;
}) {
  const [lockedFiles, setLockedFiles] = useState<LockedFile[]>([]);
  const [showModal, setShowModal] = useState(false);

  /* =========================
     FILE UPLOAD HANDLER
  ========================= */
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const rows: Summary[] = [];
    const locked: LockedFile[] = [];

    for (const file of files) {
      const fd = new FormData();
      fd.append("pdf", file);

      const res = await fetch("/api/policy/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      // 🔐 ONLY encrypted PDFs go to modal
      if (data.encrypted === true) {
        locked.push({ file, password: "" });
        continue;
      }

      // 🔓 Unprotected PDFs → directly to list
      const text = String(data.text || "");

      rows.push({
        insuredName: text.match(/MR\.?\s+[A-Z]+\s+[A-Z]+/)?.[0] || "N/A",
        policyNo: text.match(/\d{10,}/)?.[0] || "N/A",
        companyName: text.match(/ASSURANCE CO\. LTD/i)?.[0] || "N/A",
        amount: text.match(/([\d,]{3,})/)?.[0] || "N/A",
        expiryDate:
          text.match(/\d{2}-[A-Z]{3}-\d{4}/)?.[0] || "N/A",
        pdfUrl: URL.createObjectURL(file),
        assignedAt: new Date().toISOString(),
      });
    }

    // ✅ Add unprotected immediately
    if (rows.length) {
      onBulkUpload(rows);
    }

    // 🔐 Show modal ONLY if encrypted PDFs exist
    if (locked.length) {
      setLockedFiles(locked);
      setShowModal(true);
    }
  };

  /* =========================
     ACCEPT LOCKED FILES
  ========================= */
  const acceptLockedFiles = () => {
    const rows: Summary[] = lockedFiles.map((l) => ({
      insuredName: "N/A",
      policyNo: "N/A",
      companyName: "N/A",
      amount: "N/A",
      expiryDate: "N/A",
      pdfUrl: URL.createObjectURL(l.file),
      assignedAt: new Date().toISOString(),
    }));

    onBulkUpload(rows);
    setLockedFiles([]);
    setShowModal(false);
  };

  return (
    <>
      <input
        type="file"
        multiple
        accept="application/pdf"
        onChange={handleFiles}
      />

      {/* 🔐 PASSWORD MODAL */}
      {showModal && (
        <div style={overlay}>
          <div style={modal}>
            <h3>Password Required</h3>
            <p>
              The following PDFs are password protected.
              Enter the password to continue.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              {lockedFiles.map((f, i) => (
                <div key={i} style={{ marginTop: 10 }}>
                  <strong>{f.file.name}</strong>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={f.password}
                    onChange={(e) => {
                      const copy = [...lockedFiles];
                      copy[i].password = e.target.value;
                      setLockedFiles(copy);
                    }}
                    style={{ width: "100%", marginTop: 6 }}
                  />
                </div>
              ))}

              <button
                type="button"
                style={{ marginTop: 16 }}
                onClick={acceptLockedFiles}
              >
                OK
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================
   MODAL STYLES
========================= */
const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modal: React.CSSProperties = {
  background: "#fff",
  padding: 24,
  borderRadius: 12,
  width: 420,
};
