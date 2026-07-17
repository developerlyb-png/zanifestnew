/*
  2W FLOW UPDATE — bikeinsurancecart / twowheeler-confirm.tsx

  In handleProposal, DELETE everything from the comment:

      // ======================
      // CALL REAL ZUNO PAYMENT
      // ======================

  ...down to (and including) this block:

      if (payData.success && payData.data?.data?.paymentLink) {
          window.location.href = payData.data.data.paymentLink;
      } else {
          console.log("PAYMENT RESPONSE", payData);
          alert("Payment link not found");
      }

  and PASTE the block below in its place.
  (Everything before it — full quote + localStorage saves — stays as is.)
*/

// ======================
// STEP 3 : EXTRACT QUOTE NUMBERS
// ======================
const quoteNo =
  quoteData.data?.policyLevelDetails?.quoteNo;
const quoteOptionNo =
  quoteData.data?.policyLevelDetails?.quoteOptionNo;

console.log("QUOTE NUMBERS >>>", { quoteNo, quoteOptionNo });

if (!quoteNo || !quoteOptionNo) {
  setLoading(false);
  alert("Quote numbers missing — check console");
  return;
}

// ======================
// STEP 4 : KYC REFERENCE (TESTING MODE)
// ======================
// KYC is customer-level, so we reuse the approved KYC request
// number (same person). Set once in the browser console:
//   localStorage.setItem("bikeApprovedKycNo", "zuno-000000180434")
const kycNo =
  localStorage.getItem("bikeApprovedKycNo") ||
  localStorage.getItem("carApprovedKycNo") ||
  "";

console.log("2W KYC NO (stored) >>>", kycNo || "(none)");

if (!kycNo) {
  setLoading(false);
  alert(
    "Set localStorage bikeApprovedKycNo first (zuno-... number)"
  );
  return;
}

// ======================
// STEP 5 : ISSUE POLICY
// ======================
const issueRes = await fetch("/api/sbi/2w/issue-policy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    quoteNo,
    quoteOptionNo,
    kycNo, // sent as VISoF_KYC_Req_No
  }),
});

const issueData = await issueRes.json();
console.log(
  "2W ISSUE RESPONSE >>>",
  JSON.stringify(issueData, null, 2)
);

if (!issueRes.ok || !issueData.success) {
  setLoading(false);
  alert("Issue Policy failed — check console");
  return;
}

// Zuno response shape: issuePolicyObject.issuepolicy.policynrTt
const ip =
  issueData.data?.issuePolicyObject?.issuepolicy || {};
const policyNo = ip.policynrTt || "";

console.log("2W POLICY NO >>>", policyNo);

localStorage.setItem(
  "bikePolicyResult",
  JSON.stringify({
    policyNo,
    quoteNo,
    quoteOptionNo,
    amount: selectedPlan?.premium,
    raw: issueData.data,
  })
);

// ======================
// STEP 6 : PAYMENT
// ======================
const payRes = await fetch("/api/sbi/2w/online-payment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    transactionId: policyNo || quoteNo,
    amount: selectedPlan?.premium,
    returnUrl: `${window.location.origin}/cart/bike-policy-success`,
    customer: {
      fullName,
      mobile,
      email,
    },
  }),
});

const payData = await payRes.json();
console.log(
  "ZUNO PAYMENT RESPONSE >>>",
  JSON.stringify(payData, null, 2)
);

setLoading(false);

// Payment link — same extraction style as 4W
const pd = payData.data?.data || payData.data || {};
const payLink =
  pd.paymentLink ||
  pd.paymentUrl ||
  pd.payment_url ||
  pd.link ||
  pd.url ||
  pd.shortUrl ||
  "";

if (payData.success && payLink) {
  window.location.href = payLink;
} else {
  console.log("PAYMENT RESPONSE", payData);
  alert("Payment link not found — policy IS issued, check console");
}