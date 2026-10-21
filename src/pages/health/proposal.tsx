"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";

import styles from "@/styles/pages/health/proposal.module.css";

const DISEASES = [
  "Diabetes",
  "Cancer",
  "Epilepsy",
  "Asthma",
  "Hypertension/High BP",
  "High Cholesterol",
  "Thyroid disorder",
  "Kidney Disorder",
  "Heart Disease",
  "Liver diseases",
];

// Confirmed live against Zuno's UAT: they document "B+ve" as the example
// but actually reject it — only the plain "A+"/"O-" style is accepted.
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type MemberForm = {
  id: number;
  relation: string;
  dob: string;
  sumInsured: number;
  fullName: string;
  gender: string;
  height: string;
  weight: string;
  bloodGroup: string;
  nomineeName: string;
  nomineeDob: string;
  nomineeRelation: string;
  nomineeIsMinor: boolean;
  appointeeName: string;
  appointeeDob: string;
  appointeeRelation: string;
  diseases: string[];
  hasPastMedicalHistory: boolean;
  pastMedicalHistoryDetails: string;
  isAllergic: boolean;
  allergyDetails: string;
  hasMadeAnyClaim: boolean;
  claimDetails: string;
  coveredUnderOtherHealthCompany: boolean;
  otherCompanyName: string;
};

