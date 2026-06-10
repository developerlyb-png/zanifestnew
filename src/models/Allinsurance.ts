import mongoose, { Schema, model, models } from "mongoose";

const ServiceSchema = new Schema({
  name: { type: String, required: true },
  desc: { type: String, required: true },
  image: { type: String, required: false },
  link: { type: String, required: false },
});

const AllInsuranceSchema = new Schema({
  heading: {
    type: String,
    required: true,
    default: "We're Giving all the Insurance Services to you",
  },
  services: {
    type: [ServiceSchema],
    default: [
      {
        name: "Family Insurance",
        desc: "Protect your loved ones with comprehensive family coverage designed to secure health, future, and peace of mind.",
        image: "/assets/home/services/1.png",
        link: "#",
      },
      {
        name: "Travel Insurance",
        desc: "Stay worry-free on your journeys with travel insurance that covers medical emergencies, delays, and unexpected cancellations.",
        image: "/assets/home/services/2.png",
        link: "#",
      },
      {
        name: "Home Insurance",
        desc: "Safeguard your home and belongings from natural disasters, theft, and unforeseen events with our reliable home insurance plans.",
        image: "/assets/home/services/3.png",
        link: "#",
      },
    ],
  },
});

const AllInsurance = models.AllInsurance || model("AllInsurance", AllInsuranceSchema);
export default AllInsurance;
