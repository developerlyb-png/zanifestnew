"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import useSWR, { mutate } from "swr";
import BestServicesSection from "@/components/home/BestServicesSection";
import styles from "@/styles/components/superadminsidebar/BestServicesAdmin.module.css";

// Shared ServiceType
export type ServiceType = "support" | "claim" | "installment";

export interface ServiceItem {
  _id?: string;
  type: ServiceType;  // Fixed from string
  name: string;
  desc: string;
}

interface ServiceData {
  heading: string;
  services: ServiceItem[];
}

const LIST_FALLBACK: ServiceItem[] = [
  {
    type: "support",
    name: "24X7 Support",
    desc: "Our dedicated customer support team is available 24/7 to guide you at every step of your insurance journey.",
  },
  {
    type: "claim",
    name: "Easy Claim System",
    desc: "Hassle-free claim process designed to get you quick resolutions when you need them the most.",
  },
  {
    type: "installment",
    name: "Easy Installments",
    desc: "Flexible and easy premium installment options to suit every budget and keep you worry-free.",
  },
];

export default function BestServicesAdmin() {
  const { data } = useSWR<ServiceData>("/api/bestservice", (url: string) =>
    fetch(url).then((res) => res.json())
  );

  const [heading, setHeading] = useState("Best Service");
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>(LIST_FALLBACK);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setHeading(data.heading || "Best Service");
      setServiceItems(
        data.services && data.services.length > 0 ? data.services : LIST_FALLBACK
      );
      setIsDataLoaded(true);
    }
  }, [data]);

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const payload = {
        heading,
        services: serviceItems,
      };
      const res = await axios.post("/api/bestservice", payload);
      mutate("/api/bestservice", res.data, false);
      alert("Saved successfully.");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleServiceChange = (
    index: number,
    field: keyof ServiceItem,
    value: string
  ) => {
    setServiceItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  return (
    <>
      {/* Live Preview */}
      <div className={styles.previewBox}>
        <h3>Live Preview</h3>
        <BestServicesSection
          liveHeading={heading}
          liveServices={serviceItems}
        />
      </div>

      <div className={styles.container}>
        <h2 className={styles.pageTitle}>Edit Best Services </h2>

        {/* Single Heading Input */}
        <div className={styles.headingBox}>
          <h3>Edit Heading</h3>
          <input
            type="text"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            disabled={!isDataLoaded}
            placeholder="Enter heading (e.g. Best Service)"
            className={styles.headingInput}
          />
          <button onClick={handleSaveAll} disabled={!isDataLoaded || saving}>
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>

        {/* Services Form */}
        <div className={styles.servicesGrid}>
          {serviceItems.map((item, index) => (
            <div key={item.type + "-" + index} className={styles.serviceCard}>
              <h4>{item.type.toUpperCase()}</h4>
              <input
                type="text"
                value={item.name}
                onChange={(e) =>
                  handleServiceChange(index, "name", e.target.value)
                }
                disabled={!isDataLoaded}
              />
              <textarea
                value={item.desc}
                onChange={(e) =>
                  handleServiceChange(index, "desc", e.target.value)
                }
                disabled={!isDataLoaded}
                rows={3}
              />
              <button
                onClick={handleSaveAll}
                disabled={!isDataLoaded || saving}
              >
                Save {item.type}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
