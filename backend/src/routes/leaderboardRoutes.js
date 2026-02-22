import express from "express";
import { saveScore, getLeaderboard } from "../controllers/leaderboardController.js";

const router = express.Router();

router.post("/save", saveScore);
router.get("/", getLeaderboard);

export default router;
