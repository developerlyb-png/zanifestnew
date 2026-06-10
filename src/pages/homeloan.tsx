import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import styles from "@/styles/pages/homeloan.module.css";
import { div } from "framer-motion/client";
import Image from "next/image";
import React from "react";

import { BsHeadset } from "react-icons/bs";

const LIST = [
  {
    id: 1,
    image: require("@/assets/pageImages/homeloan/1.png"),
    name: "Return of Premium (ROP) Option",
  },
  {
    id: 2,
    image: require("@/assets/pageImages/homeloan/2.png"),
    name: "Individual Death Claim Settlement Ratio of 99.50%",
  },
  {
    id: 3,
    image: require("@/assets/pageImages/homeloan/3.png"),
    name: "Same Day Claim Processing",
  },
];

export default function HomeLoanPage() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <h1 className={styles.head1}>Home Loan Insurance</h1>
          <p>
            Home loan insurance is a protection plan that spares the family from
            the burden of repaying the home loan's liability in the event of the
            borrower's death during the loan period. This insurance for home
            loan borrowers reduces the lender’s risk. It ensures that the
            banks/financial institutions recover the loan amount even in the
            event of the borrower’s death, disability, or loss of income. The
            period of the loan protection plan coincides with the loan term.
          </p>
          <a href="#" className={styles.readMore}>
            ...Read More
          </a>

          <h3>To delay is to regret</h3>
          <p>
            You may not always be around to take care of your family. And that's
            when a <a href="#">term insurance plan</a> ensures your family is
            well protected.
          </p>

          <div className={styles.features}>
            {LIST.map((item) => {
              return (
                <div key={item.id} className={styles.featureItem}>
                  <Image
                    className={styles.featureImage}
                    src={item.image}
                    alt="icon"
                  />{" "}
                  <p className={styles.featureName}>{item.name}</p>
                </div>
              );
            })}
          </div>

          <div className={styles.buttons}>
            <button className={styles.getQuote}>GET A FREE QUOTE</button>
            <button className={styles.talkAdvisor}>
              <BsHeadset /> TALK TO OUR ADVISOR
            </button>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.count}>66 Mn.</div>
              Lives Insured
            </div>
            <div className={styles.line}></div>
            <div className={styles.stat}>
              <div className={styles.count}>Rs. 3 Tn.</div>
              Assets under management
            </div>
            <div className={styles.line}></div>
            <div className={styles.stat}>
              <div className={styles.count}>Rs. 630.8 Bn.</div>
              Total Premiums
            </div>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.formHeader}>
            <div>
              Get{" "}
              <strong style={{ color: "#6cddfb" }}>Rs. 1 Cr. Life Cover</strong>{" "}
              at just <strong style={{ color: "#6cddfb" }}>Rs. 21/day</strong>
            </div>
            <div className={styles.headerBottom}>
              <div>7% Online Discount</div>
              <div>Save tax up to Rs. 54,600</div>
            </div>
          </div>

          <form className={styles.form}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="First Name followed by Last Name"
              required
            />

            <div className={styles.internalInputDiv}>
              <div className={styles.optionGroup}>
                <label>Are you an NRI?</label>
                <div className={styles.optionCont}>
                  <button type="button" className={styles.optionButton}>
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`${styles.optionButton} ${styles.selected}`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className={styles.optionGroup}>
                <label>Gender</label>
                <div className={styles.optionCont}>
                  <button
                    type="button"
                    className={`${styles.optionButton} ${styles.selected}`}
                  >
                    Male
                  </button>
                  <button type="button" className={styles.optionButton}>
                    Female
                  </button>
                </div>
              </div>

              <div className={styles.optionGroup}>
                <label>Do you consume tobacco?</label>
                <div className={styles.optionCont}>
                  <button type="button" className={styles.optionButton}>
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`${styles.optionButton} ${styles.selected}`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className={styles.optionGroup}>
                <label>Date Of Birth {"DOB"}</label>
                <input
                  type="date"
                  placeholder="Date of Birth (DOB)"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.optionGroup}>
                <label>Annual Income</label>
                <select required className={styles.input}>
                  <option value="">Select Income</option>
                  <option value="5">Up to 5 Lakhs</option>
                  <option value="10">5 - 10 Lakhs</option>
                  <option value="20">10 - 20 Lakhs</option>
                  <option value="30">20 Lakhs+</option>
                </select>
              </div>
              <div className={styles.optionGroup}>
                <label>Annual Income</label>
                <input
                  type="email"
                  placeholder="Email Id"
                  className={styles.input}
                  required
                />
              </div>
            </div>
            <div className={styles.optionGroup}>
              <label>Annual Income</label>
              <input
                type="tel"
                placeholder="Enter Mobile"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.optionGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" defaultChecked /> I authorize HDFC Life
                and its representatives to contact me.
              </label>
            </div>

            <button type="submit" className={styles.getQuote}>
              GET A FREE QUOTE
            </button>
          </form>

          <div className={styles.rating}>
            Customer rating <strong>4.3/5</strong> ⭐⭐⭐⭐☆ Rated by 26,893
            customers
          </div>

          <div className={styles.guide}>
            <strong>TERM INSURANCE PLANS BUYING GUIDE</strong>
            <br />
            📞 1800-266-9777 (ALL DAYS, FROM 9 AM TO 9 PM, TOLL FREE)
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
