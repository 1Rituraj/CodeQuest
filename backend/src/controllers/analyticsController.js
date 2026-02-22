import Attempt from "../models/Attempt.js";

export const getPlayerAnalytics = async (req, res) => {
  try {
    const userId = req.params.userId;

    const attempts = await Attempt.find({ userId });

    if (attempts.length === 0) {
      return res.json({
        totalAttempts: 0,
        accuracy: 0,
        strongTopic: "N/A",
        weakTopic: "N/A",
        avgTime: 0
      });
    }

    let correct = 0;
    let totalTime = 0;
    let timedAttempts = 0;
    const topicStats = {};

    attempts.forEach(a => {
      if (a.isCorrect) correct++;

      if (a.timeTaken !== null && a.timeTaken !== undefined) {
        totalTime += a.timeTaken;
        timedAttempts++;
      }

      if (!topicStats[a.topic]) {
        topicStats[a.topic] = { correct: 0, total: 0 };
      }

      topicStats[a.topic].total++;
      if (a.isCorrect) topicStats[a.topic].correct++;
    });

    const accuracy = Math.round((correct / attempts.length) * 100);
    const avgTime = timedAttempts ? Math.round(totalTime / timedAttempts) : 0;

    let strongTopic = "N/A";
    let weakTopic = "N/A";
    let maxAcc = -1;
    let minAcc = 101;

    for (const topic in topicStats) {
      const t = topicStats[topic];
      const acc = (t.correct / t.total) * 100;

      if (acc > maxAcc) {
        maxAcc = acc;
        strongTopic = topic;
      }

      if (acc < minAcc) {
        minAcc = acc;
        weakTopic = topic;
      }
    }

    res.json({
      totalAttempts: attempts.length,
      accuracy,
      strongTopic,
      weakTopic,
      avgTime
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStreak = async (req, res) => {
  try {
    const userId = req.params.userId;

    const attempts = await Attempt.find({ userId }).sort({ createdAt: -1 });

    if (attempts.length === 0) {
      return res.json({ streak: 0 });
    }

    let streak = 1;
    let prevDate = new Date(attempts[0].createdAt);
    prevDate.setHours(0,0,0,0);

    for (let i = 1; i < attempts.length; i++) {
      let currentDate = new Date(attempts[i].createdAt);
      currentDate.setHours(0,0,0,0);

      const diffDays = (prevDate - currentDate) / (1000*60*60*24);

      if (diffDays === 1) {
        streak++;
        prevDate = currentDate;
      }
      else if (diffDays === 0) {
        continue;
      }
      else {
        break;
      }
    }

    res.json({ streak });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
