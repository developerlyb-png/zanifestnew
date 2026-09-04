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
  const [loadingStep, setLoadingStep] = useState("");

  // Real data
  const [plan, setPlan] = useState<any>(null);
  const [quoteInput, setQuoteInput] = useState<any>(null);
  const [rc, setRc] = useState<any>(null);

  // Which insurer's card the customer clicked "Buy" on — set by
  // carinsurance3.tsx right before navigating here. Zuno and SBI have
  // completely different checkout backends (FullQuote/Razorpay/Issuance for
  // SBI vs Zuno's own full-quote/issue-policy/payment-link APIs).
  const [insurer, setInsurer] = useState<"ZUNO" | "SBI">("ZUNO");
  const [sbiQuote, setSbiQuote] = useState<any>(null);
  const [sbiCkyc, setSbiCkyc] = useState<any>(null);

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

      const sel = localStorage.getItem("selectedInsurer");
      let sbiCkycParsed: any = null;
      if (sel === "SBI") {
        setInsurer("SBI");
        const sq = localStorage.getItem("selectedQuoteSbi");
        if (sq && sq !== "undefined") setSbiQuote(JSON.parse(sq));
        const ck = localStorage.getItem("sbiCkycResult");
        if (ck && ck !== "undefined") {
          sbiCkycParsed = JSON.parse(ck);
          setSbiCkyc(sbiCkycParsed);
        }
      }

      // SBI already verified identity via CKYC (OTP or manual OVD) — use
      // that record instead of asking the customer to type it all again.
      const ckycRecord = sbiCkycParsed?.record;
      if (sel === "SBI" && ckycRecord?.fullName) {
        const parts = String(ckycRecord.fullName).trim().split(/\s+/);
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setGender(ckycRecord.gender === "F" ? "Female" : "Male");
        if (ckycRecord.dob) setDob(ckycRecord.dob.length === 10 && ckycRecord.dob.includes("-") ? ckycRecord.dob : "");
        setMobile(ckycRecord.mobile || "");
        setEmail(ckycRecord.email || "");
        setAddress1(ckycRecord.correspondenceAddress?.line1 || "");
        setCity(ckycRecord.correspondenceAddress?.city || "");
        setPincode(ckycRecord.correspondenceAddress?.pincode || "");
      } else {
        const u = localStorage.getItem("user");
        if (u && u !== "undefined") {
          const user = JSON.parse(u);
          const parts = String(user.name || "").split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
          setMobile(user.mobile || "");
          setEmail(user.email || "");
        }
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

      // ================= STEP 1: FULL QUOTE =================
      setLoadingStep("Creating quote...");
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

      // ================= STEP 2: KYC — SKIPPED (TESTING MODE) =================
      // No KYC API call. Use the stored KYC request number and send it
      // as VISoF_KYC_Req_No (override field via localStorage carKycField).
      const kycNo = localStorage.getItem("carApprovedKycNo") || "";
      const kycField =
        localStorage.getItem("carKycField") || "VISoF_KYC_Req_No";
      const kycVerified = false;
      console.log("KYC (stored) >>>", kycField, "=", kycNo || "(none)");

      if (!kycNo) {
        setLoading(false);
        alert("Set localStorage carApprovedKycNo first (zuno-... number)");
        return;
      }

      // Persist everything before issuing
      localStorage.setItem(
        "carFullQuote",
        JSON.stringify({
          quoteNo,
          quoteOptionNo,
          kycNo,
          zunoKycNo: kycNo,
          kycVerified,
          fullQuote,
          quoteInput,
          rc,
          customer: {
            firstName,
            lastName,
            gender,
            dob,
            mobile,
            email,
            address1,
            city,
            pincode,
            nomineeName,
            nomineeRelation,
            nomineeDob,
            pan,
          },
        })
      );

      // ================= STEP 3: ISSUE POLICY (no KYC redirect) =================
      setLoadingStep("Issuing policy...");
      const issueRes = await fetch("/api/zuno/4w/issue-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteNo,
          quoteOptionNo,
          kycNo,
          kycField, // "VISoF_KYC_Req_No" (default) or "IC_KYC_No"
        }),
      });

      const issueData = await issueRes.json();
      console.log(
        "ISSUE POLICY RESPONSE >>>",
        JSON.stringify(issueData, null, 2)
      );

      if (!issueRes.ok || !issueData.success) {
        setLoading(false);
        alert("Issue Policy failed — check console for the raw response");
        return;
      }

      // Extract policy number — real Zuno shape:
      // issuePolicyObject.issuepolicy.policynrTt
      const issued = issueData.data || {};
      const ip = issued.issuePolicyObject?.issuepolicy || {};
      const policyNo =
        ip.policynrTt ||
        issued.policyNo ||
        issued.policyNumber ||
        "";

      console.log("POLICY NO >>>", policyNo);

      localStorage.setItem(
        "carPolicyResult",
        JSON.stringify({
          policyNo,
          quoteNo,
          quoteOptionNo,
          amount: plan?.grossPremium,
          insurer: "ZUNO",
          customerName: `${firstName} ${lastName}`.trim(),
          raw: issued,
        })
      );

      // Persist the issued policy against the logged-in user so it shows
      // up in their dashboard — best-effort, never blocks checkout.
      fetch("/api/users/save-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyNumber: policyNo,
          premium: plan?.netPremium ?? plan?.grossPremium,
          grossPremium: plan?.grossPremium,
          transactionType: quoteInput?.isNew ? "New" : "Rollover",
          insurer: "Zuno General Insurance",
          vehicle: {
            number: rc?.reg_no,
            make: quoteInput?.make,
            model: quoteInput?.model,
          },
          customer: {
            fullName: `${firstName} ${lastName}`.trim(),
            email,
            mobile,
          },
        }),
      }).catch((e) => console.log("SAVE POLICY ERROR", e));

      // ================= STEP 4: PAYMENT LINK =================
      setLoadingStep("Creating payment link...");
      const payRes = await fetch("/api/sbi/2w/online-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: policyNo || `TXN${Date.now()}`,
          amount: plan?.grossPremium,
          customer: {
            fullName: `${firstName} ${lastName}`.trim(),
            email,
            mobile,
          },
        }),
      });

      const payData = await payRes.json();
      console.log("PAYMENT RESPONSE >>>", JSON.stringify(payData, null, 2));

      // Try common locations for the hosted payment link
      const pd = payData.data?.data || payData.data || {};
      const payLink =
        pd.paymentLink ||
        pd.payment_url ||
        pd.paymentUrl ||
        pd.link ||
        pd.url ||
        pd.shortUrl ||
        pd.redirectUrl ||
        "";

      console.log("PAYMENT LINK >>>", payLink);

      localStorage.setItem(
        "carPaymentResult",
        JSON.stringify({ payLink, raw: payData })
      );

      setLoading(false);

      if (payRes.ok && payData.success && payLink) {
        // Hand off to Zuno's hosted payment page
        window.location.href = payLink;
        return;
      }

      // Payment link failed — policy is issued though, so land on
      // the success page which will show the failure state
      alert("Payment link failed — check console (policy IS issued)");
      router.push("/cart/car-policy-success");
    } catch (e: any) {
      setLoading(false);
      console.log("PAY ERROR", e);
      alert("Something went wrong: " + e?.message);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // SBI's checkout chain: FullQuote (real proposer + CKYC tags) -> Razorpay
  // order -> Razorpay Checkout -> signature verify -> Issuance. Completely
  // separate from Zuno's handlePay above since SBI has its own APIs end to end.
  const handlePaySbi = async () => {
    try {
      if (!isChecked) {
        alert("Please accept terms & conditions");
        return;
      }
      if (!firstName || !lastName || !dob || !mobile || !email || !address1 || !pincode || !city) {
        alert("Please fill all personal details");
        return;
      }
      if (!quoteInput || !rc) {
        alert("Quote data missing — please get a quote again");
        return;
      }
      if (!sbiCkyc?.ckycTagsForFullQuote) {
        alert("KYC verification is required before purchasing SBI's policy — please go back and complete it");
        return;
      }
      if (!nomineeName || !nomineeDob) {
        alert("Please fill nominee details");
        return;
      }

      setLoading(true);

      setLoadingStep("Creating quote...");
      const customer = {
        firstName,
        lastName,
        gender: gender.toUpperCase().startsWith("F") ? "F" : "M",
        dob,
        mobile,
        email,
        addressLine1: address1,
        city,
        pincode,
      };

      const includedCodes = (sbiQuote?.response?.coverages || []).map((c: any) => c.code);
      const excludeAddonCodes = (sbiQuote?.response?.availableAddonCodes || []).filter(
        (c: string) => !includedCodes.includes(c)
      );

      const nomineeAge = String(
        new Date().getFullYear() - new Date(nomineeDob).getFullYear()
      );

      const fqRes = await fetch("/api/sbi/4w/full-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quoteInput,
          customer,
          ckycTags: sbiCkyc.ckycTagsForFullQuote,
          ckycRecord: sbiCkyc.record,
          overrideIdv: sbiQuote?.response?.idv?.user,
          excludeAddonCodes,
          nominee: { name: nomineeName, dob: nomineeDob, age: nomineeAge },
        }),
      });
      const fqData = await fqRes.json();
      console.log("SBI FULLQUOTE RESULT >>>", JSON.stringify(fqData, null, 2));

      if (!fqRes.ok || !fqData.success) {
        setLoading(false);
        alert(fqData.message || "SBI Full Quote failed — check console");
        return;
      }

      const quotationNo = fqData.quotationNo;
      const amount = fqData.premium;
      localStorage.setItem("sbiFullQuote", JSON.stringify(fqData));

      setLoadingStep("Creating payment order...");
      const orderRes = await fetch("/api/sbi/4w/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountInRupees: amount, quotationNo }),
      });
      const orderData = await orderRes.json();
      console.log("RAZORPAY ORDER RESULT >>>", orderData);

      if (!orderRes.ok || !orderData.success) {
        setLoading(false);
        alert(orderData.message || "Could not create payment order — check console");
        return;
      }

      setLoadingStep("Opening payment...");
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setLoading(false);
        alert("Could not load the payment gateway — check your connection");
        return;
      }

      const fullName = `${firstName} ${lastName}`.trim();
      const rzp = new (window as any).Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "Zanifest Insurance",
        description: "SBI General Car Insurance Premium",
        prefill: { name: fullName, email, contact: mobile },
        handler: async (response: any) => {
          await finishSbiPurchase(response, quotationNo, amount, fullName);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setLoadingStep("");
          },
        },
      });
      rzp.open();
    } catch (e: any) {
      setLoading(false);
      console.log("SBI PAY ERROR", e);
      alert("Something went wrong: " + e?.message);
    }
  };

  const finishSbiPurchase = async (
    razorpayResponse: any,
    quotationNo: string,
    amount: number,
    payerName: string
  ) => {
    try {
      setLoadingStep("Verifying payment...");
      const verifyRes = await fetch("/api/sbi/4w/razorpay-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
        }),
      });
      const verifyData = await verifyRes.json();
      console.log("RAZORPAY VERIFY RESULT >>>", verifyData);

      if (!verifyRes.ok || !verifyData.success) {
        setLoading(false);
        alert(verifyData.message || "Payment verification failed — check console");
        return;
      }

      setLoadingStep("Issuing policy...");
      const issueRes = await fetch("/api/sbi/4w/issuequote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationNo,
          amount,
          payerName,
          paymentReferenceNo: verifyData.paymentId,
          ckycTags: sbiCkyc?.ckycTagsForFullQuote,
        }),
      });
      const issueData = await issueRes.json();
      console.log("SBI ISSUANCE RESULT >>>", issueData);
      setLoading(false);

      if (!issueRes.ok || !issueData.success) {
        alert(issueData.message || "SBI Issuance failed — payment IS captured, check console");
        return;
      }

      localStorage.setItem(
        "carPolicyResult",
        JSON.stringify({
          policyNo: issueData.policyNo,
          quotationNo,
          amount,
          insurer: "SBI",
          customerName: payerName,
          raw: issueData,
        })
      );

      fetch("/api/users/save-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyNumber: issueData.policyNo,
          premium: amount,
          grossPremium: amount,
          transactionType: "New",
          insurer: "SBI General Insurance",
          vehicle: { number: rc?.reg_no, make: quoteInput?.make, model: quoteInput?.model },
          customer: { fullName: payerName, email, mobile },
        }),
      }).catch((e) => console.log("SAVE POLICY ERROR", e));

      router.push("/cart/car-policy-success");
    } catch (e: any) {
      setLoading(false);
      console.log("SBI FINISH PURCHASE ERROR", e);
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

            {/* Customer details — SBI already collected & verified this via
                CKYC (OTP or manual OVD), so re-asking would be redundant;
                Zuno has no such step, so it still needs the full form. */}
            <div className={styles.card1}>
              {insurer === "SBI" ? (
                <>
                  <h3>Your Details</h3>
                  <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
                    Verified via KYC — no need to re-enter these.
                  </p>
                  <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                    <div>
                      <strong>{`${firstName} ${lastName}`.trim() || "--"}</strong>
                    </div>
                    <div>{dob || "--"} • {gender}</div>
                    <div>{mobile || "--"} · {email || "--"}</div>
                    <div>
                      {[address1, city, pincode].filter(Boolean).join(", ") || "--"}
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}

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
                <span>{inr(insurer === "SBI" ? sbiQuote?.response?.idv?.user : plan?.idv)}</span>
              </div>
              <div className={styles.row}>
                <span>Insurer</span>
                <span>{insurer === "SBI" ? "SBI General Insurance" : "Zuno General Insurance"}</span>
              </div>
              <button className={styles.viewBtn}>View Inclusions</button>
              <hr />
              <div className={styles.row}>
                <span>Premium Amount</span>
                <span>
                  {inr(insurer === "SBI" ? sbiQuote?.response?.beforeVatPremium : plan?.netPremium)}
                </span>
              </div>
              <div className={styles.row}>
                <span>GST @18%</span>
                <span>+ {inr(insurer === "SBI" ? sbiQuote?.response?.gst : plan?.gst)}</span>
              </div>
              <div className={styles.totalBox}>
                <p className={styles.youPay}>You'll Pay</p>
                <p className={styles.priceBig}>
                  {inr(insurer === "SBI" ? sbiQuote?.response?.premium : plan?.grossPremium)}
                </p>
              </div>
              <button
                className={styles.payBtn}
                onClick={insurer === "SBI" ? handlePaySbi : handlePay}
                disabled={loading}
              >
                {loading ? loadingStep || "PROCESSING..." : "PAY SECURELY →"}
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