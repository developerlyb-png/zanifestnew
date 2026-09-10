"use client";

import React, { useState } from "react";
import styles from "@/styles/components/superadminsidebar/ConfigManagement.module.css";
import LineOfBusiness from "./LineOfBusiness";
import Products from "./Products";

type ConfigTab =
  | "lineOfBusiness"
  | "products"
  | "branch"
  | "insuranceCompany"
  | "documents"
  | "expenseCategories";

const TABS: { key: ConfigTab; label: string }[] = [
  { key: "lineOfBusiness", label: "Line of Business" },
  { key: "products", label: "Products" },
  { key: "branch", label: "Branch" },
  { key: "insuranceCompany", label: "Insurance Company" },
  { key: "documents", label: "Documents" },
  { key: "expenseCategories", label: "Expense Categories" },
];

export default function ConfigManagement() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("lineOfBusiness");

  return (
    <div>
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
      {activeTab !== "lineOfBusiness" && activeTab !== "products" && (
        <div className={styles.comingSoon}>
          {TABS.find((t) => t.key === activeTab)?.label} configuration is coming soon.
        </div>
      )}
    </div>
  );
}
