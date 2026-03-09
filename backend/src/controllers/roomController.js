import Room from "../models/Room.js";

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Create Room
export const createRoom = async (req, res) => {
  const { name } = req.body;
  const code = generateRoomCode();

  try {
    const newRoom = new Room({
      code,
      host: { name, playerId: req.body.playerId || "" },
      status: "waiting" 
    });
    await newRoom.save();
    res.status(201).json({ message: "Room created", code, host: name });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Join Room
export const joinRoom = async (req, res) => {
  const code = req.params.code;
  const { name } = req.body;

  try {
    const room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.guest && room.status === "full")
      return res.status(400).json({ message: "Room already full" });

    room.guest = { name, playerId: req.body.playerId || "" };
    room.status = "full";
    await room.save();

    res.status(200).json({ message: "Joined room", code });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Check room status
export const getRoomStatus = async (req, res) => {
    try {
      const room = await Room.findOne({ code: req.params.code });
      if (!room) return res.status(404).json({ message: "Room not found" });
      res.json(room);
      console.log("🧪 getRoomStatus returned:", room);
    } catch (err) {
      console.error("❌ DB error:", err);
      res.status(500).json({ message: "Error", error: err.message });
    }
   

  };
  
  // Start game
  export const startRoomGame = async (req, res) => {
    console.log("🎯 startRoomGame called for room", req.params.code);

    try {
      const room = await Room.findOne({ code: req.params.code });
      if (!room) return res.status(404).json({ message: "Room not found" });
  
      room.gameStarted = true;
      await room.save();
      console.log("✅ Game started for room:", room.code);
      res.json({ message: "Game started" });
    } catch (err) {
      res.status(500).json({ message: "Error", error: err.message });
    }
  };
  