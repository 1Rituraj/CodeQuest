import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },

  score: { type: Number, default: 0 },
  level: { type: String, default: "Beginner" },
  puzzlesCompleted: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },

  currentPuzzleIndex: { type: Number, default: 0 },
  currentDifficulty: { type: String, default: "beginner" },
  currentLanguage: { type: String, default: "JavaScript" },
  
  createdAt: { type: Date, default: Date.now },

});

const User = mongoose.model("User", userSchema);
export default User;
