import React, { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";
import { useRouter } from "next/router";

// Digit's own process flow: Create Quote -> KYC (hosted page) -> check KYC
// status -> Payment (also Digit's own hosted page). This page drives the
// middle two steps: get the KYC link, let the customer finish it on Digit's
// site, then confirm status before moving to payment.
const DigitKyc = () => {
  const router = useRouter();
  const [checkout, setCheckout] = useState<any>(null);
  const [kycLink, setKycLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("digitCheckout");
    if (!raw || raw === "undefined") {
      setError("No proposal found — please start again from the quote page.");
      setLoading(false);
      return;
    }
    const parsed = JSON.parse(raw);
    setCheckout(parsed);
    fetchKycLink(parsed);
  }, []);

  const fetchKycLink = async (c: any) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/digit/4w/kyc-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyNumber: c.policyNumber, dob: c.dob, gender: c.gender }),
      });
      const data = await res.json();
      console.log("DIGIT KYC LINK RESULT >>>", data);
      if (!res.ok || !data.success) {
        setError(data.message || "Could not get a KYC link from Digit.");
        return;
      }
      setKycLink(data.link);
    } catch (e: any) {
      setError("Something went wrong: " + e?.message);
    } finally {
      setLoading(false);
    }
  };

  const continueToPayment = async () => {
    if (!checkout) return;
    setChecking(true);
    setError("");
    try {
      const statusRes = await fetch(
        `/api/digit/4w/policy-status?policyNumber=${encodeURIComponent(checkout.policyNumber)}`
      );
      const status = await statusRes.json();
      console.log("DIGIT POLICY STATUS >>>", status);
      if (!statusRes.ok || !status.success) {
        setError(status.message || "Could not check KYC status.");
        return;
      }
      if (status.kycVerificationStatus !== "DONE") {
        setError(
          `KYC isn't verified yet (status: ${status.kycVerificationStatus || "unknown"}). Please complete it on the page that opened, then try again.`
        );
        return;
      }

      const origin = window.location.origin;
      const payRes = await fetch("/api/digit/4w/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: checkout.applicationId,
          successReturnUrl: `${origin}/cart/digit-payment?policyNumber=${encodeURIComponent(checkout.policyNumber)}`,
          cancelReturnUrl: `${origin}/cart/digit-payment?policyNumber=${encodeURIComponent(checkout.policyNumber)}&cancelled=1`,
        }),
      });
      const payData = await payRes.json();
      console.log("DIGIT PAYMENT LINK RESULT >>>", payData);
      if (!payRes.ok || !payData.success) {
        setError(payData.message || "Could not get a payment link from Digit.");
        return;
      }
      window.location.href = payData.paymentLink;
    } catch (e: any) {
      setError("Something went wrong: " + e?.message);
    } finally {
      setChecking(false);
    }
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
        }}
      >
        <h2 style={{ margin: "0 0 8px" }}>Complete your KYC</h2>
        <p style={{ color: "#666" }}>
          Go Digit requires KYC verification before payment. Complete it on Digit&apos;s page, then come back here.
        </p>

        {loading ? (
          <p>Getting your KYC link...</p>
        ) : kycLink ? (
          <a
            href={kycLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 16,
              background: "#176eaa",
              color: "#fff",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Open KYC page →
          </a>
        ) : null}

        {error && (
          <p style={{ color: "#e74c3c", marginTop: 16, fontWeight: 600 }}>{error}</p>
        )}

        <div style={{ marginTop: 24 }}>
          <button
            onClick={continueToPayment}
            disabled={checking || !checkout}
            style={{
              background: "#0f9d78",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 600,
              cursor: checking ? "default" : "pointer",
            }}
          >
            {checking ? "Checking..." : "I've completed KYC — Continue to payment"}
          </button>
        </div>

        <button
          onClick={() => router.push("/cart/carinsurancecart")}
          style={{
            marginTop: 16,
            background: "transparent",
            color: "#666",
            border: "none",
            textDecoration: "underline",
            cursor: "pointer",
            display: "block",
          }}
        >
          Back to checkout
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default DigitKyc;
