"use client";

import {
  buildCarQuoteInput,
  parseQuoteResponse,
  computeBreakinStatus,
} from "@/lib/zuno4w";

import React, { useState, useEffect } from "react";

import styles from "@/styles/pages/CommercialVehicle/VehicleInfoDialog.module.css";

import { FiEdit2, FiMapPin, FiX } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { BsCalendarDate, BsFuelPumpDiesel } from "react-icons/bs";
import { GiGearStickPattern } from "react-icons/gi";
import { CheckCircle2 } from "lucide-react";

import { useRouter } from "next/navigation";

import PolicyExpiryDialog from "./PolicyExpiryDialog";
import ClaimDetailDialog, { ClaimAnswer } from "./ClaimDetailDialog";

import loadingStyles from "@/styles/pages/quoteLoading.module.css";

interface VehicleInfoDialogProps {
  onClose: () => void;

  oncommercialvehicle1: () => void;

  onChooseVehicle: () => void;

  onChooseBrand: () => void;

  onChooseModel: () => void;

  onChooseFuelVariant: () => void;

  onChooseYear: () => void;

  vehicleNumber: string;

  selectedVehicle: string | null;

  selectedBrand: string | null;

  selectedModel: string | null;

  selectedVariant: string | null;

  selectedFuel?: string | null;

  selectedYear: number | null;

  selectedLocation: any;

  rcDetails: any;

  onUpdateData: (data: any) => void;
}

