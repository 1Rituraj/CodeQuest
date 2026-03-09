import express from "express";
import { submitPuzzleAnswer, submitDragAnswer } from "../controllers/gameController.js";
import { getRecommendedDifficulty, skipPuzzle, buyTime } from "../controllers/gameController.js";
import { skipDragQuestion,  buyDragTime } from "../controllers/dragController.js";
const router = express.Router();

router.post("/puzzle/answer", submitPuzzleAnswer);

router.post("/drag/answer", submitDragAnswer);

router.get("/recommended-difficulty/:userId", getRecommendedDifficulty);

router.post("/puzzle/skip", skipPuzzle);

router.post("/puzzle/buy-time", buyTime);

router.post("/drag/skip", skipDragQuestion);

router.post("/drag/buy-time", buyDragTime);

export default router;

