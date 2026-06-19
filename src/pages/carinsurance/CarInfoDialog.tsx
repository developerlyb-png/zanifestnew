"use client";

import React, { useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/VehicleInfoDialog.module.css";

import { FiEdit2, FiMapPin, FiX } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { BsCalendarDate, BsFuelPumpDiesel } from "react-icons/bs";
import { GiGearStickPattern } from "react-icons/gi";

import { useRouter } from "next/navigation";

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

  onUpdateData: (data: any) => void;
}

const VehicleInfoDialog: React.FC<VehicleInfoDialogProps> = ({
  onClose,

  onChooseBrand,

  onChooseModel,

  onChooseFuelVariant,

  onChooseYear,

  oncommercialvehicle1,

  vehicleNumber,

  selectedBrand,

  selectedModel,

  selectedVariant,

  selectedFuel,

  selectedYear,

  selectedLocation,
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

  const sendMobileOtp = async () => {
    if (mobile.length !== 14) {
      alert("Enter valid mobile number");

      return;
    }

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

  const verifyEmailOtp = async () => {
    const res = await fetch(
      "/api/auth/verify-email-otp",

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),

          otp: emailOtp,
        }),
      },
    );

    const data = await res.json();

    console.log(
      "EMAIL VERIFY RESPONSE",

      data,
    );

    if (res.ok && data.success) {
      setEmailVerified(true);

      alert("Email Verified");
    } else {
      alert(data.message || "Wrong Email OTP");
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
                  : vehicleNumber.substring(0, 4)}
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
          <h3 className={styles.heading}>Almost done! Just one last step</h3>

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

          {mobile.length === 14 && !mobileOtpSent && !mobileVerified && (
            <button className={styles.viewBtn} onClick={sendMobileOtp}>
              Send OTP
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

              {!emailOtpSent && !emailVerified && (
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

onClick={async()=>{


const payload={

registrationNumber:vehicleNumber,

brand:selectedBrand,

model:selectedModel,

variant:selectedVariant,

fuel:selectedFuel,

manufacturingYear:selectedYear

};


console.log(
"SBI PAYLOAD",
payload
);


const res = await fetch(
"/api/sbi/4w/full-quote",
{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify(payload)

}

);


const data =
await res.json();


console.log(
"SBI QUOTE RESPONSE",
data
);


// after quote success

router.push(
"/carinsurance/carinsurance3"
);


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
    </div>
  );
};

export default VehicleInfoDialog;
