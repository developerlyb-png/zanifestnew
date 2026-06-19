import styles from "@/styles/pages/health/health6.module.css";

import { FaBriefcaseMedical, FaCheck } from "react-icons/fa";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";

import { CiFilter } from "react-icons/ci";

import Image from "next/image";

import manicon from "@/assets/liclogo.png";

import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import axios from "axios";

const Health6 = () => {
  const router = useRouter();

  const [plans, setPlans] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const getPlans = async () => {
      try {
        setLoading(true);

        const members = router.query.members
          ? JSON.parse(router.query.members as string)
          : [];

        const response = await axios.post("/api/zuno/health/quick-quote", {
          name: "Test User",

          gender: router.query.gender || "M",

          dob: "1995-05-20",

          mobile: "9999999999",

          email: "test@gmail.com",

          pincode: "400070",

          sumInsured: "500000",

          members: members.map((m: any) => ({
            relation: m.relation,

            age: m.age || "30",

            gender: m.gender,

            dob: m.dob || "1995-05-20",
          })),
        });

        console.log("FULL ZUNO JSON", response.data);

        // ============================
        // FINAL FIXED RESPONSE
        // ============================

        const finalPlans = Array.isArray(response.data)
          ? response.data.map((item: any) => ({
              company: item.company,

              productVariant: item.planName || "Gold",

              premium: item.premium || "0",

              sumInsured: item.sumInsured || "0",

              policyTenure: item.policyTenure,

              raw: item.rawData,
            }))
          : [];

        console.log("FINAL PLAN CARD", finalPlans);

        setPlans(finalPlans);
      } catch (err: any) {
        console.log("HEALTH ERROR", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    getPlans();
  }, [router.isReady]);

  return (
    <div>
      <UserDetails />

      <Navbar />

      <div className={styles.wrapper}>
        <div className={styles.filterBar}>
          <div className={styles.filters}>
            <span className={styles.quickFilters}>Quick Filters</span>

            <button>Existing disease waiting period</button>

            <button>Cover</button>

            <button>Sort by</button>

            <button>
              <CiFilter />
              All filters
            </button>
          </div>
        </div>

        <span className={styles.planFilter}>
          {loading ? "Loading plans..." : `${plans.length} plans found`}
        </span>

        {plans.map((plan: any, index: number) => (
          <div className={styles.mainContainer} key={index}>
            <div className={styles.cardContainer}>
              <div className={styles.card}>
                <Image src={manicon} alt="zuno" width={40} height={40} />
              </div>
            </div>

            <div className={styles.cardContainer1}>
              <div className={styles.card1}>
                <div className={styles.detailsSection}>
                  <h3>Zuno {plan.productVariant} Health Plan</h3>

                  <p className={styles.hospitals}>
                    <FaBriefcaseMedical />
                    Cashless Hospitals Available
                  </p>

                  <ul className={styles.features}>
                    <li>
                      <FaCheck />
                      Health Coverage Included
                    </li>

                    <li>
                      <FaCheck />
                      Recharge Benefit
                    </li>
                  </ul>
                </div>

                <div className={styles.rightSection}>
                  <div className={styles.cover}>
                    Cover Amount
                    <strong>₹ {plan.sumInsured}</strong>
                  </div>

                  <div className={styles.premium}>
                    Premium
                    <strong>₹ {plan.premium}</strong>
                  </div>

                  <button
                    className={styles.customize}
                    onClick={() => {
                      router.push({
                        pathname: "/cart/healthinsurancecart",

                        query: {
                          plan: JSON.stringify(plan.raw),
                        },
                      });
                    }}
                  >
                    Customize plan ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
};

export default Health6;
