"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/components/Auth/Login.module.css";
import Image from "next/image";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { toast } from 'react-hot-toast';


export default function AdminLogin() {
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState("");

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(true);
        toast.error(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Store token for client-side requests and use replace for navigation
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
      }

      if (data.role === "superadmin") {
        router.replace("/superadmin");
      } else if (data.role === "admin") {
        router.replace("/admindashboard");
      } else {
        toast.error("Unauthorized Role");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
    setResetEmail(email);
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
      const { ok, data } = await postJson("/api/admin/forgot-password/send-otp", { email: resetEmail });
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
      const { ok, data } = await postJson("/api/admin/forgot-password/verify-otp", { email: resetEmail, otp });
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
      const { ok, data } = await postJson("/api/admin/forgot-password/reset", {
        email: resetEmail,
        otp,
        newPassword,
      });
      if (!ok) {
        toast.error(data.message || "Failed to update password");
        return;
      }
      toast.success(data.message || "Password updated");
      setEmail(resetEmail);
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
    <div className={`${styles.cont} ${styles.adminCont}`}>
      {/* 🔥 Full Page Loader */}
      {loading && (
        <div className={styles.loaderOverlay}>
          <AiOutlineLoading3Quarters className={styles.pageLoader} />
          <p>Loading, please wait...</p>
        </div>
      )}

      <div className={styles.left}>
        <Image
          src={require("@/assets/adminlogin.png")}
          alt="image"
          className={styles.leftImage}
        />
      </div>

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
            {step === "login" ? "Admin Login" : "Reset Password"}
          </h1>

          {step === "login" && (
            <form className={styles.loginForm} onSubmit={handleSubmit}>
              <div className={styles.error}>
                {error && <h4>Invalid Credentials</h4>}
              </div>

              <div className={styles.formInput}>
                <input
                  type="text"
                  name="email"
                  id="email"
                  placeholder="E-mail Address"
                  required
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.formInput}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  placeholder="Password"
                  required
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className={styles.showPasswordDiv}>
                <input
                  type="checkbox"
                  id="showP"
                  className={styles.passCheck}
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                />
                <label htmlFor="showP">Show Password</label>
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
            </form>
          )}

          {step === "email" && (
            <form className={styles.loginForm} onSubmit={handleSendOtp}>
              <p className={styles.headingp}>
                Enter your registered email address and we&apos;ll send you an OTP.
              </p>

              <div className={styles.formInput}>
                <input
                  type="email"
                  name="resetEmail"
                  placeholder="E-mail Address"
                  required
                  className={styles.input}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

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

              <div className={styles.formInput}>
                <input
                  type="text"
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter OTP"
                  required
                  className={styles.input}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>

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

              <div className={styles.formInput}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  autoComplete="new-password"
                  placeholder="New Password (min 8 characters)"
                  required
                  minLength={8}
                  className={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className={styles.formInput}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Confirm New Password"
                  required
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className={styles.showPasswordDiv}>
                <input
                  type="checkbox"
                  id="showNewP"
                  className={styles.passCheck}
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                />
                <label htmlFor="showNewP">Show Password</label>
              </div>

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
  );
}
