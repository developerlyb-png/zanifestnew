// app/video-lectures/page.tsx
"use client";
import React, { useEffect } from "react";
// import { useRouter } from "next/navigation";
import VideoLectureDashboard from "@/components/videolecturedashboard/VideoLectureDashboard";

export default function VideoLecturesPage() {
  // const router = useRouter();

  // useEffect(() => {
  //   // simple client-side protection
  //   if (typeof window !== "undefined") {
  //     const logged = localStorage.getItem("agentLoggedIn");
  //     if (logged !== "true") router.replace("/agentlogin");
  //   }
  // }, [router]);

  return (
    <div>
      <VideoLectureDashboard />
    </div>
  );
}


