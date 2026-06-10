// /components/policy/VerifiedList.tsx
"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/listofpolicy.module.css";

type Field = { label?: string; value: string };
type Policy = { _id: string; fields: Field[]; status: string; date: string };

const VerifiedList: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/policy/get");
      const data = await res.json();
      if (res.ok && data.success) {
        setPolicies(data.policies);
      } else {
        console.error("Failed get policies", data);
        alert("Failed to load policies");
      }
    } catch (err) {
      console.error("Get policies error", err);
      alert("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return (
    <div className={styles.listSection}>
      <h2>Verified Policies</h2>
      {loading && <p>Loading...</p>}
      {!loading && policies.length === 0 && <p>No policies found</p>}

      {policies.map((p) => (
        <div key={p._id} className={styles.listItem}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p><strong>Status:</strong> {p.status}</p>
              <p><strong>Date:</strong> {p.date}</p>
            </div>
          </div>

          <details style={{ marginTop: 8 }}>
            <summary>View Fields ({p.fields.length})</summary>
            <div style={{ marginTop: 8 }}>
              {p.fields.map((f, idx) => (
                <div key={idx} style={{ marginBottom: 6 }}>
                  <small style={{ color: "#555" }}>{f.label}</small>
                  <div>{f.value}</div>
                </div>
              ))}
            </div>
          </details>
        </div>
      ))}
    </div>
  );
};

export default VerifiedList;
