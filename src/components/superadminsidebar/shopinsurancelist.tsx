"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/shopinsurancelist.module.css";
import { FiDownload, FiSearch } from "react-icons/fi";

interface ShopRecord {
  _id: string;
  email: string | null;
  phone: string;
  assignedTo?: string | null;
  createdAt: string;
  [key: string]: any;
}

interface AgentRecord {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

const ShopInsuranceList = () => {
  const [shopData, setShopData] = useState<ShopRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedShop, setSelectedShop] = useState<ShopRecord | null>(null);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [assignFilter, setAssignFilter] = useState<"all" | "assigned" | "unassigned">("all");

  const fetchShopData = async () => {
    setLoading(true);
    const res = await axios.get("/api/shopinsurance");
    setShopData(res.data.data || []);
    setLoading(false);
  };

  const fetchAgents = async () => {
    const res = await axios.get("/api/getallagents");
    setAgents(res.data || []);
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  useEffect(() => {
    if (selectedShop) fetchAgents();
  }, [selectedShop]);

  const handleAssign = async () => {
    if (!selectedAgent) return alert("Please select an agent");

    await axios.post("/api/shopinsurance?assign=true", {
      shopId: selectedShop?._id,
      agentId: selectedAgent,
    });

    alert("Lead Assigned!");
    setSelectedShop(null);
    setSelectedAgent("");
    fetchShopData();
  };

  const filteredShopData = shopData
    .filter((shop) =>
      assignFilter === "all"
        ? true
        : assignFilter === "assigned"
        ? !!shop.assignedTo
        : !shop.assignedTo
    )
    .filter((shop) =>
      `${shop.email || ""} ${shop.phone || ""} ${shop.assignedTo || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  const exportCsv = () => {
    const headers = ["S.No", "Email", "Phone", "Assigned To"];
    const rows = filteredShopData.map((shop, index) => [
      index + 1,
      shop.email || "-",
      shop.phone || "-",
      shop.assignedTo || "Not Assigned",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shop-insurance-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Shop Insurance List</h2>
        <button className={styles.exportBtn} onClick={exportCsv}>
          <FiDownload size={15} /> Export CSV
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.pillGroup}>
          {[
            { key: "all", label: "All" },
            { key: "assigned", label: "Assigned" },
            { key: "unassigned", label: "Not Assigned" },
          ].map((f) => (
            <button
              key={f.key}
              className={`${styles.pill} ${assignFilter === f.key ? styles.pillActive : ""}`}
              onClick={() => setAssignFilter(f.key as "all" | "assigned" | "unassigned")}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={styles.searchBox}>
          <FiSearch size={14} />
          <input
            placeholder="Search by email, phone, or agent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Assigned To</th>
              <th>Show</th>
            </tr>
          </thead>

          <tbody>
            {filteredShopData.map((shop, index) => (
              <tr
                key={shop._id}
                onClick={() => setSelectedShop(shop)}
              >
                <td>{index + 1}</td>
                <td>{shop.email || "-"}</td>
                <td>{shop.phone}</td>
                <td>{shop.assignedTo || "Not Assigned"}</td>
                <td>
                  <button
                    className={styles.showBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShop(shop);
                    }}
                  >
                    Show
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {selectedShop && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Shop Insurance Details</h3>

            <div className={styles.modalContent}>
              {Object.entries(selectedShop).map(([k, v]) => (
                <p key={k}>
                  <strong>{k}</strong>
                  <span>{v?.toString()}</span>
                </p>
              ))}
            </div>

            <label className={styles.assignLabel}>Select Agent</label>
            <select
              className={styles.agentDropdown}
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="">Select Agent</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.firstName} {agent.lastName} ({agent.email})
                </option>
              ))}
            </select>

            <div className={styles.modalFooter}>
              <button className={styles.assignBtn} onClick={handleAssign}>
                Assign To Agent
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedShop(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopInsuranceList;
