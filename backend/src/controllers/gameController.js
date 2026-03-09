import Attempt from "../models/Attempt.js";
import User from "../models/User.js";
import { sessionStats } from "./aiController.js";
// Check puzzle answer
export const submitPuzzleAnswer = async (req, res) => {
  try {
    const {
      userId,
      questionId,
      topic,
      difficulty,
      selectedAnswer,
      correctAnswer,
      timeTaken,
      hintsUsed
    } = req.body;

    // server decides correctness
   const normalize = (str) =>
   str.replace(/\s+/g, "").toLowerCase();

   const isCorrect =
   normalize(selectedAnswer) === normalize(correctAnswer);

    // console.log("Selected:", selectedAnswer);
    // console.log("Correct:", correctAnswer);
    // console.log("Normalized Selected:", normalize(selectedAnswer));
    // console.log("Normalized Correct:", normalize(correctAnswer));
   
    // adding explanation if user gives incorrect answer 
    let explanation = "";

    if (!isCorrect && req.body.question) {

        try {

         const prompt = `
          Explain the following programming question.

          Question:
          ${req.body.question}

          Correct Answer:
          ${correctAnswer}

          User Selected:
          ${selectedAnswer}

          Rules:
          - Explain why the correct answer is correct.
          - If the question contains code, explain how the code executes.
          - Use simple beginner-friendly language.
          - Keep explanation short (2-3 sentences).

          Return explanation only.
          `;
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
          
          explanation =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Explanation unavailable.";
          if (explanation.length > 400) {
            explanation = explanation.substring(0, 400);
          }

        } catch (err) {

          explanation = "Explanation unavailable.";

        }

      }
    // Update session performance
    const sessionKey = `${userId}_${req.body.language}_${difficulty}_${topic}`;

    if (sessionStats[sessionKey]) {
      // prevent overflow
      if (sessionStats[sessionKey].answered < sessionStats[sessionKey].total) {

        sessionStats[sessionKey].answered++;

        if (isCorrect) {
          sessionStats[sessionKey].correct++;
        }

      }

    }

    // save attempt
    await Attempt.create({
      userId,
      questionId,
      topic,
      difficulty,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      timeTaken,
      mode: "puzzle"
    });

    // scoring logic (now secure)
    let points = 0;
    if (isCorrect) {
      if (timeTaken <= 10) points = 15;
      else if (timeTaken <= 20) points = 12;
      else points = 10;

      // penalty for hints
      points = Math.max(2, points - (hintsUsed * 3));
    }
    let coinsEarned = 0;

    if (isCorrect) {
      coinsEarned += 2;

      if (timeTaken <= 10) coinsEarned += 2;
      if (hintsUsed === 0) coinsEarned += 1;
      await User.findByIdAndUpdate(userId, {
        $addToSet: { solvedQuestions: questionId }
      });
    }
    // Save current progress
    const updatedUser = await User.findByIdAndUpdate(userId,
      {
        $inc: {coins: coinsEarned},
        currentPuzzleIndex: req.body.questionIndex + 1,
        currentDifficulty: difficulty
      },
      {new: true}
    );

    res.json({
      correct: isCorrect,
      points,
      coins: updatedUser.coins,
      explanation
    });

  } catch (err) {
    console.error("Puzzle Error", err);
    res.status(500).json({ message: err.message });
  }
};

// Check drag & drop answer
export const submitDragAnswer = async (req, res) => {
  try {
    const {
      userId,
      questionId,
      topic,
      difficulty,
      userAnswer,
      correctAnswer
    } = req.body;

    const isCorrect =
      JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);

    await Attempt.create({
      userId,
      questionId,
      topic,
      difficulty,
      selectedAnswer: userAnswer.join(" | "),
      correctAnswer: correctAnswer.join(" | "),
      isCorrect,
      timeTaken: null,
      mode: "drag"
    });

    let points = 0;
    let coinsEarned = 0;

    if (isCorrect) {
      points = 10;
      coinsEarned = 3; // reward for drag correct

      await User.findByIdAndUpdate(userId, {
        $inc: { coins: coinsEarned }
      });
    }

    // 🔥 Get updated user coins
    const updatedUser = await User.findById(userId);

    res.json({
      correct: isCorrect,
      points,
      coins: updatedUser.coins
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getRecommendedDifficulty = async (req, res) => {
  try {
    const userId = req.params.userId;
    const attempts = await Attempt.find({ userId });

    if (attempts.length < 5) {
      return res.json({ difficulty: "beginner" });
    }

    const correct = attempts.filter(a => a.isCorrect).length;
    const accuracy = (correct / attempts.length) * 100;

    let difficulty = "beginner";

    if (accuracy > 80) difficulty = "advanced";
    else if (accuracy > 40) difficulty = "intermediate";

    res.json({ difficulty });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const skipPuzzle = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.coins < 5) {
      return res.json({ success: false, message: "Not enough coins" });
    }

    user.coins -= 5;
    await user.save();

    res.json({ success: true, coins: user.coins });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const buyTime = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.coins < 3) {
      return res.json({ success: false, message: "Not enough coins" });
    }

    user.coins -= 3;
    await user.save();

    res.json({ success: true, coins: user.coins, extraTime: 15 });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
