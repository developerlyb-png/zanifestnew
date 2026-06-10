import styles from "@/styles/pages/health/health6.module.css";
import { FaCheckCircle, FaBriefcaseMedical, FaCheck } from "react-icons/fa";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { CiFilter } from "react-icons/ci";
import Image from "next/image";
import manicon from "@/assets/liclogo.png";
import UserDetails from "@/components/ui/UserDetails";
import {useRouter} from 'next/router'
const plans = [
  {
    id: 1,
    brand: "Care",
    name: "Care Supreme Direct",
    cover: "₹10 Lakh",
    premium: "₹1,013/month",
    annualPremium: "₹12,153 annually",
    hospitals: 202,
    features: [
      "Reduce waiting for high blood pressure care from 4 years to 30 days with Instant Cover rider",
      "No Room Rent Limit",
      "₹15 lakh Renewal Bonus; optional",
      "Unlimited Restoration of Cover",
    ],
    extraPlans: "8 more plans",
    video: true,
    logo: manicon,
    compare: false,
  },
  {
    id: 2,
    brand: "Niva Bupa",
    name: "Aspire Gold+ Value (Direct)",
    cover: "₹10 Lakh",
    premium: "₹641/month",
    annualPremium: "₹7,686 annually",
    hospitals: 194,
    features: [
      "Single pvt AC Room",
      "₹10 lakh No Claim Bonus",
      "Unlimited Restoration of Cover, Forever",
    ],
    extraPlans: "12 more plans",
    logo: manicon,
    compare: false,
  },
  {
    id: 3,
    brand: "Star Health",
    name: "Super Star",
    cover: "₹10 Lakh",
    premium: "₹675/month",
    annualPremium: "₹8,100 annually",
    hospitals: 285,
    features: [
      "No Room Rent Limit",
      "₹5 lakh No Claim Bonus",
      "Restoration of cover unlimited times in a year",
    ],
    extraPlans: "7 more plans",
    video: true,
    logo: manicon,
    compare: false,
    newLaunch: true,
  },
];

const health6 = () => {
    const router =useRouter();
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
            <button>Doctor Consultation and Pharmacy</button>
            <button>No room rent limit</button>
            <button>
              <CiFilter />
              All filters
            </button>
          </div>
        </div>

        <span className={styles.planFilter}>75 plans found</span>

        {plans.map((plan) => (
          <div className={styles.mainContainer} key={plan.id}>
            {/* Desktop: Brand card on left */}
            <div className={styles.cardContainer}>
              <div className={styles.card}>
                <div className={styles.logoSection}>
                  <Image src={plan.logo} alt={`${plan.brand} logo`} width={40} height={40} />
                  <span className={styles.extraPlans}>{plan.extraPlans}</span>
                </div>
              </div>
            </div>

            {/* Main info */}
            <div className={styles.cardContainer1}>
              <div className={styles.card1}>
                {/* Logo inside for mobile/tablet */}
                <div className={styles.logoSectionMobile}>
                  <Image src={plan.logo} alt={`${plan.brand} logo`} fill />
                </div>

                <div className={styles.detailsSection}>
                  <div className={styles.titleRow}>
                    <h3>{plan.name}</h3>
                    {plan.newLaunch && <span className={styles.newTag}>New Launch</span>}
                  </div>
                  <p className={styles.hospitals}>
                    <FaBriefcaseMedical className={styles.medicalIcon} />
                    {plan.hospitals} Cashless hospitals. <span className={styles.viewList}>View list ›</span>
                  </p>
                  <ul className={styles.features}>
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>
                        <FaCheck className={styles.checkIcon} /> {feature}
                      </li>
                    ))}
                  </ul>
                  <div className={styles.links}>
                    <span>View all features ›</span>
                    {plan.video && <span className={styles.video}>Watch plan video 🎥</span>}
                  </div>
                </div>

                <div className={styles.rightSection}>
                  <div className={styles.cover}>
                    <div className={styles.coverAmount}>
                      Cover amount{" "}
                      <select>
                        <option>
                          <strong>{plan.cover}</strong>
                        </option>
                      </select>
                    </div>
                    <div className={styles.premium}>
                      Premium <strong>{plan.premium}</strong>
                      <br />
                      {plan.annualPremium}
                    </div>
                  </div>
             
                  <button className={styles.customize} onClick={()=>{router.push('/cart/healthinsurancecart')}}>Customize plan ›</button>
                  <label className={styles.compare}>
                    <input type="checkbox" /> Add to compare
                  </label>
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

export default health6;
