"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import styles from "@/styles/components/ui/InsuranceInquiryModal.module.css";

export default function InsuranceInquiryModal({ product, onClose }: { product: string; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "insurance-popup",
          service: product,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("mobile"),
          message: String(form.get("message") || "").trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to send your request.");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="inquiry-title">
        <div className={styles.banner}>
          <span className={styles.bannerMark} aria-hidden="true">Z</span>
          <div><span className={styles.bannerEyebrow}>Zanifest Insurance</span><span className={styles.bannerCopy}>Personal guidance. Confident cover.</span></div>
        </div>
        <button className={styles.close} type="button" onClick={onClose} aria-label="Close"><IoClose /></button>
        {sent ? (
          <div className={styles.success}>
            <span className={styles.successMark} aria-hidden="true">✓</span>
            <h2 id="inquiry-title">Thank you!</h2>
            <p>Your request about {product} has been sent to zanifestinsurancebroker@gmail.com. Our team will contact you soon.</p>
            <button type="button" className={styles.submit} onClick={onClose}>Done</button>
          </div>
        ) : (
          <div className={styles.content}>
            <p className={styles.eyebrow}>Let’s find the right cover</p>
            <h2 id="inquiry-title">Talk to an advisor</h2>
            <p className={styles.subtitle}>Share your details and our team will help with <strong>{product}</strong>.</p>
            <form className={styles.form} onSubmit={submit}>
              <div className={styles.fields}>
                <label>Name<input name="name" autoComplete="name" placeholder="Your full name" required maxLength={100} /></label>
                <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} /></label>
                <label className={styles.fullWidth}>Mobile<input name="mobile" type="tel" autoComplete="tel" placeholder="Your phone number" required pattern="[0-9+() .-]{7,20}" title="Enter a valid mobile number" /></label>
                <label className={styles.fullWidth}>Message<textarea name="message" rows={3} placeholder="How can we help you?" required maxLength={2000} /></label>
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? "Sending…" : "Request a callback"}<span aria-hidden="true">→</span></button>
              <p className={styles.privacy}>Your details stay private and are only used to respond to your inquiry.</p>
            </form>
          </div>
        )}
      </section>
    </div>,
    document.body
  );
}
