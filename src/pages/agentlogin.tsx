import Agentlogin from "@/components/Auth/Agentlogin";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import React from "react";

function agentlogin() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <Agentlogin/>
      <Footer />
    </div>
  );
}

export default agentlogin;
