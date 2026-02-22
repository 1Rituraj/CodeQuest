import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  questionId: {
    type: String,
    required: true,
  },

  topic: {
    type: String,
    required: true,
  },

  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    required: true,
  },

  selectedAnswer: {
    type: String,
    required: true,
  },

  correctAnswer: {
    type: String,
    required: true,
  },

  isCorrect: {
    type: Boolean,
    required: true,
  },

  timeTaken: Number,

  mode: {
    type: String,
    enum: ["puzzle", "quiz", "drag", "multiplayer"],
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  hintsUsed: {
    type: Number,
    default: 0
  },

});

export default mongoose.model("Attempt", attemptSchema);
