import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // 4-digit code
  host: {
    name: String,
    playerId: String
  },
  guest: {
    name: String,
    playerId: String
  },
  status: { type: String, default: "waiting" }, // waiting | full | done
  gameStarted: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now }
});


const Room = mongoose.model("Room", roomSchema);
export default Room;
