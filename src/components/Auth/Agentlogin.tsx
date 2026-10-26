"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "@/styles/components/Auth/Login.module.css";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function Agentlogin() {

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password flow
  const [step, setStep] = useState<"login" | "email" | "otp" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const router = useRouter();

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ================= LOGIN SUBMIT =================
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(false);

    try {

      const res = await fetch("/api/agent/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userName,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(true);
        alert(data.message || "Login failed");
        return;
      }

      // Rejected applications get sent straight to the edit wizard instead
      // of a real session (no token is issued for this case) — this was
      // being silently ignored before, always falling through to
      // /agentpage with a broken "agentToken=undefined" cookie.
      if (data.redirect) {
        router.replace(data.redirect);
        return;
      }

      // ✅ SAVE TOKEN COOKIE (VERY IMPORTANT FOR 401 FIX)
      document.cookie = `agentToken=${data.token}; path=/; max-age=86400`;

      // optional local storage
      localStorage.setItem("agentName", data.agent?.name || "");

      // Send agents who haven't finished training straight to the video
      // lectures instead of /agentpage — agentpage.tsx used to be the one
      // deciding this (after its own async /api/agent/me call), which
      // meant every untrained/newly-approved agent saw a flash of the
      // dashboard before being bounced to /assessmenttraining a second later.
      // The login response already knows trainingCompleted, so decide here.
      router.replace(data.agent?.trainingCompleted ? "/agentpage" : "/assessmenttraining");

    } catch (err) {
      console.error("Login failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // ================= FORGOT PASSWORD =================
  const postJson = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  };

  const openForgotPassword = () => {
    setResetEmail(userName);
    setError(false);
    setStep("email");
  };

  const goToLogin = () => {
    setStep("login");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const sendOtp = async () => {
    setLoading(true);
    try {
      const { ok, data } = await postJson("/api/agent/forgot-password/send-otp", { email: resetEmail });
      if (!ok) {
        toast.error(data.message || "Failed to send OTP");
        return;
      }
      toast.success(data.message || "OTP sent");
      setOtp("");
      setResendTimer(60);
      setStep("otp");
    } catch (err) {
      console.error("Send OTP error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { ok, data } = await postJson("/api/agent/forgot-password/verify-otp", { email: resetEmail, otp });
      if (!ok) {
        toast.error(data.message || "Invalid OTP");
        return;
      }
      toast.success("OTP verified");
      setStep("reset");
    } catch (err) {
      console.error("Verify OTP error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { ok, data } = await postJson("/api/agent/forgot-password/reset", {
        email: resetEmail,
        otp,
        newPassword,
      });
      if (!ok) {
        toast.error(data.message || "Failed to update password");
        return;
      }
      toast.success(data.message || "Password updated");
      setUserName(resetEmail);
      setPassword("");
      goToLogin();
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ================= LOADER ================= */}
      {loading && (
        <div className={styles.loaderOverlay}>
          <FaSpinner className={styles.loaderIcon} />
          <p className={styles.loaderText}>
            {step === "login" ? "Logging in..." : "Please wait..."}
          </p>
        </div>
      )}

      <div className={`${styles.cont} ${styles.agentLogin}`}>
        {/* LEFT IMAGE */}
        <div className={styles.left}>
          <Image
            src={require("@/assets/loginagent.png")}
            alt="image"
            className={styles.leftImage}
          />
        </div>

        {/* LOGIN FORM */}
        <div className={styles.loginCont}>
          <div className={styles.formDiv}>

            <div className={styles.logo}>
              <Image
                src={require("@/assets/logo-trans.png")}
                alt="logo"
                className={styles.logoImage}
              />
            </div>

            <h1 className={styles.heading}>
              {step === "login" ? "Agent Login" : "Reset Password"}
            </h1>

            {step === "login" && (
              <form className={styles.loginForm} onSubmit={onSubmit}>
                {error && <h4>Invalid Credentials</h4>}

                <input
                  type="text"
                  placeholder="E-mail Address"
                  required
                  className={styles.input}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />

                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    required
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    className={styles.eyeIcon}
                    onClick={() => setShowPassword(!showPassword)}
                    role="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <p
                  className={styles.forgotPassword}
                  role="button"
                  tabIndex={0}
                  onClick={openForgotPassword}
                  onKeyDown={(e) => e.key === "Enter" && openForgotPassword()}
                >
                  Forgot Password?
                </p>

                <button
                  className={styles.loginButton}
                  disabled={loading}
                  type="submit"
                >
                  Login
                </button>

                <p className={styles.signupLink}>
                  Don't have an account?{" "}
                  <span
                    className={styles.signupText}
                    onClick={() => router.push("/agentsignup")}
                  >
                    Sign Up
                  </span>
                </p>

              </form>
            )}

            {step === "email" && (
              <form className={styles.loginForm} onSubmit={handleSendOtp}>
                <p className={styles.headingp}>
                  Enter your registered email address and we&apos;ll send you an OTP.
                </p>

                <input
                  type="email"
                  placeholder="E-mail Address"
                  required
                  className={styles.input}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />

                <button className={styles.loginButton} disabled={loading} type="submit">
                  Send OTP
                </button>

                <p className={styles.signupText}>
                  <span className={styles.signupLink} onClick={goToLogin}>
                    Back to Login
                  </span>
                </p>
              </form>
            )}

            {step === "otp" && (
              <form className={styles.loginForm} onSubmit={handleVerifyOtp}>
                <p className={styles.headingp}>
                  Enter the 6-digit OTP sent to <b>{resetEmail}</b>
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter OTP"
                  required
                  className={styles.input}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />

                <button
                  className={styles.loginButton}
                  disabled={loading || otp.length !== 6}
                  type="submit"
                >
                  Verify OTP
                </button>

                <p className={styles.signupText}>
                  {resendTimer > 0 ? (
                    <>Resend OTP in {resendTimer}s</>
                  ) : (
                    <span className={styles.signupLink} onClick={sendOtp}>
                      Resend OTP
                    </span>
                  )}
                  {" · "}
                  <span className={styles.signupLink} onClick={() => setStep("email")}>
                    Change Email
                  </span>
                </p>
              </form>
            )}

            {step === "reset" && (
              <form className={styles.loginForm} onSubmit={handleResetPassword}>
                <p className={styles.headingp}>Create a new password for your account.</p>

                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="New Password (min 8 characters)"
                    required
                    minLength={8}
                    className={styles.input}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <span
                    className={styles.eyeIcon}
                    onClick={() => setShowPassword(!showPassword)}
                    role="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm New Password"
                  required
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button className={styles.loginButton} disabled={loading} type="submit">
                  Update Password
                </button>

                <p className={styles.signupText}>
                  <span className={styles.signupLink} onClick={goToLogin}>
                    Back to Login
                  </span>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
