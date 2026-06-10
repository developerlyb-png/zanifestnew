"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/statemanager.module.css";
import { useRouter } from "next/router";

type Manager = {
  _id: string;
  managerId?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  district?: string;
  email?: string;
  totalSales: number;
};

const DistrictManagerTable: React.FC = () => {
  const router = useRouter();
  const [districtManagers, setDistrictManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDistrictManagers() {
      try {
        const token = localStorage.getItem("managerToken");

        const res = await fetch("/api/manager/district-with-sales", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();
        setDistrictManagers(data.data || []);
      } catch (error) {
        console.error("Error fetching district managers:", error);
        setDistrictManagers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDistrictManagers();
  }, []);

  return (
    <div className={styles.agentTable}>
      <h3 className={styles.tableTitle}>District Managers List</h3>

      <div className={styles.tableWrapper}>
        {loading ? (
          <p style={{ textAlign: "center" }}>Loading...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>E-mail</th>
                <th>City</th>
                <th>State</th>
                <th>District</th>
                <th>Total Sales</th>
              </tr>
            </thead>

            <tbody>
              {districtManagers.length > 0 ? (
                districtManagers.map((manager) => (
                  <tr key={manager._id}>
                    <td>{manager.managerId || manager._id.slice(-5)}</td>
                    <td>{`${manager.firstName || ""} ${manager.lastName || ""}`}</td>
                    <td>{manager.email || "N/A"}</td>
                    <td>{manager.city}</td>
                    <td>{manager.state}</td>
                    <td>{manager.district}</td>
                    <td>₹ {manager.totalSales?.toLocaleString("en-IN")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "1rem" }}>
                    No district managers found...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DistrictManagerTable;
