"use client";

import React, { useState } from "react";
import styles from "@/styles/components/superadminsidebar/ConfigManagement.module.css";
import LineOfBusiness from "./LineOfBusiness";
import Products from "./Products";
import BranchConfig from "./BranchConfig";
import InsuranceCompanyConfig from "./InsuranceCompanyConfig";
import ReconcileMapping from "./ReconcileMapping";

type ConfigTab = "lineOfBusiness" | "products" | "branch" | "insuranceCompany" | "mapping";

const TABS: { key: ConfigTab; label: string }[] = [
  { key: "lineOfBusiness", label: "Line of Business" },
  { key: "products", label: "Products" },
  { key: "branch", label: "Branch" },
  { key: "insuranceCompany", label: "Insurance Company" },
  { key: "mapping", label: "Mapping" },
];

export default function ConfigManagement() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("lineOfBusiness");

  return (
    <div className={styles.configurationPage}>
      <h1 className={styles.pageTitle}>Configuration Management</h1>

      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "lineOfBusiness" && <LineOfBusiness />}
      {activeTab === "products" && <Products />}
      {activeTab === "branch" && <BranchConfig />}
      {activeTab === "insuranceCompany" && <InsuranceCompanyConfig />}
      {activeTab === "mapping" && <ReconcileMapping />}
    </div>
  );
}