const Proposal = () => {
  const router = useRouter();

  const [quoteData, setQuoteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const [proposer, setProposer] = useState({
    name: "",
    dob: "",
    mobile: "",
    email: "",
    gender: "male",
    panNumber: "",
    aadharNumber: "",
  });

  const [address, setAddress] = useState({
    permanentAddress: "",
    permanentState: "",
    permanentCity: "",
    permanentPincode: "",
    isSameAddress: true,
    correspondanceAddress: "",
    correspondanceState: "",
    correspondanceCity: "",
    correspondancePincode: "",
  });

  const [members, setMembers] = useState<MemberForm[]>([]);

  useEffect(() => {
    if (!router.isReady) return;

    if (!router.query.proposal) return;

    try {
      const parsed = JSON.parse(router.query.proposal as string);
      setQuoteData(parsed);

      const memberDetails = parsed?.data?.member_details || [];

      // Zuno requires proposal_details.dob to exactly equal the "self"
      // member's dob (confirmed live) — sync it here so the field shown
      // to the user matches what's actually sent, instead of letting two
      // separately-editable dob fields drift apart.
      const selfMember = memberDetails.find(
        (m: any) => (m.relation || "").toLowerCase() === "self",
      );
      if (selfMember?.dob) {
        setProposer((prev) => ({ ...prev, dob: selfMember.dob }));
      }

      setMembers(
        memberDetails.map((m: any, idx: number) => ({
          id: m.id ?? idx,
          relation: m.relation,
          dob: m.dob,
          sumInsured: m.sum_insured,
          fullName: "",
          gender: "male",
          height: "",
          weight: "",
          bloodGroup: "",
          nomineeName: "",
          nomineeDob: "",
          nomineeRelation: "",
          nomineeIsMinor: false,
          appointeeName: "",
          appointeeDob: "",
          appointeeRelation: "",
          diseases: [],
          hasPastMedicalHistory: false,
          pastMedicalHistoryDetails: "",
          isAllergic: false,
          allergyDetails: "",
          hasMadeAnyClaim: false,
          claimDetails: "",
          coveredUnderOtherHealthCompany: false,
          otherCompanyName: "",
        })),
      );
    } catch (error) {
      console.log("PROPOSAL PARSE ERROR", error);
    }
  }, [router.isReady, router.query.proposal]);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved && saved !== "undefined") {
      try {
        const user = JSON.parse(saved);
        setProposer((prev) => ({
          ...prev,
          name: prev.name || user.name || "",
          email: prev.email || user.email || "",
          mobile: prev.mobile || user.mobile || "",
        }));
      } catch {
        // ignore
      }
    }
  }, []);

  const updateMember = (idx: number, patch: Partial<MemberForm>) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    );
  };

  const toggleDisease = (idx: number, disease: string) => {
    setMembers((prev) =>
      prev.map((m, i) => {
        if (i !== idx) return m;
        const has = m.diseases.includes(disease);
        return {
          ...m,
          diseases: has
            ? m.diseases.filter((d) => d !== disease)
            : [...m.diseases, disease],
        };
      }),
    );
  };

  const premiumDetails = quoteData?.data?.premium_details;
  const premiumAmount = premiumDetails?.premium_amount || 0;
  const quoteId = quoteData?.data?.quote_id;

  const validate = () => {
    if (!proposer.name || !proposer.dob || !proposer.mobile || !proposer.email) {
      alert("Fill all proposer details");
      return false;
    }
    if (premiumAmount > 50000 && !proposer.panNumber) {
      alert("PAN is required for premium above ₹50,000");
      return false;
    }
    if (premiumAmount > 100000 && !proposer.aadharNumber) {
      alert("Aadhaar is required for premium above ₹1,00,000");
      return false;
    }
    if (
      !address.permanentAddress ||
      !address.permanentState ||
      !address.permanentCity ||
      !address.permanentPincode
    ) {
      alert("Fill permanent address details");
      return false;
    }
    if (
      !address.isSameAddress &&
      (!address.correspondanceAddress ||
        !address.correspondanceState ||
        !address.correspondanceCity ||
        !address.correspondancePincode)
    ) {
      alert("Fill correspondence address details");
      return false;
    }
    for (const m of members) {
      if (!m.fullName || !m.bloodGroup || !m.height || !m.weight) {
        alert(`Fill all details for ${m.relation}`);
        return false;
      }
      if (!m.nomineeName || !m.nomineeDob || !m.nomineeRelation) {
        alert(`Fill nominee details for ${m.relation}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!quoteId) {
      alert("Quote data missing — please start over");
      return;
    }
    if (!validate()) return;

    try {
      setLoading(true);
      setLoadingStep("Submitting proposal...");

      const proposalRes = await fetch("/api/zuno/health/create-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          proposer,
          address,
          members: members.map((m) => ({
            id: m.id,
            fullName: m.fullName,
            relation: m.relation,
            sumInsured: m.sumInsured,
            gender: m.gender,
            dob: m.dob,
            bloodGroup: m.bloodGroup,
            height: m.height,
            weight: m.weight,
            nomineeName: m.nomineeName,
            nomineeDob: m.nomineeDob,
            nomineeRelation: m.nomineeRelation,
            appointeeName: m.nomineeIsMinor ? m.appointeeName : "",
            appointeeDob: m.nomineeIsMinor ? m.appointeeDob : null,
            appointeeRelation: m.nomineeIsMinor ? m.appointeeRelation : "",
            diseases: m.diseases,
            hasPastMedicalHistory: m.hasPastMedicalHistory,
            pastMedicalHistoryDetails: m.pastMedicalHistoryDetails,
            isAllergic: m.isAllergic,
            allergyDetails: m.allergyDetails,
            hasMadeAnyClaim: m.hasMadeAnyClaim,
            claimDetails: m.claimDetails,
            coveredUnderOtherHealthCompany: m.coveredUnderOtherHealthCompany,
            otherCompanyName: m.otherCompanyName,
          })),
        }),
      });

      const proposalData = await proposalRes.json();
      console.log("CREATE PROPOSAL RESULT", proposalData);
      if (!proposalRes.ok) {
        // Printed as its own line so it's easy to copy straight out of
        // the browser console (F12) without digging through server
        // terminal scrollback for the matching request.
        console.log("CREATE PROPOSAL — EXACT PAYLOAD SENT TO ZUNO", proposalData?.sentPayload);
      }

      if (!proposalRes.ok) {
        setLoading(false);
        alert(proposalData.message || "Could not submit proposal — check console");
        return;
      }

      // Zuno's own hosted payment page (ZunoPay) — same generic
      // request-link/check-status API the 2W/4W motor flows already use,
      // in place of Razorpay. It redirects to a Zuno-hosted checkout page
      // and returns to a STATIC url registered with Zuno at onboarding
      // (not one we can pass per-request) — so everything policy-issuance
      // needs is persisted to localStorage now and picked back up by
      // /health/payment-return after the redirect.
      setLoadingStep("Creating payment link...");
      const transactionId = `HP${quoteId}`.slice(0, 40);

      const linkRes = await fetch("/api/zuno/health/payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          amount: premiumAmount,
          customer: { fullName: proposer.name, email: proposer.email, mobile: proposer.mobile },
        }),
      });
      const linkData = await linkRes.json();
      console.log("ZUNO PAY LINK RESULT", linkData);

      if (!linkRes.ok || !linkData.success || !linkData.data?.paymentLink) {
        setLoading(false);
        alert(linkData.message || "Could not create payment link");
        return;
      }

      localStorage.setItem(
        "zunoHealthPendingPayment",
        JSON.stringify({
          quoteId,
          policyTenure: quoteData?.data?.policy_tenure,
          orderId: linkData.data.orderId,
          transactionId,
          amount: premiumAmount,
          customer: {
            fullName: proposer.name,
            email: proposer.email,
            mobile: proposer.mobile,
            sumInsured: members[0]?.sumInsured,
          },
        }),
      );

      window.location.href = linkData.data.paymentLink;
    } catch (error: any) {
      setLoading(false);
      console.log("PROPOSAL SUBMIT ERROR", error);
      alert(error.message || "Something went wrong");
    }
  };


  return (
    <div>
      <UserDetails />
      <Navbar />

      <div className={styles.wrapper}>
        <h2 className={styles.heading}>Complete your proposal</h2>
        <p className={styles.subheading}>
          Fill in your details to finish your Zuno health insurance purchase.
        </p>

        {quoteData && (
          <div className={styles.summaryCard}>
            <h3>
              Zuno {premiumDetails?.plan_name || ""} Health Plan · {quoteData?.data?.policy_tenure} yr(s)
            </h3>
            <div className={styles.summaryPremium}>₹{premiumAmount}</div>
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Proposer Details</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Full Name</label>
              <input
                value={proposer.name}
                onChange={(e) => setProposer({ ...proposer, name: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Date of Birth (must match "self" member)</label>
              <input type="date" value={proposer.dob} readOnly />
            </div>
            <div className={styles.field}>
              <label>Mobile</label>
              <input
                value={proposer.mobile}
                maxLength={10}
                onChange={(e) =>
                  setProposer({ ...proposer, mobile: e.target.value.replace(/\D/g, "") })
                }
              />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input
                value={proposer.email}
                onChange={(e) => setProposer({ ...proposer, email: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Gender</label>
              <select
                value={proposer.gender}
                onChange={(e) => setProposer({ ...proposer, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>PAN Number {premiumAmount > 50000 ? "(required)" : "(optional)"}</label>
              <input
                value={proposer.panNumber}
                onChange={(e) => setProposer({ ...proposer, panNumber: e.target.value.toUpperCase() })}
              />
            </div>
            <div className={styles.field}>
              <label>Aadhaar Number {premiumAmount > 100000 ? "(required)" : "(optional)"}</label>
              <input
                value={proposer.aadharNumber}
                onChange={(e) => setProposer({ ...proposer, aadharNumber: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Address Details</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Permanent Address</label>
              <input
                value={address.permanentAddress}
                onChange={(e) => setAddress({ ...address, permanentAddress: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>State</label>
              <input
                value={address.permanentState}
                onChange={(e) => setAddress({ ...address, permanentState: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>City</label>
              <input
                value={address.permanentCity}
                onChange={(e) => setAddress({ ...address, permanentCity: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Pincode</label>
              <input
                value={address.permanentPincode}
                maxLength={6}
                onChange={(e) =>
                  setAddress({ ...address, permanentPincode: e.target.value.replace(/\D/g, "") })
                }
              />
            </div>
          </div>

          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={address.isSameAddress}
              onChange={(e) => setAddress({ ...address, isSameAddress: e.target.checked })}
            />
            Correspondence address same as permanent address
          </div>

          {!address.isSameAddress && (
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Correspondence Address</label>
                <input
                  value={address.correspondanceAddress}
                  onChange={(e) =>
                    setAddress({ ...address, correspondanceAddress: e.target.value })
                  }
                />
              </div>
              <div className={styles.field}>
                <label>State</label>
                <input
                  value={address.correspondanceState}
                  onChange={(e) =>
                    setAddress({ ...address, correspondanceState: e.target.value })
                  }
                />
              </div>
              <div className={styles.field}>
                <label>City</label>
                <input
                  value={address.correspondanceCity}
                  onChange={(e) => setAddress({ ...address, correspondanceCity: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Pincode</label>
                <input
                  value={address.correspondancePincode}
                  maxLength={6}
                  onChange={(e) =>
                    setAddress({
                      ...address,
                      correspondancePincode: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {members.map((m, idx) => (
          <div className={styles.section} key={m.id}>
            <h3 className={styles.sectionTitle}>Member — {m.relation}</h3>
            <p className={styles.stepNote}>
              DOB: {m.dob} · Sum Insured: ₹{m.sumInsured}
            </p>

            <div className={styles.memberCard}>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label>Full Name</label>
                  <input
                    value={m.fullName}
                    onChange={(e) => updateMember(idx, { fullName: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Gender</label>
                  <select
                    value={m.gender}
                    onChange={(e) => updateMember(idx, { gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Height (cm)</label>
                  <input
                    value={m.height}
                    onChange={(e) => updateMember(idx, { height: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Weight (kg)</label>
                  <input
                    value={m.weight}
                    onChange={(e) => updateMember(idx, { weight: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Blood Group</label>
                  <select
                    value={m.bloodGroup}
                    onChange={(e) => updateMember(idx, { bloodGroup: e.target.value })}
                  >
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <h4>Nominee Details</h4>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label>Nominee Name</label>
                  <input
                    value={m.nomineeName}
                    onChange={(e) => updateMember(idx, { nomineeName: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Nominee DOB</label>
                  <input
                    type="date"
                    value={m.nomineeDob}
                    onChange={(e) => updateMember(idx, { nomineeDob: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Nominee Relation</label>
                  <input
                    value={m.nomineeRelation}
                    onChange={(e) => updateMember(idx, { nomineeRelation: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={m.nomineeIsMinor}
                  onChange={(e) => updateMember(idx, { nomineeIsMinor: e.target.checked })}
                />
                Nominee is a minor (below 18) — add appointee
              </div>

              {m.nomineeIsMinor && (
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label>Appointee Name</label>
                    <input
                      value={m.appointeeName}
                      onChange={(e) => updateMember(idx, { appointeeName: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Appointee DOB</label>
                    <input
                      type="date"
                      value={m.appointeeDob}
                      onChange={(e) => updateMember(idx, { appointeeDob: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Appointee Relation</label>
                    <input
                      value={m.appointeeRelation}
                      onChange={(e) => updateMember(idx, { appointeeRelation: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <h4>Medical History</h4>
              <div className={styles.diseaseGrid}>
                {DISEASES.map((d) => (
                  <div
                    key={d}
                    className={`${styles.diseaseChip} ${m.diseases.includes(d) ? styles.active : ""}`}
                    onClick={() => toggleDisease(idx, d)}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={m.hasPastMedicalHistory}
                  onChange={(e) => updateMember(idx, { hasPastMedicalHistory: e.target.checked })}
                />
                Has past medical history
              </div>
              {m.hasPastMedicalHistory && (
                <div className={styles.field}>
                  <label>Details</label>
                  <input
                    value={m.pastMedicalHistoryDetails}
                    onChange={(e) =>
                      updateMember(idx, { pastMedicalHistoryDetails: e.target.value })
                    }
                  />
                </div>
              )}

              <div className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={m.isAllergic}
                  onChange={(e) => updateMember(idx, { isAllergic: e.target.checked })}
                />
                Has any allergy
              </div>
              {m.isAllergic && (
                <div className={styles.field}>
                  <label>Allergy details</label>
                  <input
                    value={m.allergyDetails}
                    onChange={(e) => updateMember(idx, { allergyDetails: e.target.value })}
                  />
                </div>
              )}

              <div className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={m.hasMadeAnyClaim}
                  onChange={(e) => updateMember(idx, { hasMadeAnyClaim: e.target.checked })}
                />
                Made a claim with a previous health insurer
              </div>
              {m.hasMadeAnyClaim && (
                <div className={styles.field}>
                  <label>Claim details</label>
                  <input
                    value={m.claimDetails}
                    onChange={(e) => updateMember(idx, { claimDetails: e.target.value })}
                  />
                </div>
              )}

              <div className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={m.coveredUnderOtherHealthCompany}
                  onChange={(e) =>
                    updateMember(idx, { coveredUnderOtherHealthCompany: e.target.checked })
                  }
                />
                Covered under another health insurance company
              </div>
              {m.coveredUnderOtherHealthCompany && (
                <div className={styles.field}>
                  <label>Company name</label>
                  <input
                    value={m.otherCompanyName}
                    onChange={(e) => updateMember(idx, { otherCompanyName: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        <button className={styles.submitBtn} disabled={loading} onClick={handleSubmit}>
          {loading ? loadingStep || "Processing..." : `Pay ₹${premiumAmount} & Buy Policy`}
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default Proposal;
