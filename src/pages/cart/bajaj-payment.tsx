import React, { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";
import { useRouter } from "next/router";

// Landing page after Bajaj's payment page (via /api/bajaj/4w/payment-return).
// Bajaj's kit says it redirects back "with policy no in the query string"
// without naming the parameter, so we look for a value in Bajaj's policy
// number format (e.g. OG-27-1201-1801-00005504) under any key.
const POLICY_NO = /^OG-\d{2}-\d{4}-\d{4}-\d{8}$/i;

const BajajPayment = () => {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "failed">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    const fields = Object.fromEntries(
      Object.entries(router.query).map(([k, v]) => [k, String(Array.isArray(v) ? v[0] : v)])
    );
    console.log("BAJAJ PAYMENT RETURN FIELDS >>>", fields);

    const policyNo = Object.values(fields).find((v) => POLICY_NO.test(v.trim()))?.trim();
    if (!policyNo) {
      setState("failed");
      const hint = Object.entries(fields)
        .filter(([k]) => /msg|message|status|reason|error/i.test(k))
        .map(([, v]) => v)
        .join(" ");
      setMessage(hint || "Bajaj did not confirm a policy for this payment.");
      return;
    }
    finishPurchase(policyNo, fields);
  }, [router.isReady]);

  const finishPurchase = async (policyNo: string, fields: Record<string, string>) => {
    const checkout = JSON.parse(localStorage.getItem("bajajCheckout") || "null") || {};

    // Bajaj's PDF service is the only way to check a policy exists; it may
    // not be enabled for our user ID yet, so a failed check is logged, not fatal.
    let pdfAvailable = false;
    try {
      const r = await fetch(`/api/bajaj/4w/policy-pdf?policyNo=${encodeURIComponent(policyNo)}&format=json`);
      const d = await r.json();
      pdfAvailable = !!d.success;
      if (!d.success) console.log("BAJAJ PDF CHECK >>>", d.message);
    } catch (e) {
      console.log("BAJAJ PDF CHECK ERROR", e);
    }

    localStorage.setItem(
      "carPolicyResult",
      JSON.stringify({
        policyNo,
        quoteNo: fields.txn || checkout.transactionId,
        amount: checkout.amount,
        insurer: "BAJAJ",
        customerName: checkout.customer?.fullName || "",
        policyUrl: pdfAvailable ? `/api/bajaj/4w/policy-pdf?policyNo=${encodeURIComponent(policyNo)}` : undefined,
        raw: fields,
      })
    );
    // Zuno's pending payment link from an earlier purchase must not show here
    localStorage.removeItem("carPaymentResult");

    // Save to the customer's dashboard once per policy, even if this page reloads
    const savedKey = `bajajSaved:${policyNo}`;
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
          insurer: "Bajaj Allianz General Insurance Company Limited",
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
              Please don&apos;t close this page. We&apos;re checking with Bajaj Allianz General Insurance.
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
              Payment not completed
            </div>
            <p style={{ color: "#444", marginBottom: 8 }}>{message}</p>
            {router.query.txn && (
              <p style={{ color: "#666", fontSize: 14 }}>
                Reference: <strong>{String(router.query.txn)}</strong>
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

export default BajajPayment;
