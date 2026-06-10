"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/pages/nationalmanager.module.css";

type Manager = {
  _id: string;
  name: string;
  email: string;
  state: string;
  phone: string;
  address: string;
  totalSales: number;
};

const StateManagerList: React.FC = () => {
  const [stateManagers, setStateManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStateManagers = async () => {
    try {
      const token = localStorage.getItem("managerToken");

      const res = await axios.get("/api/manager/state-with-sales", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStateManagers(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching state managers:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStateManagers();
  }, []);

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>State Managers</h3>

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>State Manager</th>
                <th>Email</th>
                <th>State</th>
                <th>Total Sales</th>
                <th>Phone</th>
                <th>Address</th>
              </tr>
            </thead>

            <tbody>
              {stateManagers.length > 0 ? (
                stateManagers.map((m) => (
                  <tr key={m._id}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{m.state}</td>
                    <td>₹ {m.totalSales?.toLocaleString("en-IN")}</td>
                    <td>{m.phone}</td>
                    <td>{m.address}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.noData}>
                    No managers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StateManagerList;
