import User from "../models/User.js";

// Get top 5 scores
export const getLeaderboard = async (req, res) => {
  try {

    const players = await User.find()
      .sort({ score: -1 })
      .limit(20)
      .select("name score puzzlesCompleted level");

    res.json({
      totalPlayers: players.length,
      leaderboard: players
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};