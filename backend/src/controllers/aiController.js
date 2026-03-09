import dotenv from "dotenv";
dotenv.config();

import { fallbackGenerators } from "../utils/fallbackBank.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";

let activePools = {}; // Stores question pools per user session
export let sessionStats = {};

function generateFallbackPool(language, difficulty, count = 15) {
  const langBank = fallbackGenerators[language];
  if (!langBank) return [];

  const difficultyBank = langBank[difficulty];
  if (!difficultyBank) return [];

  const pool = [];

  for (let i = 0; i < count; i++) {
    const randomGenerator =
      difficultyBank[Math.floor(Math.random() * difficultyBank.length)];

    pool.push({
      id: `fallback_${Date.now()}_${i}`,
      ...randomGenerator(),
      source: "fallback"
    });
  }

  return pool;
}

export const generatePuzzle = async (req, res) => {
  const { difficulty, language,topic, userId } = req.body;

  const cleanTopic = topic?.trim();

  if (!cleanTopic || cleanTopic.length > 50) {
    return res.status(400).json({ message: "Invalid topic input" });
  }

  const sessionKey = `${userId}_${language}_${difficulty}_${cleanTopic}`;


  // 🔹 Session finished check
 if (activePools[sessionKey] && activePools[sessionKey].length === 0) {

    const stats = sessionStats[sessionKey];

    console.log("SESSION RESULT:", stats);

    delete activePools[sessionKey];
    delete sessionStats[sessionKey];

    return res.json({
      sessionComplete: true,
      stats
    });
  }

  // If pool exists → serve next question
  if (activePools[sessionKey] && activePools[sessionKey].length > 0) {

    const nextQuestion = activePools[sessionKey].shift();

    return res.json(nextQuestion);
  }

  const previousAttempts = await Attempt.find({
    userId,
    topic: cleanTopic,
    difficulty,
    mode: "puzzle"
  }).sort({ createdAt: -1 })
    .limit(30);

  let previousAccuracy = 0;

  if (previousAttempts.length > 0) {

    const correct = previousAttempts.filter(a => a.isCorrect).length;

    previousAccuracy = Math.round(
      (correct / previousAttempts.length) * 100
    );

  }

  console.log("AI ADAPTIVE DATA →", {
    userId,
    topic: cleanTopic,
    difficulty,
    previousAttempts: previousAttempts.length,
    previousAccuracy
  });

  try {
    // AI CALLED ONLY ONCE PER POOL
    const prompt = `
    Generate 15 ${difficulty} level ${language} coding multiple choice questions about "${cleanTopic}".

    User previous accuracy: ${previousAccuracy}%.

    Rules:
    - Questions must be clear and complete.
    - If the question involves code, include the full code snippet.
    - Each question must have EXACTLY 4 options.
    - The correct answer MUST be one of the options.
    - Avoid ambiguous answers.
    - Include helpful hints.

    Difficulty Rules:

    If accuracy > 80%:
    - Generate slightly harder questions.

    If accuracy between 50% and 80%:
    - Maintain same difficulty.

    If accuracy < 50%:
    - Generate easier questions and include clearer hints.

    Return JSON array:

    [
    {
    "question": "complete question with code if needed",
    "options": ["option1","option2","option3","option4"],
    "answer": "one of the options",
    "hints": ["hint1","hint2"],
    "topic": "${cleanTopic}"
    }
    ]
    Do NOT return explanations or text outside JSON.
    Return only JSON.
    `;
    console.log("AI PROMPT:", prompt);

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
    // console.log(data , "quest from gemini");
    

    if (data.error) throw new Error("AI quota or API error");

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
    // 🔥 Save AI questions permanently in DB
    const savedQuestions = [];

    for (const q of validQuestions) {
      const newQuestion = await Question.create({
        language,
        topic: cleanTopic,
        difficulty,
        question: q.question,
        options: q.options.map(o => o.trim()),
        answer: q.answer.trim(),
        hints: q.hints,
        source: "ai"
      });

      savedQuestions.push(newQuestion);
    }

    // Store DB questions in memory pool
    activePools[sessionKey] = savedQuestions;
    sessionStats[sessionKey] = {
      total: savedQuestions.length,
      correct: 0,
      answered: 0
    };

    // Send first question
    return res.json(activePools[sessionKey].shift());

  } catch (err) {
    console.log("⚠ AI failed, using fallback pool");

    activePools[sessionKey] =
      generateFallbackPool(language, difficulty, 15);

    return res.json(activePools[sessionKey].shift());
  }
};