"use client";

import React, { useRef, useEffect, useState } from "react";
import styles from "@/styles/components/videolecturedashboard/VideoPlayer.module.css";

export default function VideoPlayer({
  src,
  videoId,
  onEnded,
  progress,
}: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastAllowedTime = useRef(0);
  const [percent, setPercent] = useState(0);

  /* ===============================
     RESTORE TIME
  =============================== */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      if (progress?.videoTime) {
        video.currentTime = progress.videoTime;
        lastAllowedTime.current = progress.videoTime;
      }
    };

    video.addEventListener("loadedmetadata", onLoaded);
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [progress]);

  /* ===============================
     TRACK TIME (NORMAL PLAYBACK)
  =============================== */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      lastAllowedTime.current = video.currentTime;

      if (video.duration) {
        setPercent((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, []);

  /* ===============================
     PREVENT MANUAL SEEK (REAL FIX)
  =============================== */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onSeeking = () => {
      if (video.currentTime > lastAllowedTime.current + 0.5) {
        video.currentTime = lastAllowedTime.current;
      }
    };

    video.addEventListener("seeking", onSeeking);
    return () => video.removeEventListener("seeking", onSeeking);
  }, []);

  /* ===============================
     SAVE PROGRESS (5 SEC)
  =============================== */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const interval = setInterval(() => {
      fetch("/api/agent/save-training-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentVideo: videoId,
          videoTime: video.currentTime,
        }),
      }).catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [videoId]);

  /* ===============================
     VIDEO END
  =============================== */
  function handleEnd() {
    fetch("/api/agent/save-training-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        currentVideo: videoId,
        videoTime: 0,
      }),
    }).finally(onEnded);
  }

  return (
    <div className={styles.videoWrap}>
      <div className={styles.progressContainer}>
        <div
          className={styles.progressBar}
          style={{ width: `${percent}%` }}
        >
          {Math.round(percent)}%
        </div>
      </div>

      <video
        ref={videoRef}
        className={styles.video}
        controls
        controlsList="nodownload noplaybackrate"
        onEnded={handleEnd}
      >
        <source src={src} type="video/mp4" />
      </video>
   <div className={styles.videoFooter}>
    <div className={styles.skipDisabledBadge}>
      <span className={styles.skipIcon}>⏱</span>
      <span>Skipping disabled</span>
    </div>
  </div>


    </div>
  );
}
