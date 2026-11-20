// src/pages/CommercialVehicle/SbiGcv/success.tsx
// SBI General — GCV policy issued: shows the policy and downloads the PDF
// (/api/sbi/gcv/policy-pdf, encrypted getPDF service).
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import sbiLogo from "@/assets/CommercialVehicle/sbi.png";
import { SBI_GCV_POLICY_KEY } from "@/lib/sbiGcv/cvJourney";

const SbiGcvSuccess: React.FC = () => {
  const router = useRouter();
  const [policy, setPolicy] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    try {
      setPolicy(JSON.parse(localStorage.getItem(SBI_GCV_POLICY_KEY) || "null"));
    } catch {
      setPolicy(null);
    }
  }, []);

  const downloadPdf = async () => {
    if (!policy?.policyNo) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/sbi/gcv/policy-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyNumber: policy.policyNo }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "The policy PDF isn't ready yet — please try again in a few minutes.");
        return;
      }
      const bytes = Uint8Array.from(atob(data.docBase64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `SBI_GCV_${policy.policyNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Could not download the policy: " + e?.message);
    } finally {
      setDownloading(false);
    }
  };

  const row = (label: string, value: any) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
      <span style={{ color: "#555" }}>{label}</span>
      <strong>{value ?? "--"}</strong>
    </div>
  );

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
        <div style={{ border: "1px solid #e3e3e3", borderRadius: 10, padding: 24, background: "#fff" }}>
          <Image src={sbiLogo} alt="SBI General Insurance" width={110} height={60} />
          {policy ? (
            <>
              <h2 style={{ margin: "16px 0 4px", color: "#1a7f37" }}>Your policy is issued</h2>
              <p style={{ color: "#555", marginTop: 0 }}>SBI General — Goods Carrying Vehicle Package Policy</p>
              {row("Policy number", policy.policyNo)}
              {row("Policyholder", policy.customerName)}
              {row("Vehicle", `${policy.vehicle?.make || ""} ${policy.vehicle?.model || ""}`.trim())}
              {row("Registration", policy.vehicleNo)}
              {row("Premium paid", `₹ ${Math.round(Number(policy.amount)).toLocaleString("en-IN")}`)}
              {row("Payment reference", policy.paymentId)}
              <button
                onClick={downloadPdf}
                disabled={downloading}
                style={{
                  marginTop: 20,
                  width: "100%",
                  padding: "12px",
                  background: "#0b5cab",
                  color: "#fff",
                  border: 0,
                  borderRadius: 6,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                {downloading ? "Downloading..." : "Download policy PDF"}
              </button>
            </>
          ) : (
            <>
              <h2>No policy found</h2>
              <button onClick={() => router.push("/CommercialVehicle/CommercialVehicle1")}>Start a new quote</button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SbiGcvSuccess;
