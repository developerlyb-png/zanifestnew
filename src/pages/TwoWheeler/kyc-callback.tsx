"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function KycCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing your KYC verification...");
  const [error, setError] = useState("");
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (!router.isReady || ran) return;
    setRan(true);

    const run = async () => {
      console.log("2W KYC CALLBACK QUERY >>>", router.query);

      const pending = localStorage.getItem("bikePendingIssue");
      if (!pending) {
        setError(
          "Could not find your quote details. Please start again from the plans page."
        );
        return;
      }
      const { quoteNo, quoteOptionNo, policyNumber, premium, customer } =
        JSON.parse(pending);

      // Zuno/Signzy's exact callback param name for the KYC reference isn't
      // confirmed yet — checking the most likely candidates from the query
      // string. If issuance fails below with "reference not found", check
      // the logged raw query above for the actual param name and add it here.
      const q = router.query as Record<string, string>;
      const kycNo =
        q.leadId ||
        q.kycNo ||
        q.VISoF_KYC_Req_No ||
        q.referenceId ||
        q.reqId ||
        q.id ||
        "";

      if (!kycNo) {
        console.log("2W KYC CALLBACK — no reference found in query:", q);
        setError(
          "KYC reference not found in the redirect. Check the browser console (2W KYC CALLBACK QUERY) for the actual params Zuno sent back."
        );
        return;
      }

      setStatus("KYC received, issuing your policy...");

      const issueRes = await fetch("/api/sbi/2w/issue-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteNo, quoteOptionNo, kycNo, policyNumber }),
      });
      const issueData = await issueRes.json();
      console.log("2W ISSUE RESPONSE (post-KYC) >>>", issueData);

      if (!issueRes.ok || !issueData.success) {
        setError("Issue Policy failed — check console for the raw response.");
        return;
      }

      const ip = issueData.data?.issuePolicyObject?.issuepolicy || {};
      const policyNo = ip.policynrTt || "";

      localStorage.setItem(
        "bikePolicyResult",
        JSON.stringify({
          policyNo,
          quoteNo,
          quoteOptionNo,
          amount: premium,
          raw: issueData.data,
        })
      );

      setStatus("Policy issued, redirecting to payment...");

      const payRes = await fetch("/api/sbi/2w/online-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: policyNo || quoteNo,
          amount: premium,
          returnUrl: `${window.location.origin}/cart/bike-policy-success`,
          customer,
        }),
      });
      const payData = await payRes.json();
      console.log("2W PAYMENT RESPONSE >>>", payData);

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
        setError(
          "Policy IS issued, but the payment link was not found — check console."
        );
      }
    };

    run().catch((err) => {
      console.log("2W KYC CALLBACK ERROR", err);
      setError("Something went wrong completing your KYC. Please check console.");
    });
  }, [router.isReady, router.query, ran]);

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: 24 }}>
        {error ? (
          <p style={{ color: "#c0392b" }}>{error}</p>
        ) : (
          <p>{status}</p>
        )}
      </div>
      <Footer />
    </div>
  );
}
