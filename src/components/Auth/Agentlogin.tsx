"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "@/styles/components/Auth/Login.module.css";
import Image from "next/image";

export default function Agentlogin() {

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

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
      // dashboard before being bounced to /videolectures a second later.
      // The login response already knows trainingCompleted, so decide here.
      router.replace(data.agent?.trainingCompleted ? "/agentpage" : "/videolectures");

    } catch (err) {
      console.error("Login failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ================= LOADER ================= */}
      {loading && (
        <div className={styles.loaderOverlay}>
          <FaSpinner className={styles.loaderIcon} />
          <p className={styles.loaderText}>Logging in...</p>
        </div>
      )}

      <div className={styles.cont}>
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

            <h1 className={styles.heading}>Agent Login</h1>

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

              <p className={styles.forgotPassword}>Forgot Password?</p>

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
          </div>
        </div>
      </div>
    </>
  );
}
