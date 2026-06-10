import AgentsignUp from "@/components/Auth/Agentsignup";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import React from "react";

function agentsignup() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <AgentsignUp/>
      <Footer />
    </div>
  );
}

export default agentsignup;
