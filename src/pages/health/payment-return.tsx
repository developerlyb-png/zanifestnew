"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";

import styles from "@/styles/pages/health/proposal.module.css";

// Zuno Health payment + issuance page.
//
// ZunoPay's request-link API has no per-request return URL — it only returns
// to a STATIC url registered with Zuno, and until that's set up the customer
// just lands on Zuno's own "Payment Successful!" page with no way back. So we
// don't rely on the redirect at all:
//   /health/proposal saves the pending order (incl. the payment link) and
//   comes here → this page opens ZunoPay in a NEW TAB and keeps polling the
//   order's status → once Zuno reports it paid (CHARGED) it issues the policy
//   and shows the download, right here.
// If Zuno ever does redirect back to this page, the same polling handles it.
//
// Everything needed is in localStorage (saved by /health/proposal).
const PENDING_KEY = "zunoHealthPendingPayment";

// ZunoPay is Juspay-based: a paid order is "CHARGED" (status_id 21) — that's
// what the lander shows. The others are kept for safety.
const isSuccess = (status: string) => /charged|success|paid|complete/i.test(status || "");
const isFailure = (status: string) => /fail|cancel|expire|declin|void/i.test(status || "");

const POLL_MS = 4000;
const MAX_WAIT_MS = 20 * 60 * 1000; // a real checkout (UPI app, OTP…) can take a while

type State = "awaiting" | "checking" | "issuing" | "success" | "failed" | "missing";

