// import Login from "@/components/Auth/Login";
import SignUp from "@/components/Auth/Signup";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import React from "react";

function signup() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <SignUp/>
      <Footer />
    </div>
  );
}

export default signup;
