import React from "react";
import { useAuth } from "@/context/AuthContext";

function DashboardHelp() {
  const { user } = useAuth();
  return <div>Hi, {user?.name || "User"} — DashboardHelp</div>;
}

export default DashboardHelp;
