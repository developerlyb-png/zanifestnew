
import React, { useState, useEffect } from "react";
import styles from "@/styles/pages/cart/carinsurancecart.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";
import { FaRegFileVideo } from "react-icons/fa";
import { useRouter } from "next/router";

const carinsurancecart = () => {
  const [owner, setOwner] = useState("individual");
  const [hasCng, setHasCng] = useState("no");
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Real data
  const [plan, setPlan] = useState<any>(null);
  const [quoteInput, setQuoteInput] = useState<any>(null);
  const [rc, setRc] = useState<any>(null);

  // Customer form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("Male");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address1, setAddress1] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [pan, setPan] = useState("");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("Brother");
  const [nomineeDob, setNomineeDob] = useState("");

  const router = useRouter();

  useEffect(() => {
    try {
      const p = localStorage.getItem("selectedQuote");
      const q = localStorage.getItem("carQuoteInput");
      const r = localStorage.getItem("carRcDetails");
      if (p && p !== "undefined") setPlan(JSON.parse(p));
      if (q && q !== "undefined") setQuoteInput(JSON.parse(q));
      if (r && r !== "undefined") setRc(JSON.parse(r));

      const u = localStorage.getItem("user");
      if (u && u !== "undefined") {
        const user = JSON.parse(u);
        const parts = String(user.name || "").split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setMobile(user.mobile || "");
        setEmail(user.email || "");
      }
    } catch (e) {
      console.log("CART LOAD ERROR", e);
    }
  }, []);

  const inr = (n: any) =>
    n == null ? "--" : "₹" + Math.round(Number(n)).toLocaleString("en-IN");

  const handlePay = async () => {
    try {
      // ================= VALIDATIONS =================
      if (!isChecked) {
        alert("Please accept terms & conditions");
        return;
      }
      if (
        !firstName ||
        !dob ||
        !mobile ||
        !email ||
        !address1 ||
        !pincode ||
        !city
      ) {
        alert("Please fill all personal details");
        return;
      }
      if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        alert("Please enter a valid PAN number");
        return;
      }
      if (!nomineeName || !nomineeDob) {
        alert("Please fill nominee details");
        return;
      }
      if (!quoteInput || !rc) {
        alert("Quote data missing — please get a quote again");
        return;
      }

      setLoading(true);

      const age = String(
        new Date().getFullYear() - new Date(dob).getFullYear()
      );
      const nomineeAge = String(
        new Date().getFullYear() - new Date(nomineeDob).getFullYear()
      );

      // ================= FULL QUOTE =================
      const res = await fetch("/api/zuno/4w/full-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteInput,
          rc,
          transmissionType: "Manual",
          customer: {
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`.trim(),
            gender,
            dateOfBirth: dob,
            age,
            mobile,
            email,
            addressLine1: address1,
            addressLine2: city,
            pincode,
            city,
            occupation: "Salaried",
            nomineeName,
            nomineeRelation,
            nomineeDob,
            nomineeAge,
          },
        }),
      });

      const result = await res.json();
      console.log("FULLQUOTE RESULT >>>", JSON.stringify(result, null, 2));

      if (!res.ok || !result.success) {
        setLoading(false);
        alert("Full Quote Failed — check console");
        return;
      }

      // ================= EXTRACT QUOTE NUMBERS =================
      const fullQuote = result.data;
      const quoteNo =
        fullQuote.quoteNo ||
        fullQuote.policyData?.quoteNo ||
        fullQuote.policyLevelDetails?.quoteNo;
      const quoteOptionNo =
        fullQuote.quoteOptionNo ||
        fullQuote.policyData?.quoteOptionNo ||
        fullQuote.policyLevelDetails?.quoteOptionNo;

      console.log("QUOTE NUMBERS >>>", { quoteNo, quoteOptionNo });

      if (!quoteNo || !quoteOptionNo) {
        setLoading(false);
        alert("Quote numbers missing — check console for response shape");
        return;
      }

      localStorage.setItem(
        "carFullQuote",
        JSON.stringify({ quoteNo, quoteOptionNo, raw: fullQuote })
      );

      // ================= KYC (SIGNZY) =================
      const kycRes = await fetch("/api/zuno/4w/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            fullName: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            pan,
            dateOfBirth: dob,
            gender,
            mobile,
            email,
          },
        }),
      });

      const kycData = await kycRes.json();
      console.log("SIGNZY KYC RESULT >>>", JSON.stringify(kycData, null, 2));

      if (!kycRes.ok || !kycData.success) {
        setLoading(false);
        alert("KYC request failed — check console");
        return;
      }

      // Signzy response can be nested — cover common shapes
      const kycBody = kycData.data?.result || kycData.data?.data || kycData.data || {};

      // Signzy verification status — different field names possible across responses
      const kycStatus =
        kycBody.kycStatus ??
        kycBody.status ??
        kycBody.KYC_Status ??
        kycBody.verificationStatus;

      const isVerified =
        kycStatus === true ||
        String(kycStatus).toUpperCase() === "SUCCESS" ||
        String(kycStatus).toUpperCase() === "VERIFIED" ||
        String(kycStatus).toUpperCase() === "COMPLETED";

      if (!isVerified) {
        console.log(
          "SIGNZY KYC NOT VERIFIED — status:",
          kycStatus,
          "| Proceeding with reference for UAT; issuance will decide."
        );
        // PRODUCTION TODO: if not verified, hit /api/zuno/4w/kyc-url to get a
        // web KYC URL (Signzy /create-url) and redirect user to complete KYC.
      }

      // Signzy reference number — try all common keys
      const kycNo =
        kycBody.kycReferenceNumber ||
        kycBody.kycRefNo ||
        kycBody.kycId ||
        kycBody.referenceId ||
        kycBody.leadId ||
        kycBody.IC_Unique_ID ||
        null;

      console.log("SIGNZY KYC REFERENCE >>>", kycNo);

      if (!kycNo) {
        setLoading(false);
        alert("KYC reference number missing — check console");
        return;
      }

      // ================= ISSUE POLICY =================
      const issueRes = await fetch("/api/zuno/4w/issue-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteNo, quoteOptionNo, kycNo }),
      });

      const issueData = await issueRes.json();
      console.log("ISSUE RESULT >>>", JSON.stringify(issueData, null, 2));

      setLoading(false);

      if (!issueRes.ok || !issueData.success) {
        alert("Policy issuance failed — check console");
        return;
      }

      localStorage.setItem("issuedCarPolicy", JSON.stringify(issueData.data));
      alert("Policy issued successfully! Check console for policy number.");
      // TODO: router.push to a 4W success page (NOT /payment-success — that's the 2W page)
    } catch (e: any) {
      setLoading(false);
      console.log("PAY ERROR", e);
      alert("Something went wrong: " + e?.message);
    }
  };

  return (
    <div>
      <UserDetails />
      <Navbar />
      <div className={styles.container}>
        <div className={styles.summary}>
          <h3 className={styles.pageTitle}>Summary</h3>
        </div>
        <div className={styles.main}>
          <div className={styles.left}>
            <div className={styles.card}>
              <h4 className={styles.sectionTitle}>Confirm & Pay</h4>
              <div className={styles.optionGroup}>
                <p>Car is owned by</p>
                <label>
                  <input
                    type="radio"
                    checked={owner === "company"}
                    onChange={() => setOwner("company")}
                  />
                  A Company
                </label>
                <label>
                  <input
                    type="radio"
                    checked={owner === "individual"}
                    onChange={() => setOwner("individual")}
                  />
                  An Individual
                </label>
                <p className={styles.note}>
                  <FaRegFileVideo />
                  Car video inspection required. Details will be shared after
                  payment.
                </p>
              </div>
              <div className={styles.optionGroup}>
                <p>Car has external CNG/LPG kit?</p>
                <label>
                  <input
                    type="radio"
                    checked={hasCng === "yes"}
                    onChange={() => setHasCng("yes")}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    checked={hasCng === "no"}
                    onChange={() => setHasCng("no")}
                  />
                  No
                </label>
              </div>
            </div>

            {/* Car Details — REAL */}
            <div className={styles.card1}>
              <h3>Car Details</h3>
              <p className={styles.carTitle}>
                {quoteInput
                  ? `${quoteInput.make} ${quoteInput.model} ${quoteInput.variant}`
                  : "--"}
              </p>
              <p className={styles.carSubText}>
                {quoteInput
                  ? `${quoteInput.fuelType} - ${
                      quoteInput.registrationDate?.slice(0, 4) || ""
                    } - ${rc?.reg_no || ""}`
                  : "--"}
              </p>
            </div>

            {/* Customer details form */}
            <div className={styles.card1}>
              <h3>Your Details</h3>
              <input
                className={styles.input || ""}
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className={styles.input || ""}
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <label style={{ display: "block", marginTop: 8 }}>
                Gender
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option>M</option>
                  <option>F</option>
                </select>
              </label>
              <label style={{ display: "block", marginTop: 8 }}>
                Date of Birth
                <input
                  className={styles.input || ""}
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </label>
              <input
                className={styles.input || ""}
                placeholder="Mobile"
                maxLength={10}
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/\D/g, ""))
                }
              />
              <input
                className={styles.input || ""}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className={styles.input || ""}
                placeholder="Address"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
              />
              <input
                className={styles.input || ""}
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                className={styles.input || ""}
                placeholder="Pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) =>
                  setPincode(e.target.value.replace(/\D/g, ""))
                }
              />
              <input
                className={styles.input || ""}
                placeholder="PAN Number (e.g. ABCDE1234F)"
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
              />

              <h3>Nominee</h3>
              <input
                className={styles.input || ""}
                placeholder="Nominee name"
                value={nomineeName}
                onChange={(e) => setNomineeName(e.target.value)}
              />
              <label style={{ display: "block", marginTop: 8 }}>
                Nominee Relation
                <select
                  value={nomineeRelation}
                  onChange={(e) => setNomineeRelation(e.target.value)}
                >
                  <option>Brother</option>
                  <option>Sister</option>
                  <option>Father</option>
                  <option>Mother</option>
                  <option>Spouse</option>
                  <option>Son</option>
                  <option>Daughter</option>
                </select>
              </label>
              <label style={{ display: "block", marginTop: 8 }}>
                Nominee Date of Birth
                <input
                  className={styles.input || ""}
                  type="date"
                  value={nomineeDob}
                  onChange={(e) => setNomineeDob(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.summaryCard}>
              <h2 className={styles.heading}>Plan Summary</h2>
              <div className={styles.row}>
                <span>IDV Cover</span>
                <span>{inr(plan?.idv)}</span>
              </div>
              <div className={styles.row}>
                <span>Insurer</span>
                <span>Zuno General Insurance</span>
              </div>
              <button className={styles.viewBtn}>View Inclusions</button>
              <hr />
              <div className={styles.row}>
                <span>Premium Amount</span>
                <span>{inr(plan?.netPremium)}</span>
              </div>
              <div className={styles.row}>
                <span>GST @18%</span>
                <span>+ {inr(plan?.gst)}</span>
              </div>
              <div className={styles.totalBox}>
                <p className={styles.youPay}>You'll Pay</p>
                <p className={styles.priceBig}>{inr(plan?.grossPremium)}</p>
              </div>
              <button
                className={styles.payBtn}
                onClick={handlePay}
                disabled={loading}
              >
                {loading ? "PROCESSING..." : "PAY SECURELY →"}
              </button>
              <div className={styles.terms}>
                <label>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => setIsChecked(!isChecked)}
                  />
                  I agree to the <span>terms & conditions</span>
                </label>
              </div>
              <div className={styles.nextStep}>
                <strong>Next step</strong>
                <p>
                  After payment, we'll complete your KYC and issue your policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default carinsurancecart;
