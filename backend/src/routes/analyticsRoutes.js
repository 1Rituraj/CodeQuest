import express from "express";
import { getPlayerAnalytics, getStreak  } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/:userId", getPlayerAnalytics);

router.get("/streak/:userId", getStreak);
export default router;
