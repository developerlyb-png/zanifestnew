import React, { useState, useEffect } from "react";
import styles from "@/styles/pages/TwoWheeler/twowheeler5.module.css";
import Image from "next/image";
import bajaj from "@/assets/liclogo.png";
import tata from "@/assets/liclogo.png";
import icici from "@/assets/liclogo.png";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { RiEBikeLine } from "react-icons/ri";
import { VscSettings } from "react-icons/vsc";
import { LuTicketsPlane, LuArrowDownUp } from "react-icons/lu";
import { IoMdMenu, IoMdClose } from "react-icons/io"; // icons for toggle
import {useRouter} from 'next/router'
import { FaFilter } from "react-icons/fa";

// const plans = [
//   {
//     id: 1,
//     logo: bajaj,
//     name: "Bajaj Allianz",
//     idv: "₹15,642",
//     price: "₹728",
//     badge: "Free Road Side Assistance (RSA) included",
//     highlight: "green",
//   },
//   {
//     id: 2,
//     logo: tata,
//     name: "Tata AIG",
//     idv: "₹17,201",
//     price: "₹729",
//     badge: "Instant buy in 30 sec",
//     highlight: "orange",
//   },
//   {
//     id: 3,
//     logo: icici,
//     name: "ICICI Lombard",
//     idv: "₹23,550",
//     price: "₹735",
//     badge: "Value for money",
//     highlight: "green",
//   },
// ];
const dummyPlans = [
  {
    id: 1,
    logo: bajaj,
    name: "SBI General",
    idv: "₹15,642",
    price: "₹728",
     gst: "₹0",
    badge: "Free Road Side Assistance included",
    highlight: "green",
  },
];
const twowheeler5 = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
const [plans, setPlans] = useState(dummyPlans);
const [bikeData, setBikeData] = useState<any>(null);
const [zunoQuote, setZunoQuote] = useState<any>(null);
 useEffect(() => {


  const fetchQuotes = async () => {


    try {


      const storedData =
        localStorage.getItem(
          "selectedBikeData"
        );


      if(!storedData){
        return;
      }


      const bike =
      JSON.parse(storedData);


      // sidebar data
      setBikeData(bike);



      const response =
      await fetch(
         "/api/sbi/2w/rating",
        {

          method:"POST",

          headers:{
            "Content-Type":
            "application/json",
          },


     body: JSON.stringify({

 policyType:"Comprehensive",


 vehicle:{


  registrationNumber:
  bike.vehicleNumber,


  make:
  bike.make,


  model:
  bike.model,


  variant:
  bike.variant || "BS VI",


  manufacturingYear:
  bike.year


 },


 customer:{

  customerType:"Individual"

 }


})

        }
      );



      const result =
      await response.json();



      console.log(
        "SBI 2W RESPONSE",
        result
      );



   if(result.success){


const quote =
result.data;


// ZUNO FULL RESPONSE SAVE
setZunoQuote(
  quote
);


setPlans([

{

id:1,

logo:bajaj,

name:
"Zuno General Insurance",


idv:
`₹${quote
?.contractDetails?.[0]
?.insuredObject
?.systemIdv || 0}`,


price:
`₹${Math.round(
quote
?.premiumDetails
?.grossTotalPremium || 0
)}`,


// ADD GST HERE
gst:
`₹${Math.round(
quote
?.premiumDetails
?.totalTax || 
quote
?.premiumDetails
?.gst ||
0
)}`,


badge:
`OD ₹${
quote?.premiumDetails?.totalODPremium
}
 | Addon ₹${
quote?.premiumDetails?.totalAddOnPremium
}`,


highlight:
"green"

}

]);


}


    }
    catch(error){

      console.log(
        "2W QUOTE ERROR",
        error
      );

    }


  };



  fetchQuotes();



},[]);

