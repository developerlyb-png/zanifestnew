"use client";

import React, { useState, useEffect, useRef } from "react";
import { LuUser } from "react-icons/lu";
import { RiBarChartBoxLine } from "react-icons/ri";
import { FiInfo } from "react-icons/fi";
import styles from "@/styles/components/dashboard/DashboardKyc.module.css";
import { useAuth } from "@/context/AuthContext";

interface OtpStartResponse {
  status?: string;
  message?: string;
  ref_id?: string;
  [key: string]: any;
}

interface OtpVerifyResponse {
  status?: string;
  message?: string;
  name?: string;
  dob?: string;
  [key: string]: any;
}

interface PanResponse {
  pan?: string;
  name?: string;
  status?: string;
  message?: string;
  [key: string]: any;
}

const DashboardKyc: React.FC = () => {
  /** ------------------ Aadhaar States -------------------- **/
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [refId, setRefId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [aadhaarLoading, setAadhaarLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /** ------------------ PAN States -------------------- **/
  const [pan, setPan] = useState("");
  const [panResult, setPanResult] = useState<PanResponse | null>(null);
  const [panLoading, setPanLoading] = useState(false);

  const { user } = useAuth();

  /** ✅ Aadhaar Input Format 1234 5678 9101 */
  const handleAadhaarChange = (value: string) => {
    const raw = value.replace(/\D/g, "").slice(0, 12);
    const formatted = raw.replace(/(.{4})/g, "$1 ").trim();
    setAadhaar(formatted);
  };

  /** ✅ Aadhaar OTP Countdown */
  useEffect(() => {
    if (resendIn <= 0) return;
    timerRef.current = setInterval(() => {
      setResendIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [resendIn]);

  /** ✅ SEND OTP */
  const handleProceed = async () => {
    const cleanAadhaar = aadhaar.replace(/\s/g, "");

    if (cleanAadhaar.length !== 12) {
      alert("❌ Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    setAadhaarLoading(true);

    try {
      const res = await fetch("/api/aadhaar/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar_number: cleanAadhaar }),
      });

      const data: OtpStartResponse = await res.json();
      console.log("OTP Start Response:", data);

      if (data?.ref_id) {
        setRefId(data.ref_id);
        setShowModal(true);
        setResendIn(45);
      } else {
        alert(data?.message || "Failed to send OTP.");
      }
    } catch {
      alert("❌ Network error");
    }

    setAadhaarLoading(false);
  };

  /** ✅ VERIFY OTP */
  const handleOtpVerify = async () => {
    if (!refId) return alert("Session expired. Try again.");

    setAadhaarLoading(true);

    try {
      const res = await fetch("/api/aadhaar/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref_id: refId, otp }),
      });

      const data: OtpVerifyResponse = await res.json();
      console.log("OTP Verify Response:", data);

      if (data?.status === "VALID") {
        alert("✅ Aadhaar verified!");
        setShowModal(false);

        /** ✅ STORE AADHAAR IN BACKEND */
        const saveRes = await fetch("/api/kyc/aadhaar-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",   // ✅ IMPORTANT – sends httpOnly cookie
          body: JSON.stringify({
            aadhaar_number: aadhaar.replace(/\s/g, ""),
            name: data.name,
            dob: data.dob,
          }),
        });

        const saveData = await saveRes.json();
        console.log("SAVE RES:", saveData);

        if (!saveRes.ok) {
          alert(saveData?.message || "❌ Failed to save Aadhaar");
        } else {
          alert("✅ Aadhaar saved to your account!");
        }
      } else {
        alert(data?.message || "❌ Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Network error");
    }

    setAadhaarLoading(false);
  };

  const handleResendOtp = () => handleProceed();

  /** ✅ PAN Verification */
  const handleVerifyPan = async () => {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      return alert("❌ Enter valid PAN. Eg: ABCDE1234F");
    }

    setPanLoading(true);
    setPanResult(null);

    try {
      const res = await fetch("/api/pan/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pan }),
      });

      const data: PanResponse = await res.json();
      console.log("PAN Verify Response:", data);

      setPanResult(data);
    } catch {
      alert("❌ Network error");
    }

    setPanLoading(false);
  };

  return (
    <div className={styles.cont}>
      <div>
        Hi, {user?.name || "User"} <LuUser />
      </div>

      {/* ✅ Aadhaar Verification */}
      <div className={styles.inner}>
        <div>
          <div className={styles.head1}>
            <RiBarChartBoxLine /> Aadhaar Verification
          </div>
          <h2 style={{ fontSize: 32 }}>Enter Aadhaar Number</h2>
          <p>Enter your 12-digit Aadhaar to verify.</p>
        </div>

        <div className={styles.middle}>
          <input
            type="text"
            placeholder="XXXX XXXX XXXX"
            value={aadhaar}
            onChange={(e) => handleAadhaarChange(e.target.value)}
            className={styles.input}
            maxLength={14}
          />

          <div className={styles.info}>
            <FiInfo />
            Your Aadhaar data is securely encrypted
          </div>
        </div>

        <div className={styles.bottom}>
          <button
            className={styles.button}
            onClick={handleProceed}
            disabled={aadhaarLoading}
          >
            {aadhaarLoading ? "Sending…" : "Proceed To Verification"}
          </button>
        </div>
      </div>

      {/* ✅ OTP Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Enter OTP</h3>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              placeholder="Enter OTP"
              className={styles.input}
            />

            <p>
              {resendIn > 0
                ? `Resend in ${resendIn}s`
                : "Didn't receive OTP?"}
            </p>

            {resendIn === 0 && (
              <button onClick={handleResendOtp} className={styles.button}>
                Resend OTP
              </button>
            )}

            <div className={styles.modalButtons}>
              <button
                onClick={handleOtpVerify}
                className={styles.button}
                disabled={aadhaarLoading}
              >
                {aadhaarLoading ? "Verifying…" : "Verify OTP"}
              </button>

              <button
                onClick={() => setShowModal(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ PAN CARD VERIFICATION */}
      <div className={styles.inner} style={{ marginTop: 40 }}>
        <div>
          <div className={styles.head1}>
            <RiBarChartBoxLine /> PAN Card Verification
          </div>
          <h2 style={{ fontSize: 32 }}>Enter PAN Number</h2>
          <p>Verify your PAN instantly.</p>
        </div>

        <div className={styles.middle}>
          <input
            type="text"
            placeholder="ABCDE1234F"
            className={styles.input}
            value={pan.toUpperCase()}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
            maxLength={10}
          />

          <div className={styles.info}>
            <FiInfo /> Your PAN details are only used for validation
          </div>
        </div>

        <div className={styles.bottom}>
          <button
            className={styles.button}
            onClick={handleVerifyPan}
            disabled={panLoading}
          >
            {panLoading ? "Verifying..." : "Verify PAN"}
          </button>
        </div>

        {panResult && (
          <div style={{ marginTop: 20 }}>
            <h3>Verification Result</h3>
            <pre style={{ background: "#eee", padding: 10 }}>
              {JSON.stringify(panResult, null, 2)}
            </pre>

            {panResult.status === "VALID" ? (
              <p style={{ color: "green" }}>
                ✅ PAN Verified — Name: {panResult.name}
              </p>
            ) : (
              <p style={{ color: "red" }}>❌ PAN Invalid</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardKyc;
