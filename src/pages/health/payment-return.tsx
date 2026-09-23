"use client";

import React, { useEffect, useRef, useState } from "react";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";

import styles from "@/styles/pages/health/proposal.module.css";

// ZunoPay redirects back here after the customer pays on their hosted
// checkout page. Their redirect target is a STATIC url registered with
// Zuno at onboarding (the request-link API has no per-request return-url
// field), so this page carries no reliable query params about which
// order it's for — everything needed is read from localStorage, saved
// right before the redirect by /health/proposal.
const PENDING_KEY = "zunoHealthPendingPayment";

// Only "NOT_INITIATED" is documented in Zuno's own sample; the rest are
// best-guess pattern matching until a real completed payment is seen.
const isSuccess = (status: string) => /success|paid|complete/i.test(status || "");
const isFailure = (status: string) => /fail|cancel|expire/i.test(status || "");

const PaymentReturn = () => {
  const [state, setState] = useState<"checking" | "success" | "failed" | "missing">("checking");
  const [statusMessage, setStatusMessage] = useState("Checking your payment...");
  const [policyResult, setPolicyResult] = useState<any>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) {
      setState("missing");
      return;
    }

    let pending: any;
    try {
      pending = JSON.parse(raw);
    } catch {
      setState("missing");
      return;
    }

    let cancelled = false;

    const poll = async () => {
      attemptsRef.current += 1;

      try {
        const res = await fetch("/api/zuno/health/payment-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: pending.orderId }),
        });
        const data = await res.json();
        console.log("ZUNO PAY STATUS POLL", attemptsRef.current, data);

        const paymentStatus = data?.data?.paymentStatus || "";

        if (isSuccess(paymentStatus)) {
          await finishIssuance(pending);
          return;
        }

        if (isFailure(paymentStatus)) {
          if (!cancelled) {
            setState("failed");
            setStatusMessage(`Payment ${paymentStatus.toLowerCase()} — please try again.`);
          }
          return;
        }

        // Still pending (NOT_INITIATED / INITIATED / PENDING …) — keep
        // polling for up to ~2 minutes, matching how long a UPI/card
        // checkout page realistically takes.
        if (attemptsRef.current >= 40) {
          if (!cancelled) {
            setState("failed");
            setStatusMessage(
              "Still haven't seen a completed payment after 2 minutes. If you did pay, contact support with your order id: " +
                pending.orderId,
            );
          }
          return;
        }

        if (!cancelled) setTimeout(poll, 3000);
      } catch (error) {
        console.log("ZUNO PAY STATUS ERROR", error);
        if (attemptsRef.current >= 40) {
          if (!cancelled) {
            setState("failed");
            setStatusMessage("Could not confirm payment status — check console");
          }
          return;
        }
        if (!cancelled) setTimeout(poll, 3000);
      }
    };

    const finishIssuance = async (pending: any) => {
      if (cancelled) return;
      setStatusMessage("Payment confirmed — issuing your policy...");

      try {
        const issueRes = await fetch("/api/zuno/health/policy-issuance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteId: pending.quoteId,
            policyTenure: pending.policyTenure,
            transactionDetails: {
              paymentId: pending.orderId,
              amount: pending.amount,
              mode: "UPI",
              instrumentNumber: pending.transactionId,
            },
            customer: pending.customer,
          }),
        });
        const issueData = await issueRes.json();
        console.log("POLICY ISSUANCE RESULT", issueData);

        if (!issueRes.ok) {
          if (!cancelled) {
            setState("failed");
            setStatusMessage(
              issueData.message ||
                "Payment succeeded but policy issuance failed — contact support with your order id: " +
                  pending.orderId,
            );
          }
          return;
        }

        localStorage.removeItem(PENDING_KEY);
        if (!cancelled) {
          setPolicyResult(issueData);
          setState("success");
        }
      } catch (error: any) {
        if (!cancelled) {
          setState("failed");
          setStatusMessage(error.message || "Something went wrong while issuing the policy");
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, []);

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

        {(state === "checking" || state === "failed") && (
          <div className={styles.successBox}>
            <h2 style={{ color: state === "failed" ? "#dc2626" : "#374151" }}>
              {state === "failed" ? "Payment not confirmed" : "Please wait"}
            </h2>
            <p>{statusMessage}</p>
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
                  <a
                    className={styles.downloadBtn}
                    href={policyResult.policyKitUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ⬇ Download Policy PDF
                  </a>
                )}
                {policyResult?.eProposalUrl && (
                  <a
                    className={styles.secondaryBtn}
                    href={policyResult.eProposalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
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
