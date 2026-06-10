// models/Faq.ts
import mongoose from "mongoose";

const FAQSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  questions: [
    {
      ques: { type: String, required: true },
      ans: { type: String, required: true },
    },
  ],
});

export default mongoose.models.FAQ || mongoose.model("FAQ", FAQSchema);