const VehicleInfoDialog: React.FC<VehicleInfoDialogProps> = ({
  onClose = () => {},

  onChooseBrand = () => {},

  onChooseModel = () => {},

  onChooseFuelVariant = () => {},

  onChooseYear = () => {},

  oncommercialvehicle1 = () => {},

  vehicleNumber = "",

  selectedBrand = "",

  selectedModel = "",

  selectedVariant = "",

  selectedFuel = "",

  selectedYear = null,

  selectedLocation = null,

  rcDetails = null,
}) => {
  const router = useRouter();

  /* =========================================================
     BASIC STATES
  ========================================================= */

  const [fullName, setFullName] = useState("");

  const [mobile, setMobile] = useState("+91 ");

  /* =========================================================
     MOBILE OTP STATES
  ========================================================= */

  const [mobileOtpSent, setMobileOtpSent] = useState(false);

  const [mobileOtp, setMobileOtp] = useState("");

  const [mobileVerified, setMobileVerified] = useState(false);

  /* =========================================================
     EMAIL OTP STATES
  ========================================================= */

  const [email, setEmail] = useState("");

  const [emailOtpSent, setEmailOtpSent] = useState(false);

  const [emailOtp, setEmailOtp] = useState("");

  const [emailVerified, setEmailVerified] = useState(false);

  const [loggedUser, setLoggedUser] = useState<any>(null);

  /* =========================================================
     POLICY / CLAIM STATES
  ========================================================= */

  const [showExpiryDialog, setShowExpiryDialog] = useState(false);

  const [showClaimDialog, setShowClaimDialog] = useState(false);
<<<<<<< HEAD
  const [pincode, setPincode] = useState("");
  // RC owner address normally carries the pincode, so ask only when it's missing.
  const effectivePincode = () => rcDetails?.pincode || pincode;
=======

>>>>>>> origin/vishal
  const [policyExpiryDate, setPolicyExpiryDate] = useState<string | null>(
    null
  );

  const [quoteLoading, setQuoteLoading] = useState(false);

  /* =========================================================
     NAME FORMAT
  ========================================================= */

  const handleFullNameChange = (e: any) => {
    const value = e.target.value
      .toLowerCase()
      .replace(/\b\w/g, (char: string) => char.toUpperCase());

    setFullName(value);
  };

  /* =========================================================
     LOAD LOGGED USER
  ========================================================= */

  useEffect(() => {
    const saved = localStorage.getItem("user");

    if (saved && saved !== "undefined") {
      const user = JSON.parse(saved);

      console.log("CAR LOGGED USER", user);

      setLoggedUser(user);

      setFullName(user.name || "");

      setEmail(user.email || "");

      setMobile("+91 " + user.mobile);

      setMobileVerified(true);

      setEmailVerified(true);
    }
  }, []);

  /* =========================================================
     MOBILE FORMAT
  ========================================================= */

  const handleMobileChange = (e: any) => {
    const prefix = "+91 ";

    let input = e.target.value;

    if (!input.startsWith(prefix)) {
      input = prefix;
    }

    const digitsOnly = input
      .substring(prefix.length)
      .replace(/\D/g, "");

    setMobile(prefix + digitsOnly.slice(0, 10));
  };

  /* =========================================================
     SEND WHATSAPP OTP
  ========================================================= */

  const sendMobileOtp = async () => {
    const mobileNumber = mobile.replace("+91 ", "");

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      alert("Enter valid mobile number");

      return;
    }

    try {
      const res = await fetch("/api/auth/send-whatsapp-otp", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mobile: mobileNumber,
        }),
      });

      const data = await res.json();

      console.log("WHATSAPP RESPONSE", data);

      if (res.ok && data.success) {
        setMobileOtpSent(true);

        alert("OTP Sent on WhatsApp");
      } else {
        alert(data.message || "OTP Failed");
      }
    } catch (error) {
      console.log("WHATSAPP OTP ERROR", error);

      alert("OTP Failed");
    }
  };

  /* =========================================================
     VERIFY WHATSAPP OTP
  ========================================================= */

  const verifyMobileOtp = async () => {
    if (!mobileOtp.trim()) {
      alert("Enter OTP");

      return;
    }

    try {
      const res = await fetch("/api/auth/verify-whatsapp-otp", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mobile: mobile.replace("+91 ", ""),

          otp: mobileOtp,
        }),
      });

      const data = await res.json();

      console.log("VERIFY MOBILE RESPONSE", data);

      if (res.ok && data.success) {
        setMobileVerified(true);

        alert("Mobile Verified");
      } else {
        alert(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.log("VERIFY MOBILE ERROR", error);

      alert("Invalid OTP");
    }
  };

  /* =========================================================
     SEND EMAIL OTP
  ========================================================= */

  const sendEmailOtp = async () => {
    if (!email) {
      alert("Enter Email");

      return;
    }

    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),

          name: fullName,

          mobile: mobile.replace("+91 ", ""),
        }),
      });

      const data = await res.json();

      console.log("EMAIL RESPONSE", data);

      if (res.ok && data.success) {
        setEmailOtpSent(true);

        alert("Email OTP Sent");
      } else {
        alert(data.message || "Email OTP Failed");
      }
    } catch (error) {
      console.log("EMAIL OTP ERROR", error);

      alert("Email OTP Failed");
    }
  };

  /* =========================================================
     VERIFY EMAIL OTP + AUTO LOGIN
  ========================================================= */

  const verifyEmailOtp = async () => {
    if (!emailOtp.trim()) {
      alert("Enter Email OTP");

      return;
    }

    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),

          otp: emailOtp,
        }),
      });

      const data = await res.json();

      console.log("EMAIL VERIFY RESPONSE", data);

      if (res.ok && data.success) {
        const loginRes = await fetch("/api/users/health-login", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: fullName,

            email: email.trim(),

            mobile: mobile.replace("+91 ", ""),
          }),
        });

        const loginData = await loginRes.json();

        console.log("CAR USER LOGIN", loginData);

        if (loginData.success) {
          localStorage.setItem(
            "user",

            JSON.stringify({
              id: loginData.user.id,

              name: loginData.user.name,

              email: loginData.user.email,

              mobile: loginData.user.mobile,

              loginTime: Date.now(),
            })
          );

          window.dispatchEvent(new Event("userLogin"));
        }

        setEmailVerified(true);

        alert("Email Verified");
      } else {
        alert(data.message || "Wrong Email OTP");
      }
    } catch (error) {
      console.log("EMAIL VERIFY ERROR", error);

      alert("Email verification failed");
    }
  };

  /* =========================================================
     PROCEED TO QUOTE
  ========================================================= */

  const proceedToQuote = async (
    expiryDate: string | null,
    claim: ClaimAnswer
  ) => {
    setQuoteLoading(true);

    try {
      console.log("RC DETAILS >>>", rcDetails);

      if (!rcDetails || (!rcDetails.reg_no && !vehicleNumber)) {
        alert(
          "Vehicle data not found — please search your car number again"
        );

        setQuoteLoading(false);

        return;
      }

      const quoteInput = await buildCarQuoteInput(rcDetails);

      console.log("QUOTE INPUT >>>", quoteInput);

      if ((quoteInput as any).error) {
        console.log("CHAIN FALLBACK:", quoteInput);

        alert(
          "Could not auto-match vehicle: " +
            (quoteInput as any).error
        );

        setQuoteLoading(false);

        return;
      }

      const enrichedInput = {
        ...quoteInput,

        previousPolicyExpiryDate: expiryDate || "",
<<<<<<< HEAD
        pincode: effectivePincode(),
=======

>>>>>>> origin/vishal
        claimDeclaration:
          claim === "Yes"
            ? "Yes"
            : claim === "No"
            ? "No"
            : "",

        breakinInsurance: computeBreakinStatus(expiryDate),
      };

      const res = await fetch("/api/car/4w/quote", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(enrichedInput),
      });

      const combined = await res.json();

      console.log("COMBINED QUOTE RESPONSE >>>", combined);

      const zunoEntry = combined?.quotes?.find(
        (q: any) => q.insurer === "ZUNO"
      );

      const sbiEntry = combined?.quotes?.find(
        (q: any) => q.insurer === "SBI"
      );

      const data = zunoEntry?.response;

      if (data?.success) {
        const plan = parseQuoteResponse(data);

        console.log("PLAN >>>", plan);

        localStorage.setItem(
          "selectedQuote",
          JSON.stringify(plan)
        );

<<<<<<< HEAD
        // SBI is stored as-is (success or failure) so carinsurance3 can show
        // it alongside Zuno's plan, or a friendly "unavailable" state.
        localStorage.setItem("selectedQuoteSbi", JSON.stringify(sbiEntry || null));
        localStorage.setItem(
          "selectedQuoteDigit",
          JSON.stringify(combined?.quotes?.find((q: any) => q.insurer === "DIGIT") || null)
=======
        localStorage.setItem(
          "carQuoteInput",
          JSON.stringify(enrichedInput)
        );

        localStorage.setItem(
          "carRcDetails",
          JSON.stringify(rcDetails)
        );

        localStorage.setItem(
          "selectedQuoteSbi",
          JSON.stringify(sbiEntry || null)
>>>>>>> origin/vishal
        );

        router.push("/carinsurance/carinsurance3");
      } else {
        alert(data?.message || "ZUNO Quote Failed");

        setQuoteLoading(false);
      }
    } catch (err: any) {
      console.log("VIEW PRICES ERROR >>>", err);

      alert("Something went wrong: " + err?.message);

      setQuoteLoading(false);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>

        {/* CLOSE */}

        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <FiX size={22} />
        </button>


        {/* =====================================================
            LEFT
        ===================================================== */}

        <div className={styles.left}>

          <h3 className={styles.heading}>
            <CheckCircle2 className={styles.checkIcon} />

            <span>We have found your vehicle</span>
          </h3>


          <div className={styles.infoBox}>

            {/* LOCATION */}

            <div className={styles.item}>
              <FiMapPin className={styles.icon} />

              <span>
                {selectedLocation?.rto
                  ? selectedLocation.rto
                  : vehicleNumber?.substring(0, 4) || ""}
              </span>

              <FiEdit2
                className={styles.editIcon}
                onClick={oncommercialvehicle1}
              />
            </div>


            {/* YEAR */}

            <div className={styles.item}>
              <BsCalendarDate className={styles.icon} />

              <span>
                {selectedYear
                  ? selectedYear
                  : new Date().getFullYear()}
              </span>

              <FiEdit2
                className={styles.editIcon}
                onClick={onChooseYear}
              />
            </div>


            {/* BRAND */}

            <div className={styles.item}>
              <FaCar className={styles.icon} />

              <span>{selectedBrand}</span>

              <FiEdit2
                className={styles.editIcon}
                onClick={onChooseBrand}
              />
            </div>


            {/* MODEL */}

            <div className={styles.item}>
              <FaCar className={styles.icon} />

              <span>{selectedModel}</span>

              <FiEdit2
                className={styles.editIcon}
                onClick={onChooseModel}
              />
            </div>


            {/* FUEL */}

            <div className={styles.item}>
              <BsFuelPumpDiesel className={styles.icon} />

              <span>{selectedFuel}</span>

              <FiEdit2
                className={styles.editIcon}
                onClick={onChooseFuelVariant}
              />
            </div>


            {/* VARIANT */}

            <div className={styles.item}>
              <GiGearStickPattern className={styles.icon} />

              <span>{selectedVariant}</span>

              <FiEdit2
                className={styles.editIcon}
                onClick={onChooseFuelVariant}
              />
            </div>

          </div>
        </div>


        {/* =====================================================
            RIGHT
        ===================================================== */}

        <div className={styles.right}>

          {!loggedUser && (
            <>

              <h3 className={styles.heading}>
                Almost done! Just one last step
              </h3>


              {/* FULL NAME */}

              <input
                className={styles.input}
                placeholder="Enter your full name"
                value={fullName}
                onChange={handleFullNameChange}
              />


              {/* MOBILE */}

              <input
                className={styles.input}
                placeholder="Enter mobile number"
                value={mobile}
                maxLength={14}
                disabled={mobileVerified}
                onChange={handleMobileChange}
              />


              {/* MOBILE VERIFIED */}

              {mobileVerified && (
                <div
                  style={{
                    background: "#e6f8ec",

                    color: "#0a8f3c",

                    padding: "8px 12px",

                    borderRadius: "8px",

                    fontWeight: "600",

                    marginBottom: "12px",
                  }}
                >
                  ✓ Mobile Verified
                </div>
              )}


              {/* SEND MOBILE OTP */}

              {!mobileOtpSent && !mobileVerified && (
                <button
                  className={styles.viewBtn}
                  onClick={sendMobileOtp}
                >
                  Send Mobile OTP
                </button>
              )}


              {/* MOBILE OTP */}

              {mobileOtpSent && !mobileVerified && (
                <>
                  <input
                    className={styles.input}
                    placeholder="Enter Mobile OTP"
                    value={mobileOtp}
                    onChange={(e) =>
                      setMobileOtp(e.target.value)
                    }
                  />

                  <button
                    className={styles.viewBtn}
                    onClick={verifyMobileOtp}
                  >
                    Verify OTP
                  </button>
                </>
              )}


              {/* EMAIL */}

              {mobileVerified && (
                <input
                  className={styles.input}
                  placeholder="Enter Email"
                  value={email}
                  disabled={emailVerified}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              )}


              {/* EMAIL VERIFIED */}

              {emailVerified && (
                <div
                  style={{
                    background: "#e6f8ec",

                    color: "#0a8f3c",

                    padding: "8px 12px",

                    borderRadius: "8px",

                    fontWeight: "600",

                    marginBottom: "12px",
                  }}
                >
                  ✓ Email Verified
                </div>
              )}


              {/* SEND EMAIL OTP */}

              {mobileVerified &&
                !emailOtpSent &&
                !emailVerified && (
                  <button
                    className={styles.viewBtn}
                    onClick={sendEmailOtp}
                  >
                    Send Email OTP
                  </button>
                )}


              {/* EMAIL OTP */}

              {emailOtpSent && !emailVerified && (
                <>
                  <input
                    className={styles.input}
                    placeholder="Enter Email OTP"
                    value={emailOtp}
                    onChange={(e) =>
                      setEmailOtp(e.target.value)
                    }
                  />

                  <button
                    className={styles.viewBtn}
                    onClick={verifyEmailOtp}
                  >
                    Verify Email OTP
                  </button>
                </>
              )}

            </>
          )}


          {/* ===================================================
              VIEW PRICES
          =================================================== */}

          {emailVerified && (
<<<<<<< HEAD
            <>
              {!rcDetails?.pincode && (
                <input
                  className={styles.input}
                  placeholder="Pincode (6 digits)"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                />
              )}
              <button
                className={styles.viewBtn}
                onClick={() => {
                  if (!rcDetails || (!rcDetails.reg_no && !vehicleNumber)) {
                    alert(
                      "Vehicle data not found — please search your car number again"
                    );
                    return;
                  }
                  if (!/^\d{6}$/.test(effectivePincode())) {
                    alert("Enter your 6-digit pincode");
                    return;
                  }
                  setShowExpiryDialog(true);
                }}
              >
                View prices
              </button>
            </>
=======
            <button
              className={styles.viewBtn}
              onClick={() => {
                if (
                  !rcDetails ||
                  (!rcDetails.reg_no && !vehicleNumber)
                ) {
                  alert(
                    "Vehicle data not found — please search your car number again"
                  );

                  return;
                }

                setShowExpiryDialog(true);
              }}
            >
              View prices
            </button>
>>>>>>> origin/vishal
          )}


          {/* ===================================================
              TERMS
          =================================================== */}

          <p className={styles.terms}>
            By clicking on 'View prices', you agree to our{" "}
            <a
              href="https://zanifestinsurance.com/Privacypolicy"
            >
              Privacy Policy
            </a>{" "}
            &{" "}
            <a
              href="https://zanifestinsurance.com/Termscondition"
            >
              Terms of Use
            </a>
          </p>

        </div>
      </div>


      {/* =====================================================
          POLICY EXPIRY
      ===================================================== */}

      <PolicyExpiryDialog
        open={showExpiryDialog}

        onClose={() =>
          setShowExpiryDialog(false)
        }

        onSelect={(date) => {
          setPolicyExpiryDate(date);

          setShowExpiryDialog(false);

          setShowClaimDialog(true);
        }}
      />


      {/* =====================================================
          CLAIM DETAIL
      ===================================================== */}

      <ClaimDetailDialog
        open={showClaimDialog}

        onClose={() =>
          setShowClaimDialog(false)
        }

        onSelect={(answer) => {
          setShowClaimDialog(false);

          proceedToQuote(
            policyExpiryDate,
            answer
          );
        }}
      />


      {/* =====================================================
          QUOTE LOADING
      ===================================================== */}

      {quoteLoading && (
        <div className={loadingStyles.overlay}>

          <div className={loadingStyles.box}>

            <div className={loadingStyles.spinner} />

            <p className={loadingStyles.text}>
              Finding your best price...
            </p>

            <p className={loadingStyles.subtext}>
              This won&apos;t take long
            </p>

          </div>

        </div>
      )}

    </div>
  );
};

export default VehicleInfoDialog;