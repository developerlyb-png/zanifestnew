import mongoose, { Schema, model, models, Document } from "mongoose";

/* -----------------------------
   Step Sub Schema
------------------------------ */
const StepSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
    },
    desc: {
      type: String,
      default: "",
    },
    image: {
      type: String, // URL / base64 / file path
      default: "",
    },
  },
  { _id: false }
);

/* -----------------------------
   Service Sub Schema
------------------------------ */
const ServiceSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
    },
    desc: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

/* -----------------------------
   Default Data
------------------------------ */
const defaultSteps = [
  {
    name: "Fill Your Details",
    desc: "Fill in your details and get insurance policy premium quotes from top-rated insurers instantly.",
    image: "",
  },
  {
    name: "Select a Plan",
    desc: "From numerous available quotes, choose the one that best suits your requirements and budget.",
    image: "",
  },
  {
    name: "Make Payment and Sit Back",
    desc: "Pay online and get your policy right away in your inbox.",
    image: "",
  },
];

const defaultServices = Array.from({ length: 8 }).map(() => ({
  name: "Lorem Ipsum is simply dummy text",
  desc: "999 / Month",
  image: "",
}));

/* -----------------------------
   Document Interface
------------------------------ */
export interface HowWorksDoc extends Document {
  mainHeading: string;
  servicesHeading: string;
  steps: {
    name: string;
    desc: string;
    image: string;
  }[];
  services: {
    name: string;
    desc: string;
    image: string;
  }[];
}

/* -----------------------------
   Main Schema
------------------------------ */
const HowWorksSchema = new Schema<HowWorksDoc>(
  {
    mainHeading: {
      type: String,
      default: "How We Work?",
    },
    servicesHeading: {
      type: String,
      default: "Pay Less Cover More",
    },
    steps: {
      type: [StepSchema],
      default: defaultSteps,
    },
    services: {
      type: [ServiceSchema],
      default: defaultServices,
    },
  },
  {
    timestamps: true,
  }
);

/* -----------------------------
   Model Export
------------------------------ */
const HowWorks =
  models.HowWorks || model<HowWorksDoc>("HowWorks", HowWorksSchema);

export default HowWorks;