useEffect(() => {

  const handleResize = () => {

    setIsMobile(
      window.innerWidth <= 1024
    );


    if(window.innerWidth > 1024){

      setSidebarOpen(false);

    }

  };


  handleResize();


  window.addEventListener(
    "resize",
    handleResize
  );


  return () =>

    window.removeEventListener(
      "resize",
      handleResize
    );


},[]);
    const router =useRouter();
  return (
    <div>
      <UserDetails />
      <Navbar />

      <div className={styles.wrapper}>
        {/* Icon Toggle */}
        {isMobile && (
          <div className={styles.toggleIcon} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <IoMdClose size={24} /> : <FaFilter  />}
          </div>
        )}

        {/* Sidebar Slide-In */}
        <aside className={`${styles.sidebar} ${isMobile ? styles.mobileSidebar : ""} ${sidebarOpen ? styles.open : ""}`}>
          <div className={styles.card}>
            <h4><RiEBikeLine /> Your scooter details <span className={styles.edit}>Edit</span></h4>
           <p>
  <strong>
    {bikeData?.make} {bikeData?.model}
  </strong>
</p>

<p>
  {bikeData?.vehicleNumber} | {bikeData?.year} registered
</p>
          </div>

          <div className={styles.card}>
            <h4><VscSettings /> Addons <span className={styles.link}>Know more</span></h4>
            <label><input type="checkbox" /> Personal Accident Cover</label>
            <label><input type="checkbox" /> PA cover for passenger</label>
          </div>

          <div className={styles.card}>
            <h4><LuTicketsPlane /> Plan duration</h4>
            <select>
              <option>1 year</option>
              <option>2 years</option>
              <option>3 years</option>
            </select>
          </div>

          <div className={styles.card}>
            <h4><LuArrowDownUp /> Sort by</h4>
            <label><input type="radio" name="sort" /> Recommended</label>
            <label><input type="radio" name="sort" defaultChecked /> Premium (low to high)</label>
            <label><input type="radio" name="sort" /> Premium (high to low)</label>
            <label><input type="radio" name="sort" /> IDV (high to low)</label>
          </div>
        </aside>

        {/* Main Plans */}
        <main className={styles.main}>
          <div className={styles.planControls}>
            <div className={styles.planBox}>
              <span className={styles.planLabel}>Plan Type</span>
              <span className={styles.planValue}>Comprehensive ▾</span>
            </div>
            <div className={styles.planBox}>
              <span className={styles.planLabel}>Insured Declared Value (IDV)</span>
              <span className={styles.planValue}>Lowest ▾</span>
            </div>
          </div>

          <p className={styles.heading}>
  {plans.length} comprehensive plans available
</p>
          <p className={styles.subtext}>Covers damages to your vehicle and third-party</p>

          <div className={styles.planList}>
            {plans.map((plan) => (
              <div key={plan.id} className={styles.planCard}>
                <div className={styles.planLeft}>
                  <div className={styles.logoSection}>
                    <Image src={plan.logo} alt={plan.name} width={100} height={30} />
                    <p>{plan.name}</p>
                  </div>
                  <div>
                    <p className={styles.idvLabel}>IDV</p>
                    <p className={styles.idvValue}>{plan.idv}</p>
                  </div>
                  <button className={styles.buyBtn} onClick={() => {

  const selectedPlan = {

  company:
  plan.name,


  premium:
  plan.price,


  idv:
  plan.idv,


  policyType:
  "Bundled Insurance",

gst:
plan.gst, 
  bikeData,


  zunoQuote:
  zunoQuote

};


console.log(
 "SAVE PLAN",
 selectedPlan
);

  localStorage.setItem(
    "selectedInsurancePlan",
    JSON.stringify(selectedPlan)
  );

  localStorage.setItem(
  "selectedBikePlan",
  JSON.stringify(plan)
);

router.push("/cart/bikeinsurancecart");
}}>
                    Buy now <span>{plan.price}</span>
                    <MdOutlineKeyboardArrowRight />
                  </button>
                </div>
                <p
className={`${styles.badge} ${
styles[
plan.highlight as keyof typeof styles
]
}`}
>{plan.badge}</p>
              </div>
            ))}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default twowheeler5;
