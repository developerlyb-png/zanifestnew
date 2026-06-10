import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import Image from "next/image";
import React, { useState } from "react";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaRegCalendarAlt } from "react-icons/fa"; // calendar icon

import styles from "@/styles/pages/internationaltravel.module.css";

const LIST = [
  {
    id: 1,
    image: require("@/assets/pageImages/intertravel/1.png"),
    desc: "Region Specific Plans",
  },
  {
    id: 2,
    image: require("@/assets/pageImages/intertravel/2.png"),
    desc: "Out-patient & In-patient \nTreatment",
  },
  {
    id: 3,
    image: require("@/assets/pageImages/intertravel/3.png"),
    desc: "Loss of Passport & \nCheckin Baggage",
  },
];

const COUNTRYLIST = [
  {
    id: 1,
    name: "United States of America (USA)",
  },
  {
    id: 2,
    name: "United Kingdoms (UK)",
  },
  {
    id: 3,
    name: "Australia",
  },
  {
    id: 4,
    name: "Canada",
  },
  {
    id: 5,
    name: "United Arab Emirates(UAE)",
  },
  {
    id: 6,
    name: "Singapore",
  },
  {
    id: 7,
    name: "Germany",
  },
  {
    id: 8,
    name: "Italy",
  },
  {
    id: 9,
    name: "Spain",
  },
];

function internationaltravel() {
  const [multiTrip, setMultiTrip] = useState<boolean>(false);

  function selectMultipleTrips(multiple: boolean) {
    setMultiTrip(multiple);
  }

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  return (
    <div>
      <UserDetails />
      <Navbar />
      <div className={styles.cont}>
        <div className={styles.left}>
          <Image
            src={require("@/assets/pageImages/intertravel/4.png")}
            alt="travel"
            className={styles.mainImage}
          />
          <h3 className={styles.head1}>Secure Your Internaional Travel</h3>
          <h3 className={styles.head2}>With care Travel Insurance</h3>
          <div className={styles.iconList}>
  {LIST.map((item) => (
    <div key={item.id} className={styles.iconItem}>
      <Image
        src={item.image}
        alt={item.desc}
        className={styles.iconImage}
      />
      <p className={styles.iconDesc}>
        {item.desc.split("\n").map((line, index) => (
          <span key={index}>
            {line}
            <br />
          </span>
        ))}
      </p>
    </div>
  ))}
</div>

        </div>
        <div className={styles.right}>
          <form action="" className={styles.form}>
            <h3 className={styles.formHead}>Select Your Travel Destination</h3>
            <input
              type="text"
              className={styles.mainInput}
              placeholder="Search Country"
            />

            <p className={styles.label}>Most Visited Countries</p>
            <div className={styles.countryList}>
              {COUNTRYLIST.map((item) => {
                return (
                  <div key={item.id} className={styles.countryItem}>
                    <p className={styles.countryName}>{item.name}</p>
                  </div>
                );
              })}
            </div>

            <div className={styles.multiTrip}>
              <p className={styles.label}>
                Do you want an annual policy that covers multiple trips this
                year?
              </p>
              <div className={styles.multiRadio}>
                <input
                  type="radio"
                  id="true"
                  name="Yes"
                  value="true"
                  onChange={() => {
                    selectMultipleTrips(true);
                  }}
                  checked={multiTrip}
                  className={styles.radio}
                />
                <label htmlFor="" className={styles.radioLabel}>
                  Yes
                </label>
                <input
                  type="radio"
                  id="false"
                  name="No"
                  value="false"
                  onChange={() => {
                    selectMultipleTrips(false);
                  }}
                  className={styles.radio}
                  checked={!multiTrip}
                />
                <label htmlFor="" className={styles.radioLabel}>
                  No
                </label>
              </div>
            </div>
            <div className={styles.dateDiv}>
              <p className={styles.label}>Select Travel Dates</p>
             <div className={styles.inputDiv}>
  <div className={styles.dateInputContainer}>
    <DatePicker
      selected={startDate}
      onChange={(date) => setStartDate(date)}
      placeholderText="Trip Start Date"
      className={styles.dateInput}
    />
      <FaRegCalendarAlt className={styles.calendarIcon} />
  </div>
  <div className={styles.dateInputContainer}>
    <DatePicker
      selected={endDate}
      onChange={(date) => setEndDate(date)}
      placeholderText="Trip End Date"
      className={styles.dateInput}
    />
      <FaRegCalendarAlt className={styles.calendarIcon} />
  </div>
</div>


            </div>
            <button type="submit" className={styles.submitButton}>
              Get Quote in 2 Steps
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default internationaltravel;
