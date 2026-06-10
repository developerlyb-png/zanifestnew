// File: models/DemoSection.ts
import mongoose, { Schema, model, models } from "mongoose";

const DemoItemSchema = new Schema({
  name: { type: String, required: true },
  desc: { type: String, required: true },
  image: { type: String, required: false },
  color: { type: String, required: false }, // Made optional to allow updates without it
});

const DemoSectionSchema = new Schema({
  heading: {
    type: String,
    required: true,
    default: "Why is ZANIFEST India’s go-to for insurance?",
  },
  subheading: {
    type: String,
    required: true,
    default:
      "Zanifest is your trusted partner in insurance — providing transparent comparisons, affordable policies, and dedicated support.",
  },
  items: {
    type: [DemoItemSchema],
    default: [
      {
        name: "Over 9 Million",
        desc: "Customers trust us and have bought their insurance on Zanifest",
        image: "",
        color: "#e7f9f7",
      },
      {
        name: "50+ Insurers",
        desc: "Partnered with us so that you can compare easily & transparently",
        image: "",
        color: "#ebf2f8",
      },
      {
        name: "Great Price",
        desc: "Affordable plans for all types of insurance",
        image: "",
        color: "#f9e5e2",
      },
      {
        name: "Claims",
        desc: "Support built in with every policy for help, when you need it",
        image: "",
        color: "#faf6e2",
      },
    ],
  },
});

const DemoSection = models.DemoSection || model("DemoSection", DemoSectionSchema);

export default DemoSection;