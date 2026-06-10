// /components/policy/PrefilledForm.tsx
"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/listofpolicy.module.css";

export type Field = { label?: string; value: string };

const PrefilledForm = ({
  uploadedText,
  onSaved,
}: {
  uploadedText: string;
  onSaved: () => void;
}) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [status, setStatus] = useState("Hot");

  useEffect(() => {
    const lines = uploadedText.split("\n").filter((l) => l.trim() !== "");
    setFields(
      lines.map((line) => ({
        label: line.substring(0, 20),
        value: line,
      }))
    );
  }, [uploadedText]);

  const save = async () => {
    const payload = {
      fields,
      status,
      date: new Date().toLocaleString(),
    };

    const res = await fetch("/api/policy/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.success) {
      alert("Saved!");
      onSaved();
    }
  };

  return (
    <div className={styles.formSection}>
      <h2>Prefilled Editable Form</h2>

      <div className={styles.statusDropdown}>
        <label>Status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>Hot</option>
          <option>Cold</option>
          <option>Converted</option>
          <option>Dead</option>
        </select>
      </div>

      {fields.map((f, i) => (
        <div key={i} className={styles.fieldRow}>
          <label>{f.label}</label>
          <input
            type="text"
            value={f.value}
            onChange={(e) => {
              const updated = [...fields];
              updated[i].value = e.target.value;
              setFields(updated);
            }}
          />
        </div>
      ))}

      <button className={styles.verifyBtn} onClick={save}>
        Verify & Save
      </button>
    </div>
  );
};

export default PrefilledForm;
