import React, { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";
import { useRouter } from "next/router";

// Landing page after Digit's own payment page, via the successReturnUrl /
// cancelReturnUrl we gave at /api/digit/4w/payment. We don't trust the query
// string alone (Digit's payment UI is ours to redirect, not theirs to sign)
// — confirm the real outcome with Policy Status before showing success.
const DigitPayment = () => {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "failed">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    const policyNumber = String(router.query.policyNumber || "");
    const cancelled = router.query.cancelled === "1";
    console.log("DIGIT PAYMENT RETURN >>>", router.query);

    if (!policyNumber) {
      setState("failed");
      setMessage("Digit did not return a policy number for this payment.");
      return;
    }
    if (cancelled) {
      setState("failed");
      setMessage("Payment was cancelled.");
      return;
    }
    confirmAndFinish(policyNumber);
  }, [router.isReady]);

  const confirmAndFinish = async (policyNumber: string) => {
    try {
      const res = await fetch(`/api/digit/4w/policy-status?policyNumber=${encodeURIComponent(policyNumber)}`);
      const data = await res.json();
      console.log("DIGIT PAYMENT CONFIRM STATUS >>>", data);

      if (!res.ok || !data.success || data.policyStatus !== "EFFECTIVE") {
        setState("failed");
        setMessage(
          data.success
            ? `Payment isn't confirmed yet (status: ${data.policyStatus || "unknown"}). If you completed payment, please wait a moment and refresh.`
            : data.message || "Could not confirm this payment with Digit."
        );
        return;
      }

      finishPurchase(policyNumber);
    } catch (e: any) {
      setState("failed");
      setMessage("Something went wrong: " + e?.message);
    }
  };

  const finishPurchase = (policyNo: string) => {
    const checkout = JSON.parse(localStorage.getItem("digitCheckout") || "null") || {};

    localStorage.setItem(
      "carPolicyResult",
      JSON.stringify({
        policyNo,
        quoteNo: checkout.applicationId,
        amount: checkout.amount,
        insurer: "DIGIT",
        customerName: checkout.customer?.fullName || "",
        policyUrl: `/api/digit/4w/policy-pdf?policyId=${encodeURIComponent(checkout.applicationId || "")}`,
      })
    );
    // An earlier purchase's pending link must not show here
    localStorage.removeItem("carPaymentResult");

    const savedKey = `digitSaved:${policyNo}`;
    if (!localStorage.getItem(savedKey)) {
      localStorage.setItem(savedKey, "1");
      fetch("/api/users/save-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyNumber: policyNo,
          premium: checkout.netPremium ?? checkout.amount,
          grossPremium: checkout.amount,
          transactionType: "Rollover",
          insurer: "Go Digit General Insurance Limited",
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
              Please don&apos;t close this page. We&apos;re checking with Go Digit General Insurance.
            </p>
          </>
        ) : (
          <>
            <div
              style={{
                background: "#e74c3c",
                color: "#fff",
                borderRadius: 8,
                padding: "12px 16px",
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              Payment not confirmed
            </div>
            <p style={{ color: "#444", marginBottom: 8 }}>{message}</p>
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

export default DigitPayment;
