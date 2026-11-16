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
  // "pending": paid, but Bajaj hasn't sent a policy number (seen on UAT:
  // p_pay_status=Y with policyref=null) — never shown as a failed payment
  const [state, setState] = useState<"checking" | "failed" | "pending">("checking");
  const [message, setMessage] = useState("");
  const isBike = router.query.vc === "2W";

  useEffect(() => {
    if (!router.isReady) return;
    const fields = Object.fromEntries(
      Object.entries(router.query).map(([k, v]) => [k, String(Array.isArray(v) ? v[0] : v)])
    );
    console.log("BAJAJ PAYMENT RETURN FIELDS >>>", fields);

    const policyNo = Object.values(fields).find((v) => POLICY_NO.test(v.trim()))?.trim();
    if (!policyNo) {
      const paid =
        ["p_pay_status", "vg_payStatus", "payStatus", "v_transsuccess"].some(
          (k) => String(fields[k]).toUpperCase() === "Y"
        ) || /transaction successful/i.test(fields.v_msgcd || "");
      if (paid) {
        setState("pending");
        return;
      }
      setState("failed");
      // Bajaj fills unused fields with the text "null"
      const clean = (v?: string) => (v && v !== "null" ? v : "");
      setMessage(
        clean(fields.errormsg) || clean(fields.v_msgcd) || "Bajaj did not confirm a policy for this payment."
      );
      return;
    }
    finishPurchase(policyNo, fields);
  }, [router.isReady]);

  const finishPurchase = async (policyNo: string, fields: Record<string, string>) => {
    const checkout = JSON.parse(localStorage.getItem("bajajCheckout") || "null") || {};
    // vc=2W comes from /api/bajaj/2w/payment-return
    const isBike = fields.vc === "2W" || checkout.vehicleClass === "2W";

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
        vehicleClass: isBike ? "2W" : "4W",
        customerName: checkout.customer?.fullName || "",
        policyUrl: pdfAvailable ? `/api/bajaj/4w/policy-pdf?policyNo=${encodeURIComponent(policyNo)}` : undefined,
        raw: fields,
      })
    );
    // Zuno's pending payment link from an earlier purchase must not show here
    localStorage.removeItem("carPaymentResult");

    // The policy is recorded server-side by /api/bajaj/<4w|2w>/payment-return
    // (from the checkout saved at issuance), so it no longer depends on this
    // browser being logged in.

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
        ) : state === "pending" ? (
          <>
            <div
              style={{
                background: "#f0ad4e",
                color: "#fff",
                borderRadius: 8,
                padding: "12px 16px",
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              Payment received — policy being issued
            </div>
            <p style={{ color: "#444", marginBottom: 8 }}>
              Your payment to Bajaj Allianz was successful, but Bajaj hasn&apos;t sent the policy number yet.
              Please don&apos;t pay again — our team will share your policy as soon as Bajaj issues it.
            </p>
            {router.query.txn && (
              <p style={{ color: "#666", fontSize: 14 }}>
                Reference: <strong>{String(router.query.txn)}</strong>
                {router.query.v_restranid ? ` · Payment ref: ${String(router.query.v_restranid)}` : ""}
              </p>
            )}
            <button
              onClick={() => router.push("/")}
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
              Back to Home
            </button>
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
              onClick={() => router.push(isBike ? "/cart/bajajbikecart" : "/cart/carinsurancecart")}
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
