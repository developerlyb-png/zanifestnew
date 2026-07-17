// src/pages/CommercialVehicle/CommercialVehicle6.tsx
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/commercialVehicle6.module.css";
import zunoLogo from "@/assets/CommercialVehicle/zuno.png";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useRouter } from "next/router";

const inr = (n: any) =>
  n == null || isNaN(Number(n))
    ? "--"
    : "₹ " + Math.round(Number(n)).toLocaleString("en-IN");

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  margin: "6px 0",
  border: "1px solid #d0d0d0",
  borderRadius: "6px",
  fontSize: "14px",
};
const rowStyle: React.CSSProperties = { display: "flex", gap: "10px" };
const sectionTitle: React.CSSProperties = {
  margin: "18px 0 4px",
  fontWeight: 600,
  fontSize: "15px",
};

const CommercialVehicle6: React.FC = () => {
  const router = useRouter();

  const [quote, setQuote] = useState<any>(null);
  const [ownership, setOwnership] = useState<"Ind" | "Comp">("Ind");
  const [agreed, setAgreed] = useState(true);
  const [paying, setPaying] = useState(false);

  // ---- proposer form ----
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [dob, setDob] = useState("");
  const [address1, setAddress1] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [pan, setPan] = useState("");

  // ---- nominee ----
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("Father");
  const [nomineeDob, setNomineeDob] = useState("");

  // ---- vehicle identifiers (prefilled from RC, editable) ----
  const [chassisNumber, setChassisNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");

  useEffect(() => {
    try {
      const q = localStorage.getItem("cvSelectedQuote");
      if (q && q !== "undefined") setQuote(JSON.parse(q));

      // prefill contact from the OTP login
      const user = localStorage.getItem("cvCustomer") || localStorage.getItem("user");
      if (user) {
        const u = JSON.parse(user);
        const parts = String(u.name || "").trim().split(/\s+/);
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setMobile(u.mobile || "");
        setEmail(u.email || "");
      }

      // prefill chassis/engine from RC
      const rcSaved = localStorage.getItem("cvRcDetails");
      if (rcSaved) {
        const rc = JSON.parse(rcSaved);
        setChassisNumber(rc.chassisNumber || "");
        setEngineNumber(rc.engineNumber || "");
      }
    } catch (e) {
      console.log("CV6 LOAD ERROR", e);
    }
  }, []);

  const premium = quote?.premiumDetails;

  const handlePaySecurely = async () => {
    if (!agreed) {
      alert("Please accept the Terms & Conditions to continue");
      return;
    }
    if (!quote) {
      alert("No quote found. Please get a quote again.");
      router.push("/CommercialVehicle/CommercialVehicle5");
      return;
    }
    // basic validation
    if (!firstName || !dob || !address1 || !/^\d{6}$/.test(pincode)) {
      alert("Please fill your name, date of birth, address and 6-digit pincode");
      return;
    }
    if (!nomineeName || !nomineeDob) {
      alert("Please fill nominee name and date of birth");
      return;
    }
    if (!chassisNumber || !engineNumber) {
      alert("Chassis and engine number are required");
      return;
    }

    setPaying(true);
    try {
      const quotePayload = JSON.parse(
        localStorage.getItem("cvQuotePayload") || "null"
      );
      const rcDetails = JSON.parse(
        localStorage.getItem("cvRcDetails") || "{}"
      );
      const cvVehicle = JSON.parse(
        localStorage.getItem("cvVehicle") || "{}"
      );

      const res = await fetch("/api/zuno/cv/full-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotePayload,
          quotePolicyNumber: quote.policyNumber || "",
          quoteRequestId: quote.requestId || "",
          rcDetails: {
            ...rcDetails,
            chassisNumber, // user-confirmed values win
            engineNumber,
          },
          vehicleNumber: cvVehicle.vehicleNumber || "",
          exshowroomPrice: quote.exshowroomPrice || "",
          masterFuelType: quote.masterFuelType || "",
          masterCubicCapacity: quote.masterCubicCapacity || "",
          ownershipOfTheVehicle: ownership,
          proposer: {
            firstName,
            lastName,
            gender,
            dateOfBirth: dob, // YYYY-MM-DD from date input
            address1,
            pincode,
            city,
            mobile,
            email,
            pan,
          },
          nominee: {
            name: nomineeName,
            relationship: nomineeRelation,
            dateOfBirth: nomineeDob,
          },
        }),
      });
      const result = await res.json();
      console.log("FULL QUOTE RESULT", result);

      if (!result.success) {
        alert(
          result.data?.msg ||
            result.message ||
            "Could not confirm the quote. Please retry."
        );
        return;
      }

      // Confirmed response shape: quoteNo / quoteOptionNo live inside
      // policyLevelDetails, alongside quoteStatus and policyNumber.
      const d = result.data || {};
      const pld = d.policyLevelDetails || {};
      const quoteNo = pld.quoteNo || d.quoteNo || "";
      const quoteOptNo = pld.quoteOptionNo || d.quoteOptionNo || "";
      const quoteStatus = pld.quoteStatus || "";
      const policyNumber = pld.policyNumber || "";
      const finalPremium = d.premiumDetails || null;

      if (quoteStatus === "Declined") {
        alert(
          "The insurer declined this quote" +
            (pld.decisionComment ? `: ${pld.decisionComment}` : ".") +
            " Please contact support."
        );
        return;
      }

      localStorage.setItem(
        "cvFullQuote",
        JSON.stringify({
          quoteNo,
          quoteOptNo,
          quoteStatus,
          policyNumber,
          premiumDetails: finalPremium, // FINAL premium incl. TP + PA + addons
        })
      );

      if (!quoteNo) {
        console.log("FULL QUOTE keys:", Object.keys(pld));
      }

      // NEXT MILESTONE: /online-payment-request with quoteNo/quoteOptNo
      alert("Quote confirmed! Proceeding to payment...");
      // router.push("/CommercialVehicle/payment");
    } catch (e: any) {
      console.log("PAY ERROR", e);
      alert("Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.mainContent}>
            {/* Left Section — proposal form */}
            <div className={styles.leftSection}>
              <div className={styles.headerRow}>
                <h3 className={styles.title}>Confirm your details</h3>
                <a
                  href="#"
                  className={styles.backLink}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/CommercialVehicle/CommercialVehicle5");
                  }}
                >
                  Back to Quotes
                </a>
              </div>

              <div className={styles.radioBox}>
                <p className={styles.label}>
                  Vehicle Is Owned By <span className={styles.required}>*</span>
                </p>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="owner"
                    checked={ownership === "Ind"}
                    onChange={() => setOwnership("Ind")}
                  />{" "}
                  An Individual
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="owner"
                    checked={ownership === "Comp"}
                    onChange={() => setOwnership("Comp")}
                  />{" "}
                  A Company
                </label>
              </div>

              <p style={sectionTitle}>Owner details</p>
              <div style={rowStyle}>
                <input
                  style={inputStyle}
                  placeholder="First name *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  style={inputStyle}
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div style={rowStyle}>
                <select
                  style={inputStyle}
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input
                  style={inputStyle}
                  type="date"
                  placeholder="Date of birth *"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <input
                style={inputStyle}
                placeholder="Address *"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
              />
              <div style={rowStyle}>
                <input
                  style={inputStyle}
                  placeholder="Pincode *"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) =>
                    setPincode(e.target.value.replace(/\D/g, ""))
                  }
                />
                <input
                  style={inputStyle}
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div style={rowStyle}>
                <input
                  style={inputStyle}
                  placeholder="Mobile"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                />
                <input
                  style={inputStyle}
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <input
                style={inputStyle}
                placeholder="PAN (optional)"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
              />

              <p style={sectionTitle}>Nominee details</p>
              <input
                style={inputStyle}
                placeholder="Nominee name *"
                value={nomineeName}
                onChange={(e) => setNomineeName(e.target.value)}
              />
              <div style={rowStyle}>
                <select
                  style={inputStyle}
                  value={nomineeRelation}
                  onChange={(e) => setNomineeRelation(e.target.value)}
                >
                  <option>Father</option>
                  <option>Mother</option>
                  <option>Spouse</option>
                  <option>Son</option>
                  <option>Daughter</option>
                  <option>Brother</option>
                  <option>Sister</option>
                </select>
                <input
                  style={inputStyle}
                  type="date"
                  value={nomineeDob}
                  onChange={(e) => setNomineeDob(e.target.value)}
                />
              </div>

              <p style={sectionTitle}>Vehicle identifiers</p>
              <div style={rowStyle}>
                <input
                  style={inputStyle}
                  placeholder="Chassis number *"
                  value={chassisNumber}
                  onChange={(e) =>
                    setChassisNumber(e.target.value.toUpperCase())
                  }
                />
                <input
                  style={inputStyle}
                  placeholder="Engine number *"
                  value={engineNumber}
                  onChange={(e) =>
                    setEngineNumber(e.target.value.toUpperCase())
                  }
                />
              </div>
            </div>

            {/* Right Section — plan summary */}
            <div className={styles.rightSection}>
              <h4 className={styles.planSummaryTitle}>Your Plan Summary</h4>

              <div className={styles.planSummary}>
                <div className={styles.planHeader}>
                  <Image
                    src={zunoLogo}
                    alt="Zuno General Insurance"
                    className={styles.logo}
                    width={110}
                    height={60}
                  />
                  <span className={styles.planType}>Plan Type</span>
                  <span className={styles.planName}>Package Policy</span>
                </div>

                <div className={styles.priceDetails}>
                  <div className={styles.priceRow}>
                    <span>Premium Amount</span>
                    <span>{inr(premium?.netTotalPremium)}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span>GST@18%</span>
                    <span>+ {inr(premium?.gst)}</span>
                  </div>
                </div>

                <div className={styles.totalPay}>
                  <span>You'll Pay</span>
                  <span className={styles.totalAmount}>
                    {inr(premium?.grossTotalPremium)}
                  </span>
                </div>

                <button
                  className={styles.payBtn}
                  onClick={handlePaySecurely}
                  disabled={paying || !quote}
                >
                  {paying ? "PROCESSING..." : "PAY SECURELY"}
                </button>

                <div className={styles.terms}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />{" "}
                  I agree to the <a href="#">Terms &amp; Conditions</a> &amp;
                  confirm that my vehicle has a valid PUC certificate.
                </div>

                <div className={styles.nextStep}>
                  <span className={styles.stepTag}>Note:</span>
                  <p>
                    The final premium is confirmed at this step and may differ
                    slightly from the estimate based on your exact details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CommercialVehicle6;
