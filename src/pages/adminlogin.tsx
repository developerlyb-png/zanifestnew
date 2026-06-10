import AdminLogin from "@/components/Auth/Adminlogin";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import React from "react";

function adminlogin() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <AdminLogin/>
      <Footer />
    </div>
  );
}

export default adminlogin;
