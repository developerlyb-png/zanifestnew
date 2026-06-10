"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/dialog.module.css";
import { useAuth } from "@/context/AuthContext";

// ✅ FIX — Add defined types
interface LoginDialogProps {
  open: boolean;
  onClose: (type?: string) => void;
  onSuccess: (email: string) => void;
}

export default function LoginDialog({
  open,
  onClose,
  onSuccess,
}: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth();

  if (!open) return null;

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Invalid credentials");
        return;
      }

      // 🔥 Update global AuthContext
      setUser({
        name: data.name || "User",
        email: data.email,
        role: "user",
      });

      onSuccess(data.email);
      onClose();

    } catch (err) {
      console.error(err);
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <h2 className={styles.title}>Login</h2>

        <input
          type="email"
          placeholder="Email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className={styles.buttonGroup}>
          <button className={styles.primaryBtn} onClick={handleLogin} disabled={loading}>
            {loading ? "Please wait..." : "Login"}
          </button>

          <button className={styles.cancelBtn} onClick={() => onClose("cancel")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
