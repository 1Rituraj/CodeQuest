import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },

  host: {
    name: String,
    playerId: String
  },

  guest: {
    name: String,
    playerId: String
  },

   settings: {
    difficulty: String,
    language: String,
    topic: String
  },

  // Game state
  status: { type: String, default: "waiting" }, // waiting | playing | finished
  gameStarted: { type: Boolean, default: false },

  // Questions for multiplayer match
  questions: { type: Array, default: [] },

  // Current question index
  currentIndex: { type: Number, default: 0 },

  // Score tracking
  scores: {
    host: { type: Number, default: 0 },
    guest: { type: Number, default: 0 }
  },

  // Answers for current question
  answers: {
    host: { type: String, default: null },
    guest: { type: String, default: null }
  },

  // Total time taken for tie-break
  timeTaken: {
    host: { type: Number, default: 0 },
    guest: { type: Number, default: 0 }
  },

  createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.model("Room", roomSchema);
export default Room;