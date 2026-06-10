"use client";
import React, { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Image from "next/image";
import styles from "@/styles/components/Auth/Login.module.css";

import loginBanner from "@/assets/loginbanner.png";
import logo from "@/assets/logo.png";
import { showGlobalAlert } from "../GlobalAlert";

export default function AgentsignUp() {
  const [userName, setUserName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!userName || !email || !password) {
      setErrorMsg("Please fill all fields");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/agentsignup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName, 
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(
          data.message ||
            "You have an incomplete signup. Please wait 1 minute before retrying."
        );
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.message || "Signup failed");
        setLoading(false);
        return;
      }
      showGlobalAlert("Signup Successful!", () => {
        router.push(`/createagent?loginId=${data.loginId}`);
      });
    } catch (error) {
      console.error(error);
      setErrorMsg("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.cont}>
      <div className={styles.left}>
        <Image
          src={loginBanner}
          alt="signup-banner"
          className={styles.leftImage}
        />
      </div>

      <div className={styles.loginCont}>
        <div className={styles.formDiv}>
          <div className={styles.logo}>
            <Image src={logo} alt="logo" className={styles.logoImage} />
          </div>

          <h1 className={styles.heading}>Agent Signup</h1>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            {errorMsg && (
              <div className={styles.error}>
                <h4>{errorMsg}</h4>
              </div>
            )}

            {/* FULL NAME FIELD — UI SAME */}
            <div className={styles.formInput}>
              <input
                type="text"
                placeholder="Full Name"
                value={userName}
                onChange={(e) =>
                  setUserName(
                    e.target.value.charAt(0).toUpperCase() +
                      e.target.value.slice(1)
                  )
                }
                className={styles.input}
              />
            </div>

            {/* EMAIL */}
            <div className={styles.formInput}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            {/* PASSWORD */}
            <div className={styles.formInput} style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />

              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "10px",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                }}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </span>
            </div>

            <button className={styles.loginButton} disabled={loading}>
              {loading ? "Please wait..." : "Sign Up"}
            </button>
            <p className={styles.signupLink}>
              Already have an account?{" "}
              <span
                className={styles.signupText}
                onClick={() => router.push("/agentlogin")}
              >
                Login
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
