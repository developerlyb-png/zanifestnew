import UserLogin from "@/components/Auth/Userlogin";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import React from "react";

function userlogin() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <UserLogin/>
      <Footer />
    </div>
  );
}

export default userlogin;
