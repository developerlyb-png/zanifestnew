"use client";

import React, { useEffect, useState } from "react";
import { AgentCustomer, getAgentCustomer, saveAgentCustomer } from "@/lib/agentCustomer";

// Replaces the customer's OTP login step when an agent is selling from the
// portal: the agent just types the customer's details (no OTPs — the
// customer isn't the one at the keyboard). Pages pass their own input and
// button classes so it matches each flow's look.

type Props = {
  onDone: (c: AgentCustomer) => void;
  inputClassName?: string;
  buttonClassName?: string;
  buttonLabel?: string;
  headingClassName?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AgentCustomerForm({
  onDone,
  inputClassName,
  buttonClassName,
  buttonLabel = "View prices",
  headingClassName,
}: Props) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  // Same customer as earlier in this selling session, if any.
  useEffect(() => {
    const prev = getAgentCustomer();
    if (prev) {
      setName(prev.name || "");
      setMobile(prev.mobile || "");
      setEmail(prev.email || "");
    }
  }, []);

  const submit = () => {
    const c = {
      name: name.trim().replace(/\s+/g, " "),
      mobile: mobile.replace(/\D/g, "").slice(-10),
      email: email.trim(),
    };
    if (c.name.length < 2) return setError("Enter the customer's full name.");
    if (!/^[6-9]\d{9}$/.test(c.mobile)) return setError("Enter a valid 10-digit mobile number for the customer.");
    if (!EMAIL_RE.test(c.email)) return setError("Enter a valid email address for the customer.");
    setError("");
    saveAgentCustomer(c);
    onDone(c);
  };

  return (
    <>
      <h3 className={headingClassName} style={headingClassName ? undefined : { margin: "0 0 6px", fontSize: 20 }}>
        Customer details
      </h3>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "#475569" }}>
        You&apos;re booking as an agent — enter your customer&apos;s details. No OTP needed.
      </p>
      <input
        className={inputClassName}
        placeholder="Customer full name"
        value={name}
        onChange={(e) => setName(e.target.value.replace(/\b\w/g, (ch) => ch.toUpperCase()))}
      />
      <input
        className={inputClassName}
        placeholder="Customer mobile (10 digits)"
        inputMode="numeric"
        maxLength={10}
        value={mobile}
        onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
      />
      <input
        className={inputClassName}
        placeholder="Customer email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <p style={{ margin: "0 0 10px", fontSize: 13, color: "#c0392b", fontWeight: 600 }}>{error}</p>}
      <button type="button" className={buttonClassName} onClick={submit}>
        {buttonLabel}
      </button>
    </>
  );
}
