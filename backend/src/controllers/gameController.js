import Attempt from "../models/Attempt.js";
import User from "../models/User.js";

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
    const isCorrect = selectedAnswer === correctAnswer;

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
    let coins = 0;

    if (isCorrect) {
    coins += 2;

    if (timeTaken <= 10) coins += 3;
    if (hintsUsed === 0) coins += 2;

    await User.findByIdAndUpdate(userId, { $inc: { coins } });
    }
    // Save current progress
    await User.findByIdAndUpdate(userId, {
    currentPuzzleIndex: req.body.questionIndex + 1,
    currentDifficulty: difficulty
    });

    res.json({
      correct: isCorrect,
      points,
      coins
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check quiz answer
export const submitQuizAnswer = async (req, res) => {
  try {
    const {
      userId,
      questionId,
      topic,
      selectedAnswer,
      correctAnswer,
      difficulty
    } = req.body;

    const isCorrect = selectedAnswer === correctAnswer;

    // save attempt
    await Attempt.create({
      userId,
      questionId,
      topic,
      difficulty,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      timeTaken: null,
      mode: "quiz",
      hintsUsed

    });

    // quiz scoring
    let points = isCorrect ? 5 : 0;

    res.json({
      correct: isCorrect,
      points
    });

  } catch (err) {
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

    // compare arrays
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

    const points = isCorrect ? 10 : 0;

    res.json({
      correct: isCorrect,
      points
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
