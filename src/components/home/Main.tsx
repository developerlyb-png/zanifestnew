import React from "react";
import Carousel from "../ui/Carousal";
import carousalImage from "@/assets/home/carousal1.jpeg";

const images = [carousalImage, carousalImage, carousalImage];

function Main() {
  return (
    <>
      <Carousel refresh={1} />
    </>
  );
}

export default Main;
