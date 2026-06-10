import DashboardMain from "@/components/dashboard/DashboardMain";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";
import React from "react";
import { GetServerSidePropsContext } from "next";
import { verify } from "jsonwebtoken";

function DashboardPage() {
  return (
    <div>
      <UserDetails />
      <Navbar />
      <DashboardMain />
      <Footer />
    </div>
  );
}

export default DashboardPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req } = context;
  const token = req.cookies.userToken; // or managerToken/adminToken based on your role setup

  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  try {
    verify(token, process.env.JWT_SECRET!);
    return { props: {} };
  } catch (err) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
}
