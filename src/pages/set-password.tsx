"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import PasswordStrengthBar from "react-password-strength-bar";
import styles from "@/styles/pages/set-password.module.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from 'react-hot-toast';

export default function SetPassword() {
  const [customScore, setCustomScore] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { token } = router.query;

  const evaluatePassword = (pwd: string) => {
    let score = 0;
    let requirements: string[] = [];

    if (/[A-Z]/.test(pwd)) score++;
    else requirements.push("one uppercase letter");

    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    else requirements.push("one special character");

    if (/\d/.test(pwd)) score++;
    else requirements.push("one number");

    setCustomScore(score);
    setMessage(
      requirements.length > 0 && pwd.length > 0
        ? `Password must include at least ${requirements.join(", ")}.`
        : ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length > 8) {
      return setMessage("Password must not exceed 8 characters.");
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
    }

    try {
      const res = await fetch("/api/users/passwordgeneration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      setMessage(data.message);

      if (res.ok) {
        toast.success("Password set successfully. Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoWrapper}>
          <Image
            src={require("@/assets/logo.png")}
            alt="logo"
            className={styles.logoImage}
          />
        </div>

        <h2 className={styles.title}>Set New Password</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* New Password Field */}
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              maxLength={8}
              onChange={(e) => {
                const raw = e.target.value;
                const val = raw.length > 8 ? raw.slice(0, 8) : raw;
                if (raw.length > 8)
                  setMessage("Password is limited to 8 characters.");
                else setMessage("");
                setPassword(val);
                evaluatePassword(val);
              }}
              required
              className={styles.input}
            />
            <span
              className={styles.eyeIcon}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </span>
          </div>

          {/* Password Strength Bar */}
          <PasswordStrengthBar
            password={password}
            minLength={1}
            scoreWords={[
              "Missing requirements",
              "One rule met",
              "Two rules met",
              "All rules met",
            ]}
          />

          {/* Confirm Password */}
                    <div className={styles.inputWrapper}>

          <input
              type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirm}
            maxLength={8}
            onChange={(e) => {
              const raw = e.target.value;
              const val = raw.length > 8 ? raw.slice(0, 8) : raw;
              setConfirm(val);
            }}
            required
            className={styles.input}
          />
            <span
              className={styles.eyeIcon}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </span>
          </div>

          {/* Submit */}
          <button type="submit" className={styles.button}>
            Create Password
          </button>
        </form>

        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
}
