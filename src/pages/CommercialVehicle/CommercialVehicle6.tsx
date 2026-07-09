// src/pages/CommercialVehicle/CommercialVehicle6.tsx
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/CommercialVehicle/commercialVehicle6.module.css";
import zunoLogo from "@/assets/CommercialVehicle/ICICIlombard.png"; // TODO: replace with Zuno logo asset
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useRouter } from "next/router";

const inr = (n: any) =>
  n == null || isNaN(Number(n))
    ? "--"
    : "₹ " + Math.round(Number(n)).toLocaleString("en-IN");

const CommercialVehicle6: React.FC = () => {
  const router = useRouter();

  const [quote, setQuote] = useState<any>(null); // saved quick-quote result
  const [ownership, setOwnership] = useState<"Ind" | "Comp">("Ind");
  const [agreed, setAgreed] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    try {
      const q = localStorage.getItem("cvSelectedQuote");
      if (q && q !== "undefined") setQuote(JSON.parse(q));
    } catch (e) {
      console.log("QUOTE LOAD ERROR", e);
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

    setPaying(true);
    try {
      const storedPayload = localStorage.getItem("cvQuotePayload");
      const res = await fetch("/api/zuno/cv/full-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownershipOfTheVehicle: ownership, // "Ind" | "Comp"
          quickQuoteRequestId: quote.requestId,
          quotePayload: storedPayload ? JSON.parse(storedPayload) : null,
        }),
      });
      const result = await res.json();
      console.log("FULL QUOTE RESULT", result);

      if (!result.success) {
        alert(result.message || "Could not confirm the quote. Please retry.");
        return;
      }

      // fullQuote returns quoteNo + quoteOptNo (needed for issue-policy).
      // Exact key names: check the fullQuote response — commonly
      // quoteNo / quoteOptNo or quoteNumber / quoteOptionNumber.
      const d = result.data || {};
      const quoteNo =
        d.quoteNo || d.quoteNumber || d.policyData?.quoteNo || "";
      const quoteOptNo =
        d.quoteOptNo || d.quoteOptionNumber || d.policyData?.quoteOptNo || "";

      localStorage.setItem(
        "cvFullQuote",
        JSON.stringify({ quoteNo, quoteOptNo, raw: d })
      );

      if (!quoteNo) {
        console.log("FULL QUOTE: quoteNo not found in response keys", Object.keys(d));
      }

      // NEXT MILESTONE: call /api/zuno/cv/payment (online-payment-request)
      // with quoteNo/quoteOptNo and redirect to the returned payment URL.
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
            {/* Left Section */}
            <div className={styles.leftSection}>
              <div className={styles.infoBar}>
                <div>
                  Pay now and{" "}
                  <span className={styles.bold}>get policy instantly!</span>
                </div>
                <span className={styles.infoIcon}>i</span>
              </div>

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
            </div>

            {/* Right Section */}
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
                  <span className={styles.planName}>Own Damage cover</span>
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
                  <span className={styles.stepTag}>Next step:</span>
                  <p>
                    After payment, we'll ask you to fill a few details and
                    complete your KYC to <b>deliver your policy instantly</b>{" "}
                    to your inbox.
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