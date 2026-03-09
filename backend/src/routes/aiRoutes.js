import express from "express";
import { generatePuzzle } from "../controllers/aiController.js";

const router = express.Router();

router.post("/generate-puzzle", generatePuzzle);

export default router;