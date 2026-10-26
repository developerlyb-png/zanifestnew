import React, { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";
import { useRouter } from "next/router";

// Landing page after Shriram's payment gateway (via /api/shriram/4w/payment-return).
// Confirms the outcome with getPaymentStatus — a policy is shown only when
// Shriram itself reports it converted — then hands off to car-policy-success.

const MAX_CHECKS = 6; // "payment being processed" can take a little while
const CHECK_EVERY_MS = 5000;

const ShriramPayment = () => {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "failed" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    const proposalNo = String(router.query.proposalNo || "");
    const quoteId = String(router.query.quoteId || "");
    if (!proposalNo || !quoteId) {
      setState("error");
      setMessage("Payment details are missing. Please contact support with your proposal number.");
      return;
    }

    let cancelled = false;
    const check = async (attempt: number) => {
      try {
        const res = await fetch("/api/shriram/4w/payment-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposalNo, quoteId }),
        });
        const data = await res.json();
        if (cancelled) return;
        console.log("SHRIRAM PAYMENT STATUS >>>", data);

        if (data.success && data.status === "PAID") {
          await finishPurchase(proposalNo, data);
          return;
        }
        if ((data.status === "AWAITED" || data.status === "NOT_FOUND") && attempt < MAX_CHECKS) {
          setTimeout(() => check(attempt + 1), CHECK_EVERY_MS);
          return;
        }
        setState(data.status === "POLICY_ERROR" ? "error" : "failed");
        setMessage(
          data.status === "POLICY_ERROR"
            ? "Your payment was received but Shriram could not issue the policy yet. Our team will contact you."
            : data.message || String(router.query.msg || "") || "Payment was not completed."
        );
      } catch (e: any) {
        if (!cancelled) {
          setState("error");
          setMessage(e.message || "Could not check the payment status");
        }
      }
    };
    check(1);
    return () => {
      cancelled = true;
    };
  }, [router.isReady]);

  const finishPurchase = async (proposalNo: string, status: any) => {
    const checkout = JSON.parse(localStorage.getItem("shriramCheckout") || "null") || {};
    localStorage.setItem(
      "carPolicyResult",
      JSON.stringify({
        policyNo: status.policyNo,
        quoteNo: proposalNo,
        amount: status.amount ?? checkout.amount,
        insurer: "SHRIRAM",
        customerName: checkout.customer?.fullName || "",
        policyUrl: status.policyUrl,
        raw: status,
      })
    );
    // Zuno's pending payment link from an earlier purchase must not show here
    localStorage.removeItem("carPaymentResult");

    // Save to the customer's dashboard once per policy, even if this page reloads
    const savedKey = `shriramSaved:${status.policyNo}`;
    if (!localStorage.getItem(savedKey)) {
      localStorage.setItem(savedKey, "1");
      fetch("/api/users/save-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyNumber: status.policyNo,
          premium: checkout.netPremium ?? status.amount,
          grossPremium: status.amount ?? checkout.amount,
          transactionType: "Rollover",
          insurer: "Shriram General Insurance",
          vehicle: checkout.vehicle,
          customer: checkout.customer,
        }),
      }).catch((e) => console.log("SAVE POLICY ERROR", e));
    }

    router.replace("/cart/car-policy-success");
  };

  return (
    <div>
      <UserDetails />
      <Navbar />
      <div
        style={{
          maxWidth: 560,
          margin: "48px auto",
          padding: 24,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        {state === "checking" ? (
          <>
            <h2 style={{ margin: "0 0 8px" }}>Confirming your payment…</h2>
            <p style={{ color: "#666" }}>
              Please don&apos;t close this page. We&apos;re checking with Shriram General Insurance.
            </p>
          </>
        ) : (
          <>
            <div
              style={{
                background: state === "failed" ? "#e74c3c" : "#f0ad4e",
                color: "#fff",
                borderRadius: 8,
                padding: "12px 16px",
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              {state === "failed" ? "Payment not completed" : "We couldn't confirm your policy"}
            </div>
            <p style={{ color: "#444", marginBottom: 8 }}>{message}</p>
            {router.query.proposalNo && (
              <p style={{ color: "#666", fontSize: 14 }}>
                Proposal number: <strong>{String(router.query.proposalNo)}</strong>
              </p>
            )}
            <button
              onClick={() => router.push("/cart/carinsurancecart")}
              style={{
                marginTop: 16,
                background: "#0f9d78",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to checkout
            </button>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ShriramPayment;
