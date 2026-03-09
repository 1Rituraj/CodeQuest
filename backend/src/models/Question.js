import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  language: String,
  topic: String,
  difficulty: String,
  question: String,
  options: [String],
  answer: String,
  hints: [String],
  source: { type: String, default: "ai" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Question", questionSchema);