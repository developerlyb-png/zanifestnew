"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/listofpolicy.module.css";
import { FiEdit2, FiCheck } from "react-icons/fi";
import { Summary } from "./pdfupload";
import { FiSearch } from "react-icons/fi";
import { FiEye } from "react-icons/fi";



interface Props {
  policies: Summary[];
  mode: "temp" | "verified";
  onVerifySuccess?: (row: Summary) => void;
  showHeader?: boolean;
}

const PolicyTable: React.FC<Props> = ({
  policies,
  mode,
  onVerifySuccess,
  showHeader = true,
}) => {
  const [rows, setRows] = useState<Summary[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState(""); // ✅ NEW

  useEffect(() => {
    setRows(policies);
  }, [policies]);

 const verify = async (row: Summary, index: number) => {
  const res = await fetch("/api/policy/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(row),
  });

  const data = await res.json();

  if (res.status === 409) {
    alert(data.message || "Policy already exists");

    // ✅ REMOVE FROM TEMP LIST
    setRows((prev) => prev.filter((_, i) => i !== index));
    return;
  }

  if (!res.ok) {
    alert(data.message || "Verification failed");
    return;
  }

  alert("Verified successfully");

  setRows((prev) => prev.filter((_, i) => i !== index));
  onVerifySuccess?.(data.policy);
};


  const filteredRows = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.insuredName?.toLowerCase().includes(q) ||
      r.policyNo?.toLowerCase().includes(q) ||
      r.companyName?.toLowerCase().includes(q) ||
      r.amount?.toLowerCase().includes(q) ||
      r.expiryDate?.toLowerCase().includes(q)
    );
  });

  const cell = (i: number, key: keyof Summary) => (
    <>
      {editing === `${i}-${key}` ? (
        <>
          <input
            value={rows[i][key]}
            onChange={(e) => {
              const copy = [...rows];
              copy[i] = { ...copy[i], [key]: e.target.value };
              setRows(copy);
            }}
          />
          <FiCheck onClick={() => setEditing(null)} />
        </>
      ) : (
        <>
          <span>{rows[i][key]}</span>
          {mode === "temp" && (
            <FiEdit2
              style={{ marginLeft: 6, cursor: "pointer" }}
              onClick={() => setEditing(`${i}-${key}`)}
            />
          )}
        </>
      )}
    </>
  );

  if (!rows.length) return null;

  return (
    <>
    <div className={styles.tableWrapper}>
      
      {/* 🔍 SEARCH BAR */}
      <div className={styles.tableHeader}>
         <div className={styles.searchBox}>
    <FiSearch className={styles.searchIcon} />
    <input
      type="text"
      placeholder="Search policy..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className={styles.searchInput}
    />
  </div>
      </div>

      <div className={styles.responsiveTable}>
        <table className={styles.table}>
          {showHeader && (
            <thead>
              <tr>
                <th>Name</th>
                <th>Policy No</th>
                <th>Company</th>
                <th>Amount</th>
                <th>Expiry</th>
                      <th>Assigned At</th> {/* ✅ NEW */}
  <th>View</th>       {/* ✅ NEW */}

                <th>Status</th>
              </tr>
            </thead>
          )}

          <tbody>
            {filteredRows.map((r, i) => (
              <tr key={r.policyNo + i}>
                <td>{cell(i, "insuredName")}</td>
                <td>{cell(i, "policyNo")}</td>
                <td>{cell(i, "companyName")}</td>
                <td>{cell(i, "amount")}</td>
                <td>{cell(i, "expiryDate")}</td>

                <td>
  {r.assignedAt
    ? new Date(r.assignedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--"}
</td>
<td>
  {r.pdfUrl ? (
    <button
      className={styles.viewBtn}
      onClick={() => window.open(r.pdfUrl, "_blank")}
    >
      View
    </button>
  ) : (
    "--"
  )}
</td>



                <td>
                  {mode === "temp" ? (
                    <button
                      className={styles.verifyBtn}
                      onClick={() => verify(r, i)}
                    >
                      Verify
                    </button>
                  ) : (
                    <span className={styles.verifiedText}>✔ Verified</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
};

export default PolicyTable;
