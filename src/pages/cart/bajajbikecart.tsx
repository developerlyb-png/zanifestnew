import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/cart/carinsurancecart.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";
import { useRouter } from "next/router";
import BajajKycDialog from "@/components/bajaj/BajajKycDialog";
import { BAJAJ_PREV_INSURERS, bajajPrevInsurerCode } from "@/lib/bajajPrevInsurers";

// Bajaj Allianz two-wheeler checkout. Kept apart from bikeinsurancecart.tsx
// (built around Zuno's own OTP/proposal/payment) so neither flow can break
// the other. Same chain as the 4W Bajaj checkout:
//   /api/bajaj/2w/issue-policy "price" -> KYC popup -> "issue" -> Bajaj's
//   payment page -> /api/bajaj/2w/payment-return -> /cart/bajaj-payment

const inr = (n: any) => (n == null ? "--" : "₹" + Math.round(Number(n)).toLocaleString("en-IN"));
const read = (key: string) => {
  try {
    const v = localStorage.getItem(key);
    return v && v !== "undefined" ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};

const BajajBikeCart = () => {
  const router = useRouter();

  const [quote, setQuote] = useState<any>(null); // /api/bajaj/2w/quote response
  const [quoteInput, setQuoteInput] = useState<any>(null); // what it was priced with
  const [bike, setBike] = useState<any>(null);
  const [rc, setRc] = useState<any>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("M");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address1, setAddress1] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [engineNo, setEngineNo] = useState("");
  const [chassisNo, setChassisNo] = useState("");
  const [prevInsurer, setPrevInsurer] = useState("");
  const [prevPolicyNo, setPrevPolicyNo] = useState("");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("Spouse");
  const [isChecked, setIsChecked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  // Priced proposal waiting on KYC: {transactionId, premium, netPremium, request}
  const [proposal, setProposal] = useState<any>(null);
  const [showKyc, setShowKyc] = useState(false);

  const isNew = !!quoteInput?.isNew;

  useEffect(() => {
    const q = read("selectedQuoteBajaj2w");
    const qi = read("bajaj2wQuoteInput");
    const b = read("selectedBikeData");
    const r = read("bikeRcDetails");
    setQuote(q);
    setQuoteInput(qi);
    setBike(b);
    setRc(r);

    // Pre-fill from the RC; everything stays editable
    if (r) {
      setEngineNo(String(r.engine || ""));
      setChassisNo(String(r.chassis || ""));
      setAddress1(String(r.address || ""));
      setPincode(String(r.pincode || ""));
      const code = bajajPrevInsurerCode(r.insurance?.insurer || "");
      // Bajaj's own renewals (6) are a different policy type
      if (code && code !== "6") setPrevInsurer(code);
      setPrevPolicyNo(String(r.insurance?.policyNumber || "").trim());
      const parts = String(r.ownerName || "").trim().split(/\s+/);
      if (parts[0]) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(" "));
      }
    } else if (b) {
      setEngineNo(b.engineNumber && b.engineNumber !== "NA" ? b.engineNumber : "");
      setChassisNo(b.chassisNumber && b.chassisNumber !== "NA" ? b.chassisNumber : "");
    }

    const u = read("user");
    if (u) {
      setMobile(u.mobile || "");
      setEmail(u.email || "");
      if (!r?.ownerName) {
        const parts = String(u.name || "").split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" "));
      }
    }
  }, []);

  // City + state from the pincode (both stay editable)
  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) return;
    let cancelled = false;
    fetch(`/api/pincode?pin=${pincode}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.success) return;
        setCity(d.city);
        setAddressState(d.state);
      })
      .catch((e) => console.log("PINCODE LOOKUP ERROR", e));
    return () => {
      cancelled = true;
    };
  }, [pincode]);

  // Everything Bajaj's price and issue calls need — built once per click so
  // the issue call repeats the priced request exactly (Bajaj's rule).
  const issueRequest = () => ({
    quoteInput,
    idv: quote?.idv,
    proposer: {
      title: gender === "F" ? "Ms" : "Mr",
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob,
      mobile,
      email: email.trim(),
      address1: address1.trim(),
      city: city.trim(),
      state: addressState.trim(),
      pincode,
      engineNo: engineNo.trim(),
      chassisNo: chassisNo.trim(),
      nomineeName: nomineeName.trim(),
      nomineeRelation,
      previousInsurerCode: isNew ? "" : prevInsurer,
      previousPolicyNumber: isNew ? "" : prevPolicyNo,
    },
  });

  const handlePay = async () => {
    if (!isChecked) return alert("Please accept terms & conditions");
    if (!firstName || !lastName || !dob || !mobile || !email || !address1 || !city || !addressState || !pincode) {
      return alert("Please fill all your details, including last name and state");
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) return alert("Please enter a valid 10-digit mobile number");
    if (!/^\d{6}$/.test(pincode)) return alert("Please enter a valid 6-digit pincode");
    if (engineNo.trim().length < 5 || chassisNo.trim().length < 6) {
      return alert("Please enter the engine and chassis numbers from your RC");
    }
    if (!isNew && (!prevInsurer || !prevPolicyNo)) return alert("Please fill your previous policy details");
    if (!nomineeName) return alert("Please fill nominee details");
    if (!quoteInput || !quote?.success) return alert("Quote data missing — please get a quote again");

    // Same details as the proposal already priced: reopen its KYC instead
    // of re-pricing (a new price means a new transaction and fresh KYC)
    const request = issueRequest();
    if (proposal && JSON.stringify(proposal.request) === JSON.stringify(request)) {
      setShowKyc(true);
      return;
    }

    try {
      setLoading(true);
      setLoadingStep("Creating proposal...");
      const res = await fetch("/api/bajaj/2w/issue-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "price", ...request }),
      });
      const data = await res.json();
      console.log("BAJAJ 2W PRICE RESULT >>>", data);
      if (!res.ok || !data.success) return alert(data.message || "Bajaj proposal failed — check console");

      // Bajaj's final price can differ from the quote (e.g. the real previous insurer)
      if (data.premium && Math.round(data.premium) !== Math.round(quote.premium || 0)) {
        const ok = confirm(
          `Bajaj's final premium for these details is ${inr(data.premium)} (quoted ${inr(quote.premium)}). Continue?`
        );
        if (!ok) return;
      }
      setProposal({ ...data, request });
      setShowKyc(true);
    } catch (e: any) {
      console.log("BAJAJ 2W PAY ERROR", e);
      alert("Something went wrong: " + e?.message);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const issue = async (kycProof: string) => {
    if (!proposal) return;
    try {
      setLoading(true);
      setLoadingStep("Issuing policy...");
      const res = await fetch("/api/bajaj/2w/issue-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "issue",
          ...proposal.request,
          transactionId: proposal.transactionId,
          kycProof,
        }),
      });
      const data = await res.json();
      console.log("BAJAJ 2W ISSUE RESULT >>>", data);
      if (!res.ok || !data.success) {
        setLoading(false);
        setLoadingStep("");
        setShowKyc(false);
        alert(data.message || "Bajaj could not issue the policy — check console");
        return;
      }

      // The result page needs these for the success screen and the dashboard
      localStorage.setItem(
        "bajajCheckout",
        JSON.stringify({
          transactionId: proposal.transactionId,
          amount: proposal.premium,
          netPremium: proposal.netPremium,
          vehicleClass: "2W",
          customer: { fullName: `${firstName} ${lastName}`.trim(), email, mobile },
          vehicle: {
            number: rc?.registrationNumber || bike?.registrationNumber,
            make: rc?.brand || bike?.make,
            model: rc?.model || bike?.model,
          },
        })
      );
      setLoadingStep("Opening payment...");
      window.location.href = data.paymentUrl;
    } catch (e: any) {
      setLoading(false);
      setLoadingStep("");
      console.log("BAJAJ 2W ISSUE ERROR", e);
      alert("Something went wrong: " + e?.message);
    }
  };

  const vehicleTitle = [rc?.brand || bike?.make, rc?.model || [bike?.model, bike?.variant].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" ");

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
            <div className={styles.card1}>
              <h3>Bike Details</h3>
              <p className={styles.carTitle}>{vehicleTitle || "--"}</p>
              <p className={styles.carSubText}>
                {isNew ? "New bike" : rc?.registrationNumber || bike?.registrationNumber || ""}
                {quote?.matchedModel ? ` · Bajaj: ${quote.matchedModel}` : ""}
              </p>
            </div>

            <div className={styles.card1}>
              <h3>Your Details</h3>
              <input className={styles.input} placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <input className={styles.input} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <label style={{ display: "block", marginTop: 8 }}>
                Gender{" "}
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </label>
              <label style={{ display: "block", marginTop: 8 }}>
                Date of Birth
                <input className={styles.input} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </label>
              <input
                className={styles.input}
                placeholder="Mobile"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              />
              <input className={styles.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={styles.input} placeholder="Address" value={address1} onChange={(e) => setAddress1(e.target.value)} />
              <input
                className={styles.input}
                placeholder="Pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              />
              <input className={styles.input} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <input
                className={styles.input}
                placeholder="State (e.g. Maharashtra)"
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
              />

              <h3>Vehicle</h3>
              <input
                className={styles.input}
                placeholder="Engine number (as on RC)"
                value={engineNo}
                onChange={(e) => setEngineNo(e.target.value.toUpperCase())}
              />
              <input
                className={styles.input}
                placeholder="Chassis number (as on RC)"
                value={chassisNo}
                onChange={(e) => setChassisNo(e.target.value.toUpperCase())}
              />

              {!isNew && (
                <>
                  <h3>Previous Policy</h3>
                  <label style={{ display: "block", marginTop: 8 }}>
                    Previous insurer{" "}
                    <select value={prevInsurer} onChange={(e) => setPrevInsurer(e.target.value)}>
                      <option value="">Select insurer</option>
                      {BAJAJ_PREV_INSURERS.map((i) => (
                        <option key={i.code} value={i.code}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    className={styles.input}
                    placeholder="Previous policy number"
                    value={prevPolicyNo}
                    onChange={(e) => setPrevPolicyNo(e.target.value.trim())}
                  />
                </>
              )}

              <h3>Nominee</h3>
              <input className={styles.input} placeholder="Nominee name" value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} />
              <label style={{ display: "block", marginTop: 8 }}>
                Nominee Relation{" "}
                <select value={nomineeRelation} onChange={(e) => setNomineeRelation(e.target.value)}>
                  {["Spouse", "Father", "Mother", "Son", "Daughter", "Brother", "Sister"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.summaryCard}>
              <h2 className={styles.heading}>Plan Summary</h2>
              <div className={styles.row}>
                <span>IDV Cover</span>
                <span>{inr(quote?.idv)}</span>
              </div>
              <div className={styles.row}>
                <span>Insurer</span>
                <span>Bajaj Allianz General Insurance</span>
              </div>
              <div className={styles.row}>
                <span>Plan</span>
                <span>{quote?.product === "1826" ? "New bike (1 yr OD + 5 yr TP)" : "Comprehensive"}</span>
              </div>
              <hr />
              <div className={styles.row}>
                <span>Premium Amount</span>
                <span>{inr(quote?.netPremium)}</span>
              </div>
              <div className={styles.row}>
                <span>GST @18%</span>
                <span>+ {inr(quote?.gst)}</span>
              </div>
              <div className={styles.totalBox}>
                <p className={styles.youPay}>You&apos;ll Pay</p>
                <p className={styles.priceBig}>{inr(proposal?.premium ?? quote?.premium)}</p>
              </div>
              <button className={styles.payBtn} onClick={handlePay} disabled={loading || !quote?.success}>
                {loading ? loadingStep || "PROCESSING..." : "PAY SECURELY →"}
              </button>
              {!quote?.success && (
                <p style={{ color: "#c0392b", fontSize: 13 }}>
                  No Bajaj quote found — please{" "}
                  <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => router.push("/TwoWheeler/twowheeler5")}>
                    go back to the plans
                  </span>
                  .
                </p>
              )}
              <div className={styles.terms}>
                <label>
                  <input type="checkbox" checked={isChecked} onChange={() => setIsChecked(!isChecked)} />
                  I agree to the <span>terms & conditions</span>
                </label>
              </div>
              <div className={styles.nextStep}>
                <strong>Next step</strong>
                <p>Next, verify your KYC with an OTP, then pay on Bajaj&apos;s secure page.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {proposal && (
        <BajajKycDialog
          open={showKyc}
          kycUrl="/api/bajaj/2w/kyc"
          transactionId={proposal.transactionId}
          premium={proposal.premium}
          isNew={isNew}
          fullName={`${firstName} ${lastName}`.trim()}
          mobile={mobile}
          pan=""
          onClose={() => setShowKyc(false)}
          onVerified={issue}
        />
      )}
      <Footer />
    </div>
  );
};

export default BajajBikeCart;
