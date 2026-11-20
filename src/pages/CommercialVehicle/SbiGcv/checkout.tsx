// src/pages/CommercialVehicle/SbiGcv/checkout.tsx
// SBI General — GCV (goods carrying vehicle) checkout:
//   CKYC (shared SBI dialog) -> FullQuote -> Razorpay -> Issuance -> success.
// The quote picked on CommercialVehicle5 arrives via localStorage
// (SBI_GCV_STORAGE_KEY), including SBI's resolved variantId.
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "@/styles/pages/CommercialVehicle/commercialVehicle6.module.css";
import sbiLogo from "@/assets/CommercialVehicle/sbi.png";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import CkycDialog, { CkycResult } from "@/pages/carinsurance/CkycDialog";
import { SBI_GCV_STORAGE_KEY, SBI_GCV_POLICY_KEY } from "@/lib/sbiGcv/cvJourney";

const inr = (n: any) =>
  n == null || isNaN(Number(n)) ? "--" : "₹ " + Math.round(Number(n)).toLocaleString("en-IN");

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  margin: "6px 0",
  border: "1px solid #d0d0d0",
  borderRadius: "6px",
  fontSize: "14px",
};
const rowStyle: React.CSSProperties = { display: "flex", gap: "10px" };
const sectionTitle: React.CSSProperties = { margin: "18px 0 4px", fontWeight: 600, fontSize: "15px" };
const hint: React.CSSProperties = { fontSize: 12, color: "#666", margin: "2px 0" };

