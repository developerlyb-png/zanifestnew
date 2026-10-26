"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { APPLICATIONS_CHANGED_EVENT } from "./reviewapplication";

const POLL_MS = 60 * 1000;

// Count of new (unopened) agent applications, shown next to the
// "Review Application" sidebar item in both admin panels.
const ReviewApplicationBadge = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await axios.get("/api/admin/agentApplications?countOnly=1");
        if (!cancelled) setCount(res.data?.counts?.new || 0);
      } catch {
        // badge is informational only — ignore failures
      }
    };

    fetchCount();
    const timer = setInterval(fetchCount, POLL_MS);
    window.addEventListener(APPLICATIONS_CHANGED_EVENT, fetchCount);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(APPLICATIONS_CHANGED_EVENT, fetchCount);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span
      title={`${count} new application${count > 1 ? "s" : ""}`}
      style={{
        marginLeft: 8,
        minWidth: 20,
        height: 20,
        padding: "0 6px",
        borderRadius: 999,
        background: "#7c3aed",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default ReviewApplicationBadge;
