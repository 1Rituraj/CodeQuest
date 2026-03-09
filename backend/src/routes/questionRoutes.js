import express from "express";
import Question from "../models/Question.js";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Not found" });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;