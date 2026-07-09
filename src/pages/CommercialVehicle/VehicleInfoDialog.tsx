"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/VehicleInfoDialog.module.css";
import { FiEdit2, FiMapPin } from "react-icons/fi";
import { FaTruck, FaCar } from "react-icons/fa";
import { BsCalendarDate } from "react-icons/bs";
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
  onChooseRto: () => void; // opens RtoDialog for editing
  vehicleNumber: string;
  selectedVehicle: string | null;
  selectedBrand: string | null;
  selectedModel: string | null;
  selectedVariant: string | null;
  selectedYear: number | null;
  selectedRto: any;
  onUpdateData: (data: any) => void;
}

const VehicleInfoDialog: React.FC<VehicleInfoDialogProps> = ({
  onChooseVehicle,
  onChooseBrand,
  onChooseModel,
  onChooseFuelVariant,
  onChooseYear,
  onChooseRto,
  oncommercialvehicle1,
  vehicleNumber,
  selectedVehicle,
  selectedBrand,
  selectedModel,
  selectedVariant,
  selectedYear,
  selectedRto,
}) => {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [showMobileOtp, setShowMobileOtp] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      setLoggedUser(parsed);
      setFullName(parsed.name || "");
      setEmail(parsed.email || "");
      setMobile("+91 " + parsed.mobile);
    }
  }, []);

  // Safe RTO display text (never renders a bare " - ")
  const rtoText = (() => {
    const location =
      selectedRto?.rtoLocationName || selectedRto?.rtolocation || "";
    const city =
      selectedRto?.rtoCityOrDistrict || selectedRto?.rtocityordistrict || "";
    if (!location && !city) return "Select RTO";
    if (location && city && location !== city)
      return `${location} - ${city}`;
    return location || city;
  })();

  // Don't allow "View Prices" without a complete RTO — prevents the
  // quick-quote 500 crash on missing idvCity
  const canViewPrices = Boolean(
    selectedRto && (selectedRto.idvCity || selectedRto.idvcity)
  );

  const goToPrices = () => {
    if (!canViewPrices) {
      alert("Please select your RTO first");
      onChooseRto();
      return;
    }
    router.push("/CommercialVehicle/CommercialVehicle5");
  };

  // NAME FORMAT
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
    setFullName(value);
  };

  // MOBILE FORMAT
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prefix = "+91 ";
    let input = e.target.value;
    if (!input.startsWith(prefix)) {
      input = prefix;
    }
    const digits = input
      .substring(prefix.length)
      .replace(/\D/g, "")
      .slice(0, 10);
    setMobile(prefix + digits);
  };

  // =====================
  // SEND MOBILE OTP (DUMMY)
  // =====================
  const sendMobileOtp = async () => {
    const phone = mobile.replace(/\D/g, "").replace(/^91/, "");
    if (phone.length !== 10) {
      alert("Enter valid mobile number");
      return;
    }
    setTimeout(() => {
      setShowMobileOtp(true);
      console.log("DUMMY OTP : 123456");
      alert("OTP sent on WhatsApp");
    }, 500);
  };

  // =====================
  // VERIFY MOBILE OTP (DUMMY)
  // =====================
  const verifyMobileOtp = async () => {
    if (mobileOtp !== "123456") {
      alert("Invalid OTP");
      return;
    }
    setMobileVerified(true);
    alert("Mobile Verified");
  };

  // SEND EMAIL OTP
  const sendEmailOtp = async () => {
    if (!email) {
      alert("Enter email");
      return;
    }
    const res = await fetch("/api/auth/send-email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        mobile: mobile.replace("+91 ", ""),
      }),
    });
    const data = await res.json();
    console.log("EMAIL OTP RESPONSE", data);
    if (data.success) {
      setShowEmailOtp(true);
      alert("Email OTP sent");
    } else {
      alert(data.message);
    }
  };

  // VERIFY EMAIL OTP
  const verifyEmailOtp = async () => {
    const res = await fetch("/api/auth/verify-email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: emailOtp }),
    });
    const data = await res.json();

    if (data.success) {
      // UPDATE USER EMAIL IN DB
      await fetch("/api/auth/dummy-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: mobile.replace(/\D/g, "").replace(/^91/, ""),
          fullName,
          email,
        }),
      });

      // SAVE LOCAL DATA
      const userData = {
        name: fullName,
        email,
        mobile: mobile.replace(/\D/g, "").replace(/^91/, ""),
      };
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("cvCustomer", JSON.stringify(userData));
      window.dispatchEvent(new Event("userLogin"));

      // Guarded navigation — needs RTO before prices
      goToPrices();
    } else {
      alert("Invalid Email OTP");
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* LEFT */}
        <div className={styles.left}>
          <h3 className={styles.heading}>✅ We have found your vehicle</h3>

          <div className={styles.infoBox}>
            <div className={styles.item}>
              <FiMapPin className={styles.icon} />
              <span>{vehicleNumber}</span>
              <FiEdit2
                className={styles.editIcon}
                onClick={oncommercialvehicle1}
              />
            </div>

            <div className={styles.item}>
              <FaTruck className={styles.icon} />
              <span>{selectedVehicle}</span>
              <FiEdit2 className={styles.editIcon} onClick={onChooseVehicle} />
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
              <GiGearStickPattern className={styles.icon} />
              <span>{selectedVariant}</span>
              <FiEdit2
                className={styles.editIcon}
                onClick={onChooseFuelVariant}
              />
            </div>

            <div className={styles.item}>
              <BsCalendarDate className={styles.icon} />
              <span>{selectedYear}</span>
              <FiEdit2 className={styles.editIcon} onClick={onChooseYear} />
            </div>

            {/* RTO row — safe text + editable */}
            <div className={styles.item}>
              <FiMapPin className={styles.icon} />
              <span>{rtoText}</span>
              <FiEdit2 className={styles.editIcon} onClick={onChooseRto} />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.right}>
          {loggedUser ? (
            <>
              <h3 className={styles.heading}>Welcome {loggedUser.name}</h3>
              <button className={styles.viewBtn} onClick={goToPrices}>
                View Prices
              </button>
            </>
          ) : (
            <>
              <h3 className={styles.heading}>
                Almost done! Just one last step
              </h3>

              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={handleFullNameChange}
                className={styles.input}
              />

              <input
                type="tel"
                placeholder="Mobile number"
                value={mobile}
                onChange={handleMobileChange}
                className={styles.input}
              />

              {/* MOBILE FLOW */}
              {!mobileVerified && (
                <>
                  {showMobileOtp && (
                    <input
                      placeholder="Enter Mobile OTP"
                      value={mobileOtp}
                      onChange={(e) => setMobileOtp(e.target.value)}
                      className={styles.input}
                    />
                  )}
                  <button
                    className={styles.viewBtn}
                    onClick={() => {
                      if (!fullName) {
                        alert("Enter name");
                        return;
                      }
                      if (mobile.length !== 14) {
                        alert("Enter valid mobile");
                        return;
                      }
                      if (!showMobileOtp) {
                        sendMobileOtp();
                      } else {
                        verifyMobileOtp();
                      }
                    }}
                  >
                    {showMobileOtp ? "Verify OTP" : "Send OTP"}
                  </button>
                </>
              )}

              {/* EMAIL FLOW */}
              {mobileVerified && (
                <>
                  <input
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                  />
                  {showEmailOtp && (
                    <input
                      placeholder="Enter Email OTP"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      className={styles.input}
                    />
                  )}
                  <button
                    className={styles.viewBtn}
                    onClick={() => {
                      if (!showEmailOtp) {
                        sendEmailOtp();
                      } else {
                        verifyEmailOtp();
                      }
                    }}
                  >
                    {showEmailOtp ? "View Prices" : "Send Email OTP"}
                  </button>
                </>
              )}
            </>
          )}

          <p className={styles.terms}>
            By clicking on 'View prices', you agree to our{" "}
            <a href="#">Privacy Policy</a> &<a href="#"> Terms of Use</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VehicleInfoDialog;