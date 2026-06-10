"use client";
import React from "react";
import styles from "@/styles/components/videolecturedashboard/VideoLectureDashboard.module.css";
import { FaCheckCircle } from "react-icons/fa";
import { MdPlayCircle } from "react-icons/md";
import { AiOutlineLock } from "react-icons/ai";

export default function Sidebar({ videos, current, completed, onSelect , testProgress, }: any) {
const completedCount = videos.filter(
  (v: any) => completed[v.id] === true
).length;
  const progress = Math.round((completedCount / videos.length) * 100);
 // ✅ check ALL videos completed (ONCE)
  const allCompleted =
    videos.length > 0 &&
    videos.every((v: any) => completed[v.id] === true);

  function isLocked(id: number) {
  return id !== 1 && !completed[id];
}


  return (
    <aside className={styles.sidebar}>
      <div className={styles.menuTitle}>Video Lecture Status</div>

      <div className={styles.progressPercent}>{progress}% Completed</div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: progress + "%" }}></div>
      </div>


      <div className={styles.menuTitle}>VIDEO LESSONS</div>

    {videos.map((v: any) => {
  const locked = isLocked(v.id);
  const active = !allCompleted && current === v.id;

  return (
    <div
      key={v.id}
      className={`${styles.sidebarItem} 
        ${active ? styles.activeItem : ""} 
        ${locked ? styles.lockedItem : ""}`}
      onClick={() => !locked && onSelect(v.id)}
    >
      {locked ? (
        <AiOutlineLock size={20} />
      ) : completed[v.id] ? (
        <FaCheckCircle size={20} color="green" />
      ) : (
        <MdPlayCircle size={20} />
      )}
      {v.title}
    </div>
  );
})}

      {/* ===== TEST PROGRESS ===== */}
<div className={styles.menuTitle} style={{ marginTop: "20px" }}>
  Test Assignment Status
</div>

<div className={styles.progressPercent}>
  {testProgress}% Completed
</div>

<div className={styles.progressContainer}>
  <div
    className={styles.progressBar}
    style={{ width: testProgress + "%" }}
  ></div>
</div>
    </aside>
  );
}
