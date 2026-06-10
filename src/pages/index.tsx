"use client";
import { useEffect, useState } from "react";
import Head from "next/head";
import styles from "@/styles/pages/index.module.css";
import UserDetails from "@/components/ui/UserDetails";
import Navbar from "@/components/ui/Navbar";
import Main from "@/components/home/Main";
import CarInsuraceSection from "@/components/home/CarInsuraceSection";
import DemoSection from "@/components/home/DemoSection";
import BestServicesSection from "@/components/home/BestServicesSection";
import AllInsuranceSection from "@/components/home/AllInsuranceSection";
import HowWorksSections from "@/components/home/HowWorksSections";
import FeedBackSection from "@/components/home/FeedBackSection";
import FAQSection from "@/components/home/FAQSection";
import Footer from "@/components/ui/Footer";
import Partners from "@/components/home/Partners";
import Loader from "@/components/ui/loader";
import axios from "axios";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const apis = [
          "/api/partnersApi",
          "/api/demoapi",
          "/api/bestservices",
          "/api/allinsuranceapi",
          "/api/feedback",
          "/api/faq",
          "/api/howworksapi",
          "/api/getimage",
          "/api/carinsuranceapi",
        ];

        const results = await Promise.allSettled(
          apis.map((api) => axios.get(api))
        );

        results.forEach((res, i) => {
          if (res.status === "fulfilled") {
            console.log(`${apis[i]} data:`, res.value.data);
          } else {
            console.warn(`${apis[i]} failed:`, res.reason.message);
          }
        });
      } catch (error) {
        console.error("Unexpected error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
    <>
      <Head>
        <title>Zanifest - Buy Car, Bike & Health Insurance Online in India</title>
        <meta name="description" content="Compare and buy insurance policies instantly on Zanifest. Get the best quotes for car, bike, health, and term life insurance with 24/7 claims support." />
        <meta name="Insurance" content="Get best value insurances" />
      </Head>

      {loading ? (
        <Loader />
      ) : (
        <div className={styles.cont}>
          <UserDetails />
          <Navbar />
          <Main />
          <CarInsuraceSection />
          <DemoSection />
          <BestServicesSection />
          <Partners />
          <AllInsuranceSection />
          <HowWorksSections />
          <FeedBackSection />
          <FAQSection />
          <Footer />
        </div>
      )}
    </>
  );
}
