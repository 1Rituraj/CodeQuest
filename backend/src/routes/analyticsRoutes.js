import express from "express";
import { getPlayerAnalytics, getStreak  } from "../controllers/analyticsController.js";

const router = express.Router();

// router.get("/:userId/solved", getSolvedQuestions)


router.get("/streak/:userId", getStreak);
router.get("/:userId", getPlayerAnalytics);
export default router;
