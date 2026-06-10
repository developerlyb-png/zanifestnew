import Login from "@/components/Auth/Login";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import React from "react";

function login() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <Login />
      <Footer />
    </div>
  );
}

export default login;
