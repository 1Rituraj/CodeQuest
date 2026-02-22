import express from "express";
import { submitPuzzleAnswer, submitQuizAnswer, submitDragAnswer } from "../controllers/gameController.js";
import { getRecommendedDifficulty, skipPuzzle, buyTime } from "../controllers/gameController.js";
const router = express.Router();

router.post("/puzzle/answer", submitPuzzleAnswer);

router.post("/quiz/answer", submitQuizAnswer);

router.post("/drag/answer", submitDragAnswer);

router.get("/recommended-difficulty/:userId", getRecommendedDifficulty);

router.post("/puzzle/skip", skipPuzzle);

router.post("/puzzle/buy-time", buyTime);

export default router;
