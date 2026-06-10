"use client";
import React, { useEffect, useState } from "react";
import PdfUpload, { Summary } from "@/components/Policy/pdfupload";
import PolicyTable from "@/components/Policy/PolicyTable";

export default function ListOfPolicy() {
  const [tempPolicies, setTempPolicies] = useState<Summary[]>([]);
  const [verifiedPolicies, setVerifiedPolicies] = useState<Summary[]>([]);

  const loadVerified = async () => {
    const res = await fetch("/api/policy/list", {
      credentials: "include",
    });
    const json = await res.json();
    if (json.success) setVerifiedPolicies(json.data);
  };

  useEffect(() => {
    loadVerified();
  }, []);

  return (
    <>
      <PdfUpload
        onBulkUpload={(rows) =>
          setTempPolicies((prev) => [...rows, ...prev])
        }
      />

      {/* 🔵 TEMP TABLE (SHOW HEADER) */}
      <PolicyTable
        policies={tempPolicies}
        mode="temp"
        showHeader={true}
        onVerifySuccess={(row) => {
          setTempPolicies((p) =>
            p.filter((x) => x.policyNo !== row.policyNo)
          );
          setVerifiedPolicies((v) => [row, ...v]);
        }}
      />

      {/* 🟢 VERIFIED TABLE (NO HEADER) */}
      <PolicyTable
        policies={verifiedPolicies}
        mode="verified"
  showHeader={verifiedPolicies.length > 0}
      />
    </>
  );
}