const PaymentReturn = () => {
  const [state, setState] = useState<State>("checking");
  const [statusMessage, setStatusMessage] = useState("Checking your payment...");
  const [policyResult, setPolicyResult] = useState<any>(null);
  const [pending, setPending] = useState<any>(null);
  const [lastStatus, setLastStatus] = useState("");

  const startedAt = useRef(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const issuing = useRef(false);
  const stopped = useRef(false);

  const statusOf = (data: any) =>
    String(data?.data?.paymentStatus || data?.data?.status || data?.data?.orderStatus || data?.data?.order_status || "");

  const finishIssuance = useCallback(async (p: any) => {
    if (issuing.current) return;
    issuing.current = true;
    stopped.current = true;
    setState("issuing");
    setStatusMessage("Payment confirmed — issuing the policy...");

    try {
      const issueRes = await fetch("/api/zuno/health/policy-issuance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: p.quoteId,
          policyTenure: p.policyTenure,
          transactionDetails: {
            paymentId: p.orderId,
            amount: p.amount,
            mode: "UPI",
            instrumentNumber: p.transactionId,
          },
          customer: p.customer,
        }),
      });
      const issueData = await issueRes.json();
      console.log("POLICY ISSUANCE RESULT", issueData);

      if (!issueRes.ok) {
        issuing.current = false;
        setState("failed");
        setStatusMessage(
          issueData.message ||
            "Payment succeeded but policy issuance failed — use “Retry issuing policy” or contact support with order id " +
              p.orderId,
        );
        return;
      }

      localStorage.removeItem(PENDING_KEY);
      setPolicyResult(issueData);
      setState("success");
    } catch (error: any) {
      issuing.current = false;
      setState("failed");
      setStatusMessage(error.message || "Something went wrong while issuing the policy");
    }
  }, []);

  const checkOnce = useCallback(
    async (p: any): Promise<"paid" | "failed" | "pending"> => {
      try {
        const res = await fetch("/api/zuno/health/payment-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: p.orderId }),
        });
        const data = await res.json();
        const status = statusOf(data);
        console.log("ZUNO PAY STATUS", status, data);
        setLastStatus(status);
        if (isSuccess(status)) return "paid";
        if (isFailure(status)) return "failed";
      } catch (error) {
        console.log("ZUNO PAY STATUS ERROR", error);
      }
      return "pending";
    },
    [],
  );

  const poll = useCallback(
    async (p: any) => {
      if (stopped.current) return;
      const result = await checkOnce(p);
      if (stopped.current) return;

      if (result === "paid") return finishIssuance(p);
      if (result === "failed") {
        stopped.current = true;
        setState("failed");
        setStatusMessage("The payment did not go through — you can try paying again.");
        return;
      }
      if (Date.now() - startedAt.current > MAX_WAIT_MS) {
        stopped.current = true;
        setState("failed");
        setStatusMessage(
          "We haven't seen a completed payment yet. If you have paid, press “Check payment status”. Order id: " + p.orderId,
        );
        return;
      }
      timer.current = setTimeout(() => poll(p), POLL_MS);
    },
    [checkOnce, finishIssuance],
  );

  const restartPolling = (p: any) => {
    if (timer.current) clearTimeout(timer.current);
    stopped.current = false;
    startedAt.current = Date.now();
    setState(p.paymentLink ? "awaiting" : "checking");
    setStatusMessage("Checking your payment...");
    poll(p);
  };

  useEffect(() => {
    stopped.current = false; // dev strict-mode re-runs effects after a cleanup
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) {
      setState("missing");
      return;
    }
    let p: any;
    try {
      p = JSON.parse(raw);
    } catch {
      setState("missing");
      return;
    }
    setPending(p);
    // Came from /health/proposal (payment not opened yet) → show the pay
    // button; otherwise (e.g. Zuno redirected back here) just check status.
    setState(p.paymentLink ? "awaiting" : "checking");
    poll(p);

    return () => {
      stopped.current = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [poll]);

  const openPayment = () => {
    if (!pending?.paymentLink) return;
    window.open(pending.paymentLink, "_blank", "noopener");
    setStatusMessage("Complete the payment in the new tab — this page will issue the policy automatically.");
  };

  const btn: React.CSSProperties = {
    display: "inline-block",
    marginTop: 12,
    marginRight: 10,
    padding: "11px 20px",
    borderRadius: 10,
    border: 0,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  };

  return (
    <div>
      <UserDetails />
      <Navbar />

      <div className={styles.wrapper}>
        {state === "missing" && (
          <div className={styles.successBox}>
            <h2 style={{ color: "#374151" }}>No pending health payment found</h2>
            <p>If you were expecting a policy here, please contact support.</p>
          </div>
        )}

        {state === "awaiting" && pending && (
          <div className={styles.successBox}>
            <h2 style={{ color: "#0f172a" }}>Complete the payment</h2>
            <p>
              Amount: <b>₹{Number(pending.amount || 0).toLocaleString("en-IN")}</b>
              {pending.customer?.fullName ? <> · {pending.customer.fullName}</> : null}
            </p>
            <p>{statusMessage}</p>
            <p style={{ fontSize: 13, color: "#64748b" }}>
              Keep this page open. Once Zuno confirms the payment, the policy is issued here and you can download it.
              {lastStatus ? ` (Current status: ${lastStatus})` : ""}
            </p>
            <button type="button" style={{ ...btn, background: "#1876bd", color: "#fff" }} onClick={openPayment}>
              Pay securely with ZunoPay ↗
            </button>
            <button
              type="button"
              style={{ ...btn, background: "#fff", color: "#1876bd", border: "1px solid #b9d4ea" }}
              onClick={() => restartPolling(pending)}
            >
              I&apos;ve paid — check now
            </button>
          </div>
        )}

        {(state === "checking" || state === "issuing" || state === "failed") && (
          <div className={styles.successBox}>
            <h2 style={{ color: state === "failed" ? "#dc2626" : "#374151" }}>
              {state === "failed" ? "Payment not confirmed" : "Please wait"}
            </h2>
            <p>{statusMessage}</p>
            {state === "failed" && pending && (
              <>
                {pending.paymentLink && (
                  <button type="button" style={{ ...btn, background: "#1876bd", color: "#fff" }} onClick={openPayment}>
                    Open payment page ↗
                  </button>
                )}
                <button
                  type="button"
                  style={{ ...btn, background: "#fff", color: "#1876bd", border: "1px solid #b9d4ea" }}
                  onClick={() => restartPolling(pending)}
                >
                  Check payment status
                </button>
              </>
            )}
          </div>
        )}

        {state === "success" && (
          <div className={styles.policyCard}>
            <div className={styles.policyCardHeader}>
              <div className={styles.policyCheckCircle}>✓</div>
              <h2>Your policy is issued!</h2>
              <p>A confirmation SMS/email has also been sent to you.</p>
            </div>
            <div className={styles.policyCardBody}>
              <div className={styles.policyRow}>
                <span>Policy Number</span>
                <strong>{policyResult?.policyNumber}</strong>
              </div>
              {policyResult?.proposalNumber && (
                <div className={styles.policyRow}>
                  <span>Proposal Number</span>
                  <strong>{policyResult.proposalNumber}</strong>
                </div>
              )}

              <div className={styles.policyActions}>
                {policyResult?.policyKitUrl && (
                  <a className={styles.downloadBtn} href={policyResult.policyKitUrl} target="_blank" rel="noreferrer">
                    ⬇ Download Policy PDF
                  </a>
                )}
                {policyResult?.eProposalUrl && (
                  <a className={styles.secondaryBtn} href={policyResult.eProposalUrl} target="_blank" rel="noreferrer">
                    View E-Proposal
                  </a>
                )}
              </div>

              <a className={styles.homeLink} href="/">
                Back to Home
              </a>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default PaymentReturn;
