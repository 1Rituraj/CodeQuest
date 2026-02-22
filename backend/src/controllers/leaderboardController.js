import Score from "../models/Score.js";

// Save player score
export const saveScore = async (req, res) => {
  try {
    const { name, score, difficulty, puzzlesCompleted } = req.body;
    const newScore = new Score({ name, score, difficulty, puzzlesCompleted });
    await newScore.save();
    res.status(201).json({ message: "Score saved!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get top 5 scores
export const getLeaderboard = async (req, res) => {
  try {
    const topScores = await Score.find().sort({ score: -1 }).limit(5);
    res.json(topScores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
