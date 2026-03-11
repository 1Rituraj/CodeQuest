import dotenv from "dotenv";
dotenv.config();
import Room from "../models/Room.js";
function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Create Room
export const createRoom = async (req, res) => {

  const { name, playerId, difficulty, language, topic } = req.body;

  const code = generateRoomCode();

  try {

    const newRoom = new Room({

      code,

      host: { name, playerId },

      status: "waiting",

      settings: {
        difficulty,
        language,
        topic
      }

    });

    await newRoom.save();

    res.status(201).json({
      message: "Room created",
      code,
      host: name
    });

  } catch (err) {

    res.status(500).json({
      message: "Server error",
      error: err.message
    });

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
      // console.log("🧪 getRoomStatus returned:", room);
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

    if (!room.guest) {
      return res.status(400).json({ message: "Guest has not joined yet" });
    }

    if (room.gameStarted) {
      return res.json({ message: "Game already started" });
    }

    const difficulty = room.settings?.difficulty || "beginner";
    const language = room.settings?.language || "JavaScript";
    const topic = room.settings?.topic || "arrays";

    const prompt = `
    Generate 5 ${difficulty} level ${language} coding multiple choice questions about "${topic}".

    Rules:
    - Questions must be clear.
    - Each question must have exactly 4 options.
    - Correct answer must be one of the options.
    - Include hints.

    Return JSON array:

    [
    {
    "question": "",
    "options": ["","","",""],
    "answer": "",
    "hints": [""]
    }
    ]

    Return ONLY JSON.
    `;
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      console.log("Gemini API response:", data);
      throw new Error("AI API error");
    }
    
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (!jsonMatch) throw new Error("Invalid AI JSON");

    const questions = JSON.parse(jsonMatch[0]);

    const validQuestions = questions.filter(q =>
    q.question &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.answer &&
    q.options.includes(q.answer)
    );

    if (validQuestions.length === 0) {
    throw new Error("AI returned invalid questions");
    }

    console.log("VALID QUESTIONS:", validQuestions.length);


    room.questions = validQuestions ;
    room.currentIndex = 0;
    room.status = "playing";
    room.gameStarted = true;

    await room.save();

    console.log("✅ Multiplayer questions generated:", validQuestions.length);

    res.json({
      message: "Game started",
      totalQuestions: validQuestions.length
    });

  } catch (err) {
    console.error("❌ startRoomGame error:", err);
    res.status(500).json({ message: "Error", error: err.message });
  }
};