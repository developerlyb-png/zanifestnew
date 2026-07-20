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

import { useRouter } from "next/navigation";
import PolicyExpiryDialog from "./PolicyExpiryDialog";
import ClaimDetailDialog, { ClaimAnswer } from "./ClaimDetailDialog";

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

  // BASIC STATES

  const [fullName, setFullName] = useState("");

  const [mobile, setMobile] = useState("+91 ");

  // MOBILE OTP STATES

  const [mobileOtpSent, setMobileOtpSent] = useState(false);

  const [mobileOtp, setMobileOtp] = useState("");

  const [mobileVerified, setMobileVerified] = useState(false);

  // EMAIL OTP STATES

  const [email, setEmail] = useState("");

  const [emailOtpSent, setEmailOtpSent] = useState(false);

  const [emailOtp, setEmailOtp] = useState("");

  const [emailVerified, setEmailVerified] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);

  // Policy-expiry + claim modal flow (before fetching the real quote)
  const [showExpiryDialog, setShowExpiryDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [policyExpiryDate, setPolicyExpiryDate] = useState<string | null>(
    null
  );
  // NAME FORMAT

  const handleFullNameChange = (e: any) => {
    const value = e.target.value

      .toLowerCase()

      .replace(
        /\b\w/g,

        (char: string) => char.toUpperCase(),
      );

    setFullName(value);
  };

  useEffect(() => {
    const saved = localStorage.getItem("user");

    if (saved && saved !== "undefined") {
      const user = JSON.parse(saved);

      console.log("CAR LOGGED USER", user);

      setLoggedUser(user);

      // auto fill

      setFullName(user.name || "");

      setEmail(user.email || "");

      setMobile("+91 " + user.mobile);

      // skip OTP

      setMobileVerified(true);

      setEmailVerified(true);
    }
  }, []);
  // MOBILE FORMAT

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

  // SEND WHATSAPP OTP
  // SEND STATIC WHATSAPP OTP

  // const sendMobileOtp = async () => {

  //   if (mobile.length !== 14) {

  //     alert("Enter valid mobile number");

  //     return;

  //   }

  //   console.log("STATIC WHATSAPP OTP : 123456");

  //   setTimeout(()=>{

  //     setMobileOtpSent(true);

  //     alert("OTP Sent : 123456");

  //   },500);

  // };
  const sendMobileOtp = async () => {
    const sendMobileOtp = async () => {
      const mobileNumber = mobile.replace("+91 ", "");

      if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
        alert("Enter valid mobile number");

        return;
      }

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
    };

    const res = await fetch(
      "/api/auth/send-whatsapp-otp",

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mobile: mobile.replace("+91 ", ""),
        }),
      },
    );

    const data = await res.json();

    console.log("WHATSAPP RESPONSE", data);

    if (res.ok && data.success) {
      setMobileOtpSent(true);

      alert("OTP Sent");
    } else {
      alert(data.message || "OTP Failed");
    }
  };

  // VERIFY WHATSAPP OTP
  // VERIFY STATIC OTP

  // const verifyMobileOtp = async () => {

  //  if(!mobileOtp.trim()){

  //   alert("Enter OTP");

  //   return;

  //  }

  //  if(mobileOtp !== "123456"){

  //   alert("Invalid OTP");

  //   return;

  //  }

  //  setMobileVerified(true);

  //  alert("Mobile Verified");

  // };
  const verifyMobileOtp = async () => {
    const res = await fetch(
      "/api/auth/verify-whatsapp-otp",

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mobile: mobile.replace("+91 ", ""),

          otp: mobileOtp,
        }),
      },
    );

    const data = await res.json();

    console.log(
      "VERIFY MOBILE RESPONSE",

      data,
    );

    if (res.ok && data.success) {
      setMobileVerified(true);

      alert("Mobile Verified");
    } else {
      alert(data.message || "Invalid OTP");
    }
  };

  // SEND EMAIL OTP

  const sendEmailOtp = async () => {
    if (!email) {
      alert("Enter Email");

      return;
    }

    const res = await fetch(
      "/api/auth/send-email-otp",

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),

          name: fullName,

          mobile: mobile.replace("+91 ", ""),
        }),
      },
    );

    const data = await res.json();

    console.log(
      "EMAIL RESPONSE",

      data,
    );

    if (res.ok && data.success) {
      setEmailOtpSent(true);

      alert("Email OTP Sent");
    } else {
      alert(data.message || "Email OTP Failed");
    }
  };

  // VERIFY EMAIL OTP

  // VERIFY EMAIL OTP + AUTO LOGIN USER

  const verifyEmailOtp = async () => {
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
      // ================================
      // SAVE USER IN DB + LOGIN
      // ================================

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
          }),
        );

        window.dispatchEvent(new Event("userLogin"));
      }

      setEmailVerified(true);

      alert("Email Verified");
    } else {
      alert(data.message || "Wrong Email OTP");
    }
  };

  // Runs after both the policy-expiry and claim-detail questions are answered
  const proceedToQuote = async (
    expiryDate: string | null,
    claim: ClaimAnswer
  ) => {
    try {
      console.log("RC DETAILS >>>", rcDetails);

      if (!rcDetails || (!rcDetails.reg_no && !vehicleNumber)) {
        alert("Vehicle data not found — please search your car number again");
        return;
      }

      const quoteInput = await buildCarQuoteInput(rcDetails);
      console.log("QUOTE INPUT >>>", quoteInput);

      if ((quoteInput as any).error) {
        console.log("CHAIN FALLBACK:", quoteInput);
        alert("Could not auto-match vehicle: " + (quoteInput as any).error);
        return;
      }

      const enrichedInput = {
        ...quoteInput,
        previousPolicyExpiryDate: expiryDate || "",
        claimDeclaration:
          claim === "Yes" ? "Yes" : claim === "No" ? "No" : "",
        breakinInsurance: computeBreakinStatus(expiryDate),
      };

      const res = await fetch("/api/zuno/4w/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrichedInput),
      });

      const data = await res.json();
      console.log("ZUNO QUOTE RESPONSE >>>", data);

      if (data.success) {
        const plan = parseQuoteResponse(data);
        console.log("PLAN >>>", plan);

        localStorage.setItem("selectedQuote", JSON.stringify(plan));
        localStorage.setItem("carQuoteInput", JSON.stringify(enrichedInput));
        localStorage.setItem("carRcDetails", JSON.stringify(rcDetails)); // ← the missing save

        router.push("/carinsurance/carinsurance3");
      } else {
        alert(data.message || "ZUNO Quote Failed");
      }
    } catch (err: any) {
      console.log("VIEW PRICES ERROR >>>", err);
      alert("Something went wrong: " + err?.message);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <button className={styles.closeBtn} onClick={onClose}>
          <FiX size={22} />
        </button>

        {/* LEFT */}

        <div className={styles.left}>
          <h3 className={styles.heading}>✅ We have found your vehicle</h3>

          <div className={styles.infoBox}>
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

            <div className={styles.item}>
              <BsCalendarDate className={styles.icon} />

              <span>
                {selectedYear ? selectedYear : new Date().getFullYear()}
              </span>

              <FiEdit2 className={styles.editIcon} onClick={onChooseYear} />
            </div>

            <div className={styles.item}>
              <FaCar className={styles.icon} />

              <span>{selectedBrand}</span>

              <FiEdit2 className={styles.editIcon} onClick={onChooseBrand} />
            </div>

            <div className={styles.item}>
              <FaCar className={styles.icon} />

              <span>{selectedModel}</span>

              <FiEdit2 className={styles.editIcon} onClick={onChooseModel} />
            </div>

            <div className={styles.item}>
              <BsFuelPumpDiesel className={styles.icon} />

              <span>{selectedFuel}</span>

              <FiEdit2
                className={styles.editIcon}
                onClick={onChooseFuelVariant}
              />
            </div>

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

        {/* RIGHT */}
        <div className={styles.right}>
          {!loggedUser && (
            <>
              <h3 className={styles.heading}>
                Almost done! Just one last step
              </h3>

              <input
                className={styles.input}
                placeholder="Enter your full name"
                value={fullName}
                onChange={handleFullNameChange}
              />

              {/* MOBILE INPUT */}

              <input
                className={styles.input}
                placeholder="Enter mobile number"
                value={mobile}
                maxLength={14}
                disabled={mobileVerified}
                onChange={handleMobileChange}
              />

              {/* MOBILE VERIFIED BADGE */}

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
                <button className={styles.viewBtn} onClick={sendMobileOtp}>
                  Send Mobile OTP
                </button>
              )}
              {/* MOBILE OTP BOX */}

              {mobileOtpSent && !mobileVerified && (
                <>
                  <input
                    className={styles.input}
                    placeholder="Enter Mobile OTP"
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value)}
                  />

                  <button className={styles.viewBtn} onClick={verifyMobileOtp}>
                    Verify OTP
                  </button>
                </>
              )}

              {/* EMAIL FLOW AFTER MOBILE VERIFY */}

              {mobileVerified && (
                <>
                  <input
                    className={styles.input}
                    placeholder="Enter Email"
                    value={email}
                    disabled={emailVerified}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </>
              )}
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

              {mobileVerified && !emailOtpSent && !emailVerified && (
                <button className={styles.viewBtn} onClick={sendEmailOtp}>
                  Send Email OTP
                </button>
              )}

              {emailOtpSent && !emailVerified && (
                <>
                  <input
                    className={styles.input}
                    placeholder="Enter Email OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                  />

                  <button className={styles.viewBtn} onClick={verifyEmailOtp}>
                    Verify Email OTP
                  </button>
                </>
              )}
            </>
          )}

          {/* FINAL VIEW PRICE */}

          {emailVerified && (
            <button
              className={styles.viewBtn}
              onClick={() => {
                if (!rcDetails || (!rcDetails.reg_no && !vehicleNumber)) {
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
          )}

          <p className={styles.terms}>
            By clicking on 'View prices', you agree to our
            <a href="#"> Privacy Policy </a>&<a href="#"> Terms of Use</a>
          </p>
        </div>
      </div>

      <PolicyExpiryDialog
        open={showExpiryDialog}
        onClose={() => setShowExpiryDialog(false)}
        onSelect={(date) => {
          setPolicyExpiryDate(date);
          setShowExpiryDialog(false);
          setShowClaimDialog(true);
        }}
      />

      <ClaimDetailDialog
        open={showClaimDialog}
        onClose={() => setShowClaimDialog(false)}
        onSelect={(answer) => {
          setShowClaimDialog(false);
          proceedToQuote(policyExpiryDate, answer);
        }}
      />
    </div>
  );
};

export default VehicleInfoDialog;