// RC dates arrive as DD-MM-YYYY / DD-Mon-YYYY / YYYY-MM-DD; <input type=date> needs YYYY-MM-DD.
const toInputDate = (s?: string) => {
  const v = String(s || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = v.match(/^(\d{1,2})[-/.](\d{1,2}|[A-Za-z]{3})[-/.](\d{4})/);
  if (!m) return "";
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const mon = /\d/.test(m[2]) ? Number(m[2]) : months.indexOf(m[2].toUpperCase()) + 1;
  return `${m[3]}-${String(mon).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
};

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const SbiGcvCheckout: React.FC = () => {
  const router = useRouter();
  const [saved, setSaved] = useState<any>(null); // { input, quote, sbiVehicle, sbiRto }
  const [busy, setBusy] = useState("");
  const [agreed, setAgreed] = useState(true);

  // proposer
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [dob, setDob] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [pincode, setPincode] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  // nominee (mandatory for the PA owner-driver cover)
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("Wife");
  const [nomineeDob, setNomineeDob] = useState("");

  // driver (SBI requires driver details on every GCV proposal)
  const [ownerDrives, setOwnerDrives] = useState(true);
  const [driverName, setDriverName] = useState("");
  const [driverDob, setDriverDob] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("5");

  // vehicle + previous policy
  const [chassisNumber, setChassisNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [prevInsurer, setPrevInsurer] = useState("");
  const [prevPolicyNo, setPrevPolicyNo] = useState("");
  const [prevEndDate, setPrevEndDate] = useState("");
  const [prevNcb, setPrevNcb] = useState(""); // "" = don't know
  const [claimMade, setClaimMade] = useState(false);

  // CKYC
  const [ckycOpen, setCkycOpen] = useState(false);
  const [ckyc, setCkyc] = useState<CkycResult | null>(null);

  const [finalQuote, setFinalQuote] = useState<any>(null);

  useEffect(() => {
    try {
      const q = JSON.parse(localStorage.getItem(SBI_GCV_STORAGE_KEY) || "null");
      setSaved(q);
      const input = q?.input || {};
      setChassisNumber(input.chassisNumber || "");
      setEngineNumber(input.engineNumber || "");
      setPrevInsurer(input.previousPolicy?.insurerName || "");
      setPrevPolicyNo(input.previousPolicy?.policyNumber || "");
      setPrevEndDate(toInputDate(input.previousPolicy?.endDate));
      setClaimMade(!!input.previousPolicy?.claimMade);

      const user = localStorage.getItem("cvCustomer") || localStorage.getItem("user");
      if (user) {
        const u = JSON.parse(user);
        const parts = String(u.name || "").trim().split(/\s+/);
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setMobile(u.mobile || "");
        setEmail(u.email || "");
      }
    } catch (e) {
      console.log("SBI GCV CHECKOUT LOAD ERROR", e);
    }
  }, []);

  const input = saved?.input || {};
  const isNew = !!input.isNewVehicle;
  const shownQuote = finalQuote || saved?.quote;

  const buildRequest = () => ({
    ...input,
    chassisNumber,
    engineNumber,
    previousPolicy: isNew
      ? undefined
      : {
          insurerName: prevInsurer,
          policyNumber: prevPolicyNo,
          endDate: prevEndDate,
          claimMade,
          previousNcb: prevNcb === "" ? undefined : Number(prevNcb),
        },
    customer: {
      firstName,
      lastName,
      gender,
      dob,
      mobile,
      email,
      addressLine1: address1,
      addressLine2: address2,
      pincode,
    },
    ckycTags: ckyc?.ckycTagsForFullQuote,
    ckycRecord: ckyc?.record,
    nominee: { name: nomineeName, dob: nomineeDob, relationship: nomineeRelation },
    driver: ownerDrives
      ? {
          name: `${firstName} ${lastName}`.trim(),
          dob,
          licenseNumber,
          experienceYears: Number(experienceYears),
          gender,
          relationship: "Self",
        }
      : {
          name: driverName,
          dob: driverDob,
          licenseNumber,
          experienceYears: Number(experienceYears),
          relationship: "Employed Driver",
        },
  });

  const validate = (): string | null => {
    if (!saved?.input) return "No SBI quote found. Please get a quote again.";
    if (!ckyc?.ckycTagsForFullQuote) return "Please complete KYC verification first.";
    if (!firstName || !dob || !address1 || !/^\d{6}$/.test(pincode))
      return "Please fill your name, date of birth, address and 6-digit pincode.";
    if (!/^\d{10}$/.test(mobile) || !email) return "Please enter a valid mobile number and email.";
    if (!nomineeName || !nomineeDob) return "Please fill nominee name and date of birth.";
    if (!licenseNumber) return "Driving licence number is required.";
    if (!ownerDrives && (!driverName || !driverDob)) return "Please fill the driver's name and date of birth.";
    if (!chassisNumber || !engineNumber) return "Chassis and engine number are required.";
    if (!isNew && !prevEndDate) return "Please enter your previous policy expiry date.";
    return null;
  };

  const handlePay = async () => {
    if (!agreed) return alert("Please accept the Terms & Conditions to continue");
    const err = validate();
    if (err) return alert(err);

    try {
      // 1) FullQuote — the binding premium + QuotationNo
      setBusy("Confirming your quote with SBI...");
      const fqRes = await fetch("/api/sbi/gcv/full-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRequest()),
      });
      const fq = await fqRes.json();
      console.log("SBI GCV FULLQUOTE", fq);
      if (!fq.success) {
        setBusy("");
        return alert(fq.message || "SBI could not confirm this quote. Please check your details.");
      }
      setFinalQuote(fq);

      const prev = Number(saved?.quote?.premium);
      if (prev && Math.abs(fq.premium - prev) >= 1) {
        const ok = window.confirm(
          `Your final SBI premium is ${inr(fq.premium)} (estimate was ${inr(prev)}). Continue to payment?`
        );
        if (!ok) return setBusy("");
      }

      // 2) Razorpay order (SBI-issued gateway keys)
      setBusy("Creating payment order...");
      const orderRes = await fetch("/api/sbi/gcv/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountInRupees: fq.premium, quotationNo: fq.quotationNo }),
      });
      const order = await orderRes.json();
      if (!order.success) {
        setBusy("");
        return alert(order.message || "Could not create the payment order.");
      }

      if (!(await loadRazorpayScript())) {
        setBusy("");
        return alert("Could not load the payment gateway — check your connection.");
      }

      const payerName = `${firstName} ${lastName}`.trim();
      setBusy("Waiting for payment...");
      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Zanifest Insurance",
        description: "SBI General Goods Carrying Vehicle Insurance",
        prefill: { name: payerName, email, contact: mobile },
        handler: (resp: any) => finishPurchase(resp, fq, payerName),
        modal: { ondismiss: () => setBusy("") },
      });
      rzp.open();
    } catch (e: any) {
      console.log("SBI GCV PAY ERROR", e);
      setBusy("");
      alert("Something went wrong: " + e?.message);
    }
  };

  const finishPurchase = async (rzpResp: any, fq: any, payerName: string) => {
    try {
      // 3) Verify + capture payment
      setBusy("Verifying payment...");
      const vRes = await fetch("/api/sbi/gcv/razorpay-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: rzpResp.razorpay_order_id,
          razorpay_payment_id: rzpResp.razorpay_payment_id,
          razorpay_signature: rzpResp.razorpay_signature,
        }),
      });
      const verify = await vRes.json();
      if (!verify.success) {
        setBusy("");
        return alert(verify.message || "Payment verification failed.");
      }

      // 4) Issuance — same CKYC tags as FullQuote
      setBusy("Issuing your policy...");
      const iRes = await fetch("/api/sbi/gcv/issuance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationNo: fq.quotationNo,
          amount: fq.premium,
          payerName,
          paymentReferenceNo: verify.paymentId,
          ckycTags: ckyc?.ckycTagsForFullQuote,
        }),
      });
      const issue = await iRes.json();
      console.log("SBI GCV ISSUANCE", issue);
      setBusy("");
      if (!issue.success) {
        return alert(
          (issue.message || "SBI could not issue the policy") +
            `. Your payment (${verify.paymentId}) is captured — our team will complete issuance. Quote: ${fq.quotationNo}`
        );
      }

      const vehicleNo = input.isNewVehicle ? "NEW" : input.registrationNumber;
      localStorage.setItem(
        SBI_GCV_POLICY_KEY,
        JSON.stringify({
          policyNo: issue.policyNo,
          quotationNo: fq.quotationNo,
          amount: fq.premium,
          paymentId: verify.paymentId,
          customerName: payerName,
          vehicleNo,
          vehicle: saved?.sbiVehicle,
          issueDate: issue.issueDate,
        })
      );

      fetch("/api/users/save-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyNumber: issue.policyNo,
          premium: fq.premium,
          grossPremium: fq.premium,
          transactionType: input.isNewVehicle ? "New" : "Rollover",
          insurer: "SBI General Insurance Company Limited",
          vehicle: { number: vehicleNo, make: saved?.sbiVehicle?.make, model: saved?.sbiVehicle?.model },
          customer: { fullName: payerName, email, mobile },
        }),
      }).catch((e) => console.log("SAVE POLICY ERROR", e));

      router.push("/CommercialVehicle/SbiGcv/success");
    } catch (e: any) {
      console.log("SBI GCV FINISH ERROR", e);
      setBusy("");
      alert("Something went wrong after payment: " + e?.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.mainContent}>
            {/* Left — proposal form */}
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

              <p style={sectionTitle}>KYC verification</p>
              {ckyc ? (
                <p style={{ color: "#1a7f37", fontSize: 14 }}>
                  ✓ KYC verified{ckyc.record?.fullName ? ` — ${ckyc.record.fullName}` : ""}
                </p>
              ) : (
                <>
                  <p style={hint}>SBI requires KYC (PAN / Aadhaar / CKYC ID) before issuing the policy.</p>
                  <button type="button" className={styles.payBtn} style={{ maxWidth: 220 }} onClick={() => setCkycOpen(true)}>
                    Verify KYC
                  </button>
                </>
              )}

              <p style={sectionTitle}>Owner details</p>
              <div style={rowStyle}>
                <input style={inputStyle} placeholder="First name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <input style={inputStyle} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div style={rowStyle}>
                <select style={inputStyle} value={gender} onChange={(e) => setGender(e.target.value as any)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input style={inputStyle} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <input style={inputStyle} placeholder="House / building *" value={address1} onChange={(e) => setAddress1(e.target.value)} />
              <input style={inputStyle} placeholder="Street / area" value={address2} onChange={(e) => setAddress2(e.target.value)} />
              <div style={rowStyle}>
                <input
                  style={inputStyle}
                  placeholder="Pincode *"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                />
                <input
                  style={inputStyle}
                  placeholder="Mobile *"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
              <input style={inputStyle} placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />

              <p style={sectionTitle}>Driver details</p>
              <label style={{ fontSize: 14 }}>
                <input type="checkbox" checked={ownerDrives} onChange={(e) => setOwnerDrives(e.target.checked)} /> Owner drives the
                vehicle
              </label>
              {!ownerDrives && (
                <div style={rowStyle}>
                  <input style={inputStyle} placeholder="Driver name *" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
                  <input style={inputStyle} type="date" value={driverDob} onChange={(e) => setDriverDob(e.target.value)} />
                </div>
              )}
              <div style={rowStyle}>
                <input
                  style={inputStyle}
                  placeholder="Driving licence number *"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                />
                <select style={inputStyle} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}>
                  <option value="0">Experience: under 1 year</option>
                  <option value="2">1 – 3 years</option>
                  <option value="4">3 – 5 years</option>
                  <option value="7">5 – 10 years</option>
                  <option value="12">10 – 15 years</option>
                  <option value="20">15+ years</option>
                </select>
              </div>

              <p style={sectionTitle}>Nominee details</p>
              <input style={inputStyle} placeholder="Nominee name *" value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} />
              <div style={rowStyle}>
                <select style={inputStyle} value={nomineeRelation} onChange={(e) => setNomineeRelation(e.target.value)}>
                  {["Wife", "Husband", "Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Others"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <input style={inputStyle} type="date" value={nomineeDob} onChange={(e) => setNomineeDob(e.target.value)} />
              </div>

              <p style={sectionTitle}>Vehicle identifiers</p>
              <div style={rowStyle}>
                <input
                  style={inputStyle}
                  placeholder="Chassis number *"
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                />
                <input
                  style={inputStyle}
                  placeholder="Engine number *"
                  value={engineNumber}
                  onChange={(e) => setEngineNumber(e.target.value.toUpperCase())}
                />
              </div>

              {!isNew && (
                <>
                  <p style={sectionTitle}>Previous policy</p>
                  <div style={rowStyle}>
                    <input style={inputStyle} placeholder="Previous insurer" value={prevInsurer} onChange={(e) => setPrevInsurer(e.target.value)} />
                    <input style={inputStyle} placeholder="Previous policy number" value={prevPolicyNo} onChange={(e) => setPrevPolicyNo(e.target.value)} />
                  </div>
                  <div style={rowStyle}>
                    <div style={{ flex: 1 }}>
                      <p style={hint}>Previous policy expiry date *</p>
                      <input style={inputStyle} type="date" value={prevEndDate} onChange={(e) => setPrevEndDate(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={hint}>NCB on previous policy</p>
                      <select style={inputStyle} value={prevNcb} onChange={(e) => setPrevNcb(e.target.value)}>
                        <option value="">Don't know</option>
                        <option value="0">0%</option>
                        <option value="0.2">20%</option>
                        <option value="0.25">25%</option>
                        <option value="0.35">35%</option>
                        <option value="0.45">45%</option>
                        <option value="0.5">50%</option>
                      </select>
                    </div>
                  </div>
                  <label style={{ fontSize: 14 }}>
                    <input type="checkbox" checked={claimMade} onChange={(e) => setClaimMade(e.target.checked)} /> I made a claim
                    on my previous policy
                  </label>
                </>
              )}
            </div>

            {/* Right — plan summary */}
            <div className={styles.rightSection}>
              <h4 className={styles.planSummaryTitle}>Your Plan Summary</h4>
              <div className={styles.planSummary}>
                <div className={styles.planHeader}>
                  <Image src={sbiLogo} alt="SBI General Insurance" className={styles.logo} width={110} height={60} />
                  <span className={styles.planType}>Plan Type</span>
                  <span className={styles.planName}>
                    {input.policyType === "liability" ? "Liability Only" : "Package Policy"}
                  </span>
                </div>

                <p style={{ fontSize: 13, margin: "8px 0" }}>
                  {saved?.sbiVehicle?.make} {saved?.sbiVehicle?.model} {saved?.sbiVehicle?.variant}
                  <br />
                  {isNew ? "Brand new" : input.registrationNumber} · {saved?.sbiRto?.name}
                </p>

                <div className={styles.priceDetails}>
                  <div className={styles.priceRow}>
                    <span>IDV</span>
                    <span>{inr(shownQuote?.idv?.selected)}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span>Own Damage</span>
                    <span>{inr(shownQuote?.odPremium)}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span>Third Party + PA</span>
                    <span>{inr(Number(shownQuote?.netPremium) - Number(shownQuote?.odPremium || 0))}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span>GST</span>
                    <span>+ {inr(shownQuote?.gst)}</span>
                  </div>
                </div>

                <div className={styles.totalPay}>
                  <span>You'll Pay</span>
                  <span className={styles.totalAmount}>{inr(shownQuote?.premium)}</span>
                </div>

                <button className={styles.payBtn} onClick={handlePay} disabled={!!busy || !saved}>
                  {busy || "PAY SECURELY"}
                </button>

                <div className={styles.terms}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> I agree to the{" "}
                  <a href="#">Terms &amp; Conditions</a> &amp; confirm that my vehicle has a valid PUC certificate.
                </div>
                <div className={styles.nextStep}>
                  <span className={styles.stepTag}>Note:</span>
                  <p>SBI confirms the final premium before payment; it may differ slightly from the estimate.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CkycDialog
        open={ckycOpen}
        onClose={() => setCkycOpen(false)}
        onVerified={(result) => {
          setCkyc(result);
          setCkycOpen(false);
          const r = result.record || {};
          if (r.fullName) {
            const parts = String(r.fullName).trim().split(/\s+/);
            setFirstName(parts[0] || firstName);
            setLastName(parts.slice(1).join(" ") || lastName);
          }
          if (r.dob) setDob(toInputDate(r.dob) || dob);
          if (r.correspondenceAddress?.pincode) setPincode(r.correspondenceAddress.pincode);
          if (r.correspondenceAddress?.line1) setAddress1(r.correspondenceAddress.line1);
        }}
      />
      <Footer />
    </>
  );
};

export default SbiGcvCheckout;
