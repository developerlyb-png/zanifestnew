import Managerlogin from "@/components/Auth/Managerlogin";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import React from "react";

function managerlogin() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <Managerlogin/>
      <Footer />
    </div>
  );
}

export default managerlogin;
