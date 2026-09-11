"use client";

import React, { useEffect, useRef, useState } from "react";
import Module1Training from "./Module1Training";
import Module2Training from "./Module2Training";
import Module3Training from "./Module3Training";
import TestPage from "./TestPage";
import styles from "@/styles/components/videolecturedashboard/VideoLectureDashboard.module.css";
import { MODULE_SECONDS } from "@/constants/moduleTraining";

const HEARTBEAT_SECONDS = 20; // how often we persist elapsed time to the server

interface ModuleProgress {
  secondsSpent: number;
  completed: boolean;
  completedAt: string | null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export default function VideoLectureDashboard() {
  const [checking, setChecking] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [modules, setModules] = useState<ModuleProgress[]>([]);
  const [currentModule, setCurrentModule] = useState(1);
  const [allModulesComplete, setAllModulesComplete] = useState(false);
  const pendingDeltaRef = useRef(0);

  /* ===============================
     GATE: redirect away if training already fully done
  =============================== */
  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/agent/me", { credentials: "include" });
        const meData = await meRes.json();
        if (meData?.agent?.trainingCompleted) {
          window.location.replace("/agentpage");
          return;
        }
      } catch (e) {
        console.error(e);
      } finally {
        setChecking(false);
      }
    }
    load();
  }, []);

  /* ===============================
     LOAD MODULE PROGRESS
  =============================== */
  useEffect(() => {
    if (checking) return;
    async function loadProgress() {
      try {
        const res = await fetch("/api/agent/module-progress", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setModules(data.modules);
          setCurrentModule(data.currentModule);
          setAllModulesComplete(data.allModulesComplete);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProgress(false);
      }
    }
    loadProgress();
  }, [checking]);

  /* ===============================
     TICK (only while tab is visible) + PERIODIC HEARTBEAT PERSIST
  =============================== */
  useEffect(() => {
    if (checking || loadingProgress || allModulesComplete) return;

    const persist = async (delta: number) => {
      if (delta <= 0) return;
      try {
        const res = await fetch("/api/agent/module-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ deltaSeconds: delta }),
        });
        const data = await res.json();
        if (data.success) {
          setModules(data.modules);
          setCurrentModule(data.currentModule);
          setAllModulesComplete(data.allModulesComplete);
        }
      } catch {
        pendingDeltaRef.current += delta; // retry on next heartbeat
      }
    };

    // Wall-clock based, not a 1-per-tick counter — the timer must never
    // pause on tab switch/blur, and backgrounded tabs get their setInterval
    // throttled by the browser (sometimes to far less than 1/sec), so
    // counting "1 tick = 1 second" would under-count time spent away from
    // the tab. Measuring real elapsed time between ticks stays correct
    // regardless of how infrequently the interval actually fires.
    let lastTick = Date.now();
    const tick = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.round((now - lastTick) / 1000);
      lastTick = now;
      if (elapsed <= 0) return;
      pendingDeltaRef.current += elapsed;
      setModules((prev) => {
        const idx = currentModule - 1;
        if (!prev[idx] || prev[idx].completed) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], secondsSpent: Math.min(next[idx].secondsSpent + elapsed, MODULE_SECONDS) };
        return next;
      });
    }, 1000);

    const heartbeat = setInterval(() => {
      const delta = pendingDeltaRef.current;
      pendingDeltaRef.current = 0;
      persist(delta);
    }, HEARTBEAT_SECONDS * 1000);

    const flushOnHide = () => {
      if (document.visibilityState !== "hidden") return;
      const delta = pendingDeltaRef.current;
      pendingDeltaRef.current = 0;
      if (delta > 0 && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/agent/module-progress",
          new Blob([JSON.stringify({ deltaSeconds: delta })], { type: "application/json" })
        );
      }
    };
    document.addEventListener("visibilitychange", flushOnHide);
    window.addEventListener("beforeunload", flushOnHide);

    return () => {
      clearInterval(tick);
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", flushOnHide);
      window.removeEventListener("beforeunload", flushOnHide);
    };
  }, [checking, loadingProgress, allModulesComplete, currentModule]);

  if (checking || loadingProgress) return null;

  if (allModulesComplete) {
    // "/agentpage" itself gates on trainingCompleted — passed agents land on
    // their dashboard, and anyone closing out of a failed attempt gets
    // bounced straight back here to retake it. Previously this was a no-op,
    // so the Result popup's Close button did nothing at all.
    return (
      <TestPage
        onClose={() => {
          window.location.href = "/agentpage";
        }}
        onProgressChange={() => {}}
        onResultVisible={() => {}}
      />
    );
  }

  const activeSeconds = modules[currentModule - 1]?.secondsSpent ?? 0;
  const remaining = Math.max(0, MODULE_SECONDS - activeSeconds);
  const pct = Math.min(100, Math.round((activeSeconds / MODULE_SECONDS) * 100));
  const hrs = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;

  return (
    <>
      <div className={styles.timerBar}>
        <div className={styles.timerBarLeft}>
          <span className={styles.timerBarLabel}>Module {currentModule} of 3 — time tracker</span>
          <div className={styles.timerBarTrack}>
            <div className={styles.timerBarFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
        {remaining <= 0 ? (
          <span className={styles.timerBarDone}>Module complete — moving to the next module…</span>
        ) : (
          <span className={styles.timerBarClock}>
            {pad2(hrs)}:{pad2(mins)}:{pad2(secs)} remaining
          </span>
        )}
      </div>
      {currentModule === 1 && <Module1Training />}
      {currentModule === 2 && <Module2Training />}
      {currentModule === 3 && <Module3Training />}
    </>
  );
}
