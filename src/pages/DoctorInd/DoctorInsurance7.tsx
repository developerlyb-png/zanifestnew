import React, { useState } from "react";
import styles from "@/styles/pages/DoctorInd/doctorinsurance7.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";
import Image from "next/image";
import man from "@/assets/doctor/man.png"; // ✅ Imported image
import futureImg from "@/assets/doctor/Future_Generali_India_Life_Insurance_logo.jpg";
import { useRouter } from "next/router"; // ✅ Import router

type Props = {
  name?: string;
  phone?: string;
  email?: string;
  reference?: string;
};

const maskPhone = (phone = "+9189xxxx623") => {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 6) return phone;
  const start = digits.slice(0, 2);
  const last = digits.slice(-3);
  return `+${start} ${digits.slice(2, 4)}****${last}`;
};

const maskEmail = (email = "as*@gmail.com") => {
  if (!email) return "";
  const parts = email.split("@");
  if (parts.length === 1) return email;
  const left = parts[0];
  const domain = parts[1];
  return `${left.slice(0, Math.min(2, left.length))}*@${domain}`;
};

const Checkout: React.FC<Props> = ({
  name = "Dr sadsad",
  phone = "+91 89*****623",
  email = "as*@gmail.com",
  reference = "898388805",
}) => {
  const [showModal, setShowModal] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));

  const router = useRouter(); // ✅ Router instance

  const handleOtpChange = (val: string, index: number) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
  };

  const handleVerify = () => {
    alert("OTP Verified: " + otp.join(""));
    setShowModal(false);
  };

  return (
    <>
      <UserDetails />
      <Navbar />
      <div className={styles.page}>
        <header className={styles.header}>
          <button
            className={styles.back}
            aria-label="go back"
            onClick={() => router.push("/DoctorInd/DoctorInsurance5")} // ✅ Navigate back
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 18l-6-6 6-6"
                stroke="#2B2B2B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className={styles.title}>Checkout</h1>
        </header>

        <p className={styles.lead}>
          Thank you <span className={styles.highlight}>{name}</span> for choosing{" "}
          <strong>Zanifest</strong> for your Professional Indemnity
          requirements.
        </p>

        <div className={styles.notice} role="note">
          <svg
            className={styles.noticeIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" stroke="#7A5B00" strokeWidth="1.5" />
            <path d="M12 11.5v4" stroke="#7A5B00" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="8" r="1" fill="#7A5B00" />
          </svg>
          <div className={styles.noticeText}>
            As per new IRDAI guidelines, KYC submission is now mandatory for policy
            issuance and policy copy will only be delivered after successful KYC
            submission
          </div>
        </div>

        <section className={styles.policyWrap}>
          <div className={styles.refBadge}>Reference Number: {reference}</div>

          <div className={styles.policyCard}>
            {/* Left: Insurer meta/logo */}
            <div className={styles.metaCol}>
              <div className={styles.logoBox}>
                <Image
                  src={futureImg}
                  alt="Future Generali logo"
                  className={styles.logo}
                />
              </div>
            </div>

            {/* Middle: Info + CTA row below */}
            <div className={styles.infoCol}>
              <div className={styles.infoRow}>
                <div>
                  <div className={styles.infoLabel}>Cover amount</div>
                  <div className={styles.infoValue}>₹ 1,00,00,000</div>
                </div>

                <div>
                  <div className={styles.infoLabel}>Policy start date</div>
                  <div className={styles.infoSmall}>21-08-2025</div>
                </div>

                <div>
                  <div className={styles.infoLabel}>Policy end date</div>
                  <div className={styles.infoSmall}>20-08-2026</div>
                </div>
              </div>

              <div className={styles.ctaRow}>
                <div className={styles.premiumLine}>
                  <div className={styles.premiumLabel}>Premium</div>
                  <div className={styles.premiumValue}>
                    ₹ 5,553/-{" "}
                    <span className={styles.premiumSmall}>
                      (Inclusive of all taxes)
                    </span>
                  </div>
                </div>

                <button
                  className={styles.uploadBtn}
                  type="button"
                  onClick={() => setShowModal(true)}
                >
                  Upload documents
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.personalCard}>
          <div className={styles.personalLeft}>
            <h3 className={styles.personalTitle}>Personal details  -</h3>

            <div className={styles.detailRow}>
              <div>
                <div className={styles.detailLabel}>Name</div>
                <div className={styles.detailValue}>{name}</div>
              </div>
              <div>
                <div className={styles.detailLabel}>Phone number</div>
                <div className={styles.detailValue}>{maskPhone(phone)}</div>
              </div>
              <div>
                <div className={styles.detailLabel}>Email ID</div>
                <div className={styles.detailValue}>{maskEmail(email)}</div>
              </div>
            </div>
          </div>

          <div className={styles.personalRight} aria-hidden>
            <div className={styles.avatar}>
              {/* ✅ Avatar changed to man.png */}
              <img
                src={man.src}
                alt="User avatar"
                className={styles.avatarImg}
              />
            </div>
          </div>
        </section>

        <footer className={styles.footer} />

        {/* OTP MODAL */}
        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <button
                className={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
              <div className={styles.modalIcon}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="2" width="12" height="20" rx="2" stroke="#0f172a" />
                  <circle cx="12" cy="18" r="1" fill="#0f172a" />
                </svg>
              </div>
              <h2 className={styles.modalTitle}>OTP verification</h2>
              <p className={styles.modalText}>
                Please enter 6 digit OTP sent on <br />
                <strong>{maskPhone(phone)}</strong>
              </p>

              <div className={styles.otpInputs}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                  />
                ))}
              </div>

              <p className={styles.resend}>
                Didn’t receive the OTP yet?{" "}
                <button className={styles.resendBtn}>Resend</button>
              </p>

              <button className={styles.verifyBtn} onClick={handleVerify}>
                Verify OTP
              </button>
              <p className={styles.modalFooter}>
                By clicking Verify OTP, you agree to allow us to contact you for
                insurance services. This will override your existing DND settings.
              </p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Checkout;
