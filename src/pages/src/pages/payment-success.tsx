import React from "react";

export default function PaymentSuccess() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        fontFamily: "Arial",
      }}
    >
      <h1>✅ Payment Successful</h1>

      <p>
        Your SBI Bike Insurance Policy
        has been issued successfully.
      </p>

      <button
        style={{
          padding: "12px 20px",
          background: "green",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Download Policy PDF
      </button>
    </div>
  );
}