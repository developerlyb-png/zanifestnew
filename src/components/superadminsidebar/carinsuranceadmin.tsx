// pages/admin/carinsuranceadmin.tsx
"use client";
import React, { useEffect, useState, useRef } from "react";
import { mutate } from "swr";
import CarInsuraceSection from "@/components/home/CarInsuraceSection";
import styles from "@/styles/components/superadminsidebar/CarInsuranceAdmin.module.css";

const DEFAULT_ORDER = [
  "Family Health Insurance",
  "Marine Insurance",
  "Travel Insurance",
  "Car Insurance",
  "⁠2 wheeler Insurance",
  "Shop Insurance",
  "Third Party Insurance",
  "Commercial Vehicle",
  "Home Insurance",
  "Office Package Policy",
  "Doctor Indemnity Insurance",
  "Director & Officer Liability Insurance",
];

export default function CarInsuranceAdminPage() {
  const [heading, setHeading] = useState("Click to buy an Insurance");
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [loading, setLoading] = useState(true);
  const dragIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchCfg = async () => {
      const res = await fetch("/api/carinsuranceapi");
      const data = await res.json();
      if (data.heading) setHeading(data.heading);
      if (Array.isArray(data.order)) setOrder(data.order);
      setLoading(false);
    };
    fetchCfg();
  }, []);

  const onDragStart = (idx: number) => () => {
    dragIndexRef.current = idx;
  };
  const onDragOver = () => (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(from, 1);
    newOrder.splice(idx, 0, moved);
    setOrder(newOrder);
    dragIndexRef.current = null;
  };

  const saveHeading = async () => {
    await fetch("/api/carinsuranceapi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heading }),
    });
    await mutate("/api/carinsuranceapi");
    alert("Heading saved successfully ✅");
  };

  const saveOrder = async () => {
    await fetch("/api/carinsuranceapi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    await mutate("/api/carinsuranceapi");
    alert("Order saved successfully ✅");
  };

  if (loading) return <div>Loading...</div>;
return (
  <>
    <div>
 <div className={styles.previewContent}> 
      <h2>Live Preview</h2>
        <CarInsuraceSection initialHeading={heading} initialOrder={order} />
      </div>
          </div>
  
  <div className={styles.container}>

    

    {/* Edit Form Card */}
    <div className={styles.card}>
      <h2 className={styles.title}>Edit Car Insurance Section</h2>

      {/* Heading Edit */}
      <input
        value={heading}
        onChange={(e) => setHeading(e.target.value)}
        className={styles.headingInput}
        placeholder="normal text <orange>
"
      />
      <button onClick={saveHeading} className={styles.saveHeadingBtn}>
        Save Heading
      </button>

      {/* Reorder Section */}
      <div className={styles.orderWrapper}>
        <div className={styles.orderLabel}>Reorder Items (Drag & Drop)</div>
        <div className={styles.orderBox}>
          {order.map((name, idx) => (
            <div
              key={name}
              draggable
              onDragStart={onDragStart(idx)}
              onDragOver={onDragOver()}
              onDrop={onDrop(idx)}
              className={styles.orderItem}
            >
              {name}
            </div>
          ))}
        </div>
        <button onClick={saveOrder} className={styles.saveOrderBtn}>
          Save Order
        </button>
      </div>
    </div>

  </div>
  </>
);




}
