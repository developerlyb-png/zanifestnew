import React, { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";
import { useRouter } from "next/router";

const CarPolicySuccess = () => {
  const [policy, setPolicy] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [quote, setQuote] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const p = localStorage.getItem("carPolicyResult");
      if (p && p !== "undefined") setPolicy(JSON.parse(p));

      const pay = localStorage.getItem("carPaymentResult");
      if (pay && pay !== "undefined") setPayment(JSON.parse(pay));

      const q = localStorage.getItem("carFullQuote");
      if (q && q !== "undefined") setQuote(JSON.parse(q));
    } catch (e) {
      console.log("SUCCESS PAGE LOAD ERROR", e);
    }
  }, []);

  const inr = (n: any) =>
    n == null ? "--" : "₹" + Math.round(Number(n)).toLocaleString("en-IN");

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
        <div
          style={{
            background: "#28a745",
            color: "#fff",
            borderRadius: 8,
            padding: "12px 16px",
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          ✓ Policy Issued Successfully
        </div>

        <h2 style={{ margin: "0 0 8px" }}>Your Car Insurance Policy</h2>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Zuno General Insurance
        </p>

        <div
          style={{
            background: "#f7f8fa",
            borderRadius: 8,
            padding: 16,
            textAlign: "left",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
            }}
          >
            <span style={{ color: "#666" }}>Policy Number</span>
            <strong>{policy?.policyNo || "--"}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
            }}
          >
            <span style={{ color: "#666" }}>Quote No</span>
            <span>{policy?.quoteNo || "--"}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
            }}
          >
            <span style={{ color: "#666" }}>Insured Name</span>
            <span>
              {quote?.customer
                ? `${quote.customer.firstName} ${quote.customer.lastName}`
                : "--"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
            }}
          >
            <span style={{ color: "#666" }}>Premium Paid</span>
            <span>{inr(policy?.amount)}</span>
          </div>
        </div>

        {payment?.payLink && (
          <a
            href={payment.payLink}
            style={{
              display: "inline-block",
              background: "#f0ad4e",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Complete Payment →
          </a>
        )}

        <p style={{ color: "#666", fontSize: 14 }}>
          A copy of your policy document will be shared on your registered
          email shortly.
        </p>

        <button
          onClick={() => router.push("/")}
          style={{
            marginTop: 8,
            background: "transparent",
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: "8px 20px",
            cursor: "pointer",
          }}
        >
          Back to Home
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default CarPolicySuccess;