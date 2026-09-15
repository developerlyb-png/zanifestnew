"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/pages/health/health.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";

// Step after Premium in ICICI's Elevate Fresh flow — CKYC. The doc's
// Proposal-Payment request carries a "KYCRefNo" field, and CKYC is
// documented as the preferred path (falling back to ovd-initiate.ts's
// document-upload flow when there's no CKYC record) — this page only
// implements the CKYC lookup; wiring its result into the Proposal-Payment
// call is the step after this one.
type KycMethod = "PAN" | "AADHAAR";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toIciciDate = (value: string) => {
  // <input type="date"> gives yyyy-mm-dd — ICICI wants dd-MMM-yyyy.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [y, m, d] = value.split("-");
  return `${d}-${MONTHS[Number(m) - 1]}-${y}`;
};

const Health7 = () => {
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);

  const [method, setMethod] = useState<KycMethod>("PAN");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [nameAsPerAadhaar, setNameAsPerAadhaar] = useState("");
  const [gender, setGender] = useState("M");
  const [dob, setDob] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kycResult, setKycResult] = useState<any>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.plan) {
      try {
        setPlan(JSON.parse(router.query.plan as string));
      } catch (err) {
        console.log("PLAN PARSE ERROR", err);
      }
    }
  }, [router.isReady, router.query.plan]);

  const transactionId = plan?.transactionId || plan?.raw?.TransactionId;

  const handleVerify = async () => {
    setError("");
    setKycResult(null);

    if (!transactionId) {
      setError("Missing quote details — please go back and get a quote again.");
      return;
    }
    if (!dob) {
      setError("Enter date of birth");
      return;
    }
    if (method === "PAN" && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber.toUpperCase())) {
      setError("Enter a valid PAN number");
      return;
    }
    if (method === "AADHAAR") {
      if (!/^\d{12}$/.test(aadhaarNumber)) {
        setError("Enter a valid 12-digit Aadhaar number");
        return;
      }
      if (!nameAsPerAadhaar.trim()) {
        setError("Enter name as per Aadhaar");
        return;
      }
    }

    const payload = {
      TransactionId: transactionId,
      DateOfBirth: toIciciDate(dob),
      PanNumber: method === "PAN" ? panNumber.toUpperCase() : null,
      CkycNumber: null,
      AadhaarNumber: method === "AADHAAR" ? aadhaarNumber : null,
      NameAsPerAadhaar: method === "AADHAAR" ? nameAsPerAadhaar : null,
      Gender: method === "AADHAAR" ? gender : null,
    };

    setLoading(true);
    try {
      console.log("ICICI CKYC REQUEST", payload);
      const res = await fetch("/api/icici/health/ckyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("ICICI CKYC RESULT", data);

      if (!res.ok || data?.Success === false) {
        setError(
          data?.ErrorMessage ||
            data?.DisplayMessage ||
            data?.message ||
            "No CKYC record found — you'll need to upload documents instead."
        );
        return;
      }

      setKycResult(data);
    } catch (err: any) {
      console.log("ICICI CKYC ERROR", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <UserDetails />
      <Navbar />

      <div className={styles.wrapper}>
        <div className={styles.detailsMainWrapper}>
          <div className={styles.detailsBack} onClick={() => router.back()}>
            {"‹"}
          </div>

          <div className={styles.detailsRight}>
            <h2>Verify your KYC</h2>
            <p className={styles.detailsSubtitle}>
              ICICI Lombard requires KYC verification before your proposal can be generated.
              {plan?.premium ? ` Plan premium: ₹${plan.premium}` : ""}
            </p>

            {!kycResult ? (
              <>
                <div className={styles.optionsGrid}>
                  <label className={styles.option}>
                    <input type="radio" checked={method === "PAN"} onChange={() => setMethod("PAN")} />
                    PAN
                  </label>
                  <label className={styles.option}>
                    <input type="radio" checked={method === "AADHAAR"} onChange={() => setMethod("AADHAAR")} />
                    Aadhaar
                  </label>
                </div>

                <input
                  className={styles.input}
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />

                {method === "PAN" ? (
                  <input
                    className={styles.input}
                    placeholder="PAN Number"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                ) : (
                  <>
                    <input
                      className={styles.input}
                      placeholder="Aadhaar Number"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                      maxLength={12}
                    />
                    <input
                      className={styles.input}
                      placeholder="Name as per Aadhaar"
                      value={nameAsPerAadhaar}
                      onChange={(e) => setNameAsPerAadhaar(e.target.value)}
                    />
                    <div className={styles.optionsGrid}>
                      <label className={styles.option}>
                        <input type="radio" checked={gender === "M"} onChange={() => setGender("M")} /> Male
                      </label>
                      <label className={styles.option}>
                        <input type="radio" checked={gender === "F"} onChange={() => setGender("F")} /> Female
                      </label>
                    </div>
                  </>
                )}

                {error && (
                  <p style={{ color: "#e11d48", fontSize: 13, marginTop: -6, marginBottom: 16 }}>{error}</p>
                )}

                <button className={styles.continueBtn} onClick={handleVerify} disabled={loading}>
                  {loading ? "Verifying..." : "Verify KYC"}
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, color: "#166534" }}>
                    {kycResult.isKycSuccess ? "KYC verified" : "CKYC record found"}
                  </p>
                  <p style={{ margin: "6px 0 0" }}>Name: {kycResult.Name || "-"}</p>
                  <p style={{ margin: "2px 0 0" }}>DOB: {kycResult.DOB || "-"}</p>
                  <p style={{ margin: "2px 0 0" }}>Gender: {kycResult.Gender || "-"}</p>
                </div>

                {/* Proposal-Payment (the step after CKYC) isn't built yet —
                    this hands off the verified KYC + quote transaction once it is. */}
                <button
                  className={styles.continueBtn}
                  onClick={() =>
                    alert(
                      "KYC verified. Proposal submission (the next ICICI API step) isn't built yet — this button will continue there once it is."
                    )
                  }
                >
                  Continue to Proposal ›
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Health7;
