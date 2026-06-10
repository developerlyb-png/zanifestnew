"use client"
import React from "react";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import Link from "next/link";

export default function ThankYouPage() {
  return (
    <>
      {/* Header */}
      <Navbar />

      <div className="wrapper">

        {/* Layered Cards */}
        <div className="layer layer1"></div>
        <div className="layer layer2"></div>

        {/* Main Card */}
        <div className="card">
          <h1 className="title">Thank you!</h1>

          <p className="text">
            You're now a member of our list of awesome people.  
            We will contact you shortly to assist you further.
          </p>

          <Link href="/" className="btn">
            ▶ Back To Home
          </Link>
        </div>

        {/* Waves */}
        <div className="waves"></div>

        <style jsx>{`
          .wrapper {
            min-height: calc(100vh - 160px);
            background: linear-gradient(135deg, hsl(216, 61%, 51%), #2875ce);
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
            padding: 40px 0;
          }

          .layer {
            position: absolute;
            width: 650px;
            height: 350px;
            background: #eaeaea;
            border-radius: 20px;
            top: 120px;
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          }

          .layer1 {
            transform: translateY(-30px);
            opacity: 0.7;
          }

          .layer2 {
            transform: translateY(-15px);
            opacity: 0.85;
          }

          .card {
            background: #fff;
            padding: 60px 40px;
            border-radius: 20px;
            text-align: center;
            width: 650px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            position: relative;
            z-index: 2;
          }

          .title {
            font-size: 56px;
            font-family: "Brush Script MT", cursive;
            color: #555;
            margin-bottom: 20px;
          }

          .text {
            font-size: 18px;
            color: #777;
            margin-bottom: 30px;
            line-height: 1.6;
          }

          .btn {
            display: inline-block;
            background: #ff4d4f;
            color: #fff;
            padding: 12px 28px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: 500;
            box-shadow: 0 5px 15px rgba(255,77,79,0.4);
            transition: 0.3s;
          }

          .btn:hover {
            background: #e63b3d;
          }

          .waves {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 200px;
            background: radial-gradient(circle at 20% 100%, rgba(255,255,255,0.4), transparent 60%),
                        radial-gradient(circle at 80% 100%, rgba(255,255,255,0.3), transparent 60%);
          }

          @media (max-width: 768px) {
            .card {
              width: 90%;
              padding: 40px 20px;
            }

            .layer {
              display: none;
            }

            .title {
              font-size: 40px;
            }
          }
        `}</style>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}