"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "./sidebar";
import VideoPlayer from "./VideoPlayer";
import TestPage from "./TestPage";
import styles from "@/styles/components/videolecturedashboard/VideoLectureDashboard.module.css";

const VIDEO_LIST = [
  { id: 1, title: "Video Lecture 1", src: "/video/videolecture1.mp4" },
  { id: 2, title: "Video Lecture 2", src: "/video/videolecture1.mp4" },
  { id: 3, title: "Video Lecture 3", src: "/video/videolecture3.mp4" },
];

interface TrainingProgress {
  currentVideo: number;
  videoTime: number;
  completedVideos: number[];
  testStarted: boolean;
  testCompleted: boolean;
}

export default function vVideoLectureDashboard() {
  const [current, setCurrent] = useState(1);
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [showTest, setShowTest] = useState(false);
  const [checking, setChecking] = useState(true);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
const [testProgress, setTestProgress] = useState(0);
const [hideSidebar, setHideSidebar] = useState(false);


  const searchParams = useSearchParams();
  const forceTest = searchParams.get("mode") === "test";

  /* ===============================
     LOAD AGENT + TRAINING PROGRESS
  =============================== */
  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/agent/me", {
          credentials: "include",
        });
        const meData = await meRes.json();

        if (meData?.agent?.trainingCompleted) {
          window.location.replace("/agentpage");
          return;
        }

        const progRes = await fetch("/api/agent/training-progress", {
          credentials: "include",
        });
        const progData: TrainingProgress = await progRes.json();

        setProgress(progData);

  /*  SAFE CURRENT VIDEO */
        const safeCurrent = Math.min(
          Math.max(progData.currentVideo || 1, 1),
          VIDEO_LIST.length
        );
        setCurrent(safeCurrent);

        const map: Record<number, boolean> = {};
        progData.completedVideos?.forEach((v) => (map[v] = true));
        setCompleted(map);

        if (
          forceTest ||
          progData.completedVideos?.length === VIDEO_LIST.length ||
          progData.testStarted
        ) {
          setShowTest(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setChecking(false);
      }
    }

    load();
  }, [forceTest]);

  /* ===============================
     SAVE VIDEO COMPLETION
  =============================== */
  async function handleVideoEnd(id: number) {
    const updated = {
      ...completed,
      [id]: true,
    };
    setCompleted(updated);

    await fetch("/api/agent/save-training-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        completedVideos: Object.keys(updated).map(Number),
        currentVideo: id + 1,
        videoTime: 0,
      }),
    });

    if (id < VIDEO_LIST.length) {
      setCurrent(id + 1);
    }

    if (id === VIDEO_LIST.length) {
      setShowTest(true);
    }
  }

  if (checking) return null;
const currentVideo = VIDEO_LIST[current - 1];

  return (
   <div className={styles.pageCenter}>
  <div className={styles.dashboardCard}>
 {!hideSidebar && (
  <Sidebar
    videos={VIDEO_LIST}
    current={current}
    completed={completed}
    onSelect={setCurrent}
    testProgress={testProgress}
  />
)}



    <main className={styles.main}>
      {!showTest ? (
        <>
         <div className={styles.videoHeaderRow}>
 <h2 className={styles.heading}>
  {currentVideo?.title || ""}
</h2>


  <div className={styles.certWarning}>
    <span className={styles.warnIcon}>⚠️</span>
    <div>
      <div className={styles.warnTitle}>
        Certification incomplete.
      </div>
      <div className={styles.warnSub}>
        You cannot activate agent account
      </div>
    </div>
  </div>
</div>


        {currentVideo && (
  <VideoPlayer
    key={current}
    src={currentVideo.src}
    videoId={current}
    progress={progress || undefined}
    onEnded={() => handleVideoEnd(current)}
  />
)}

        </>
      ) : (
<TestPage
  onClose={() => setShowTest(false)}
  onProgressChange={setTestProgress}
  onResultVisible={setHideSidebar} // ✅ ADD
/>

      )}  
    </main>
  </div>
</div>

  );
}
