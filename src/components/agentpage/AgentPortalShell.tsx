"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import styles from "@/styles/pages/agent.module.css";
import AgentHeader from "@/components/agentpage/agentheader";
import AgentSidebar from "@/components/agentpage/agentsidebar";
import { AgentShellContext } from "@/context/AgentShellContext";

// While an agent is selling from the portal's Buy Insurance tab (agentSellMode
// cookie), every website page — product pages, quote/proposal/checkout steps,
// payment return pages — is rendered inside the agent portal layout, so the
// agent header and sidebar stay visible throughout. Pages stay real top-level
// pages (not an iframe), so insurer payment redirects keep working.
//
// The tree shape is the same whether the shell is on or off (placeholders
// instead of removed nodes), so turning it on after mount doesn't remount
// the page and lose its state.

const COOKIE = "agentSellMode";

// Routes that never get the shell: the portal itself, logins, and the
// admin/manager panels.
const EXCLUDED = [
  "/agentpage",
  "/agentlogin",
  "/agentsignup",
  "/assessmenttraining",
  "/createagent",
  "/set-password",
  "/userpage",
  "/dashboard",
  "/admin",
  "/superadmin",
  "/manager",
  "/districtmanager",
  "/statemanager",
  "/nationalmanager",
];

function sellModeOn() {
  return typeof document !== "undefined" && document.cookie.split("; ").includes(`${COOKIE}=1`);
}

type Profile = { firstName?: string; lastName?: string; email?: string; profileImage?: string } | null;

export default function AgentPortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sellMode, setSellMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [profile, setProfile] = useState<Profile>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSellMode(sellModeOn());
  }, [router.asPath]);

  const active = sellMode && !EXCLUDED.some((p) => router.pathname.toLowerCase().startsWith(p));

  // Load the agent's name/profile once the shell is shown.
  useEffect(() => {
    if (!active || profile) return;
    try {
      setAgentName(localStorage.getItem("agentName") || sessionStorage.getItem("agentSellName") || "");
    } catch {
      /* storage blocked */
    }
    axios
      .get("/api/agent/me", { withCredentials: true })
      .then((res) => res.data?.agent && setProfile(res.data.agent))
      .catch((err) => {
        // Agent session gone — stop wrapping the site in the portal.
        if (err?.response?.status === 401) {
          document.cookie = `${COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          setSellMode(false);
        }
      });
  }, [active, profile]);

  // The page scrolls inside the content pane, not the window.
  useEffect(() => {
    const top = () => contentRef.current?.scrollTo({ top: 0 });
    router.events.on("routeChangeComplete", top);
    return () => router.events.off("routeChangeComplete", top);
  }, [router]);

  // Sidebar / profile-menu navigation goes back to that portal section.
  const goToSection = useCallback(
    ((value: React.SetStateAction<string>) => {
      const section = typeof value === "function" ? value("buyinsurance") : value;
      setSidebarOpen(false);
      router.push(`/agentpage?section=${encodeURIComponent(section)}`);
    }) as React.Dispatch<React.SetStateAction<string>>,
    [router]
  );

  const handleLogout = async () => {
    try {
      await axios.post("/api/agent/logout", {}, { withCredentials: true });
    } catch {
      /* fall through to the login page anyway */
    }
    document.cookie = `${COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    ["agentName", "agentTestPassed", "training_currentVideo", "training_completed", "training_testStarted"].forEach(
      (k) => localStorage.removeItem(k)
    );
    router.replace("/agentlogin");
  };

  const exitSelling = () => {
    document.cookie = `${COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    router.push("/agentpage");
  };

  return (
    <AgentShellContext.Provider value={active}>
      <div className={active ? styles.wrapper : undefined}>
        {active ? (
          <AgentHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            handleLogout={handleLogout}
            agentProfile={profile}
            setActiveSection={goToSection}
          />
        ) : null}
        <div className={active ? styles.mainArea : undefined}>
          {active ? (
            <AgentSidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              setActiveSection={goToSection}
              activeSection="buyinsurance"
              handleLogout={handleLogout}
              agentName={agentName}
              agentProfile={profile}
            />
          ) : null}
          <div ref={contentRef} className={active ? styles.content : undefined} style={active ? { padding: 0 } : undefined}>
            {active ? (
              <div
                role="status"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "8px 16px",
                  background: "#e8f1fd",
                  borderBottom: "1px solid #cfe0f8",
                  fontSize: 13.5,
                }}
              >
                <span style={{ color: "#1e3a5f" }}>
                  Selling as agent{agentName ? ` ${agentName}` : ""} — policies issued here are saved under your account.
                </span>
                <span style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => router.push("/agentpage?section=buyinsurance")}
                    style={{ background: "#2a78d6", color: "#fff", border: 0, borderRadius: 8, padding: "5px 12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    ← All products
                  </button>
                  <button
                    type="button"
                    onClick={exitSelling}
                    style={{ background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}
                  >
                    Exit selling
                  </button>
                </span>
              </div>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </AgentShellContext.Provider>
  );
}
