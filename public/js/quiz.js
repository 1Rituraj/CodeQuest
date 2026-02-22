let quizData = [];
let currentQuiz = 0;
let quizScore = 0;

async function loadQuiz() {
  const preferredLanguage = localStorage.getItem("preferredLanguage") || "JavaScript";

  const res = await fetch("data/quiz.json");
  const all = await res.json();

  quizData = all.filter(q => q.language === preferredLanguage);
  if (quizData.length === 0) {
    alert(`No quiz questions for ${preferredLanguage}. Showing default...`);
    quizData = all.filter(q => !q.language || q.language === "JavaScript");
  }

  showQuiz();
}

function showQuiz() {
  const q = quizData[currentQuiz];
  if (!q) {
    let score = parseInt(localStorage.getItem("score") || "0");
    score += quizScore;
    localStorage.setItem("score", score);
    alert("✅ Quiz complete! Redirecting...");
    window.location.href = "achievements.html";
    return;
  }

  document.getElementById("question").innerText = q.question;

  const form = document.getElementById("quizForm");
  form.innerHTML = "";

  q.options.forEach((opt, index) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="radio" name="quizOption" value="${opt}" ${index === 0 ? "checked" : ""}>
      ${opt}
    `;
    form.appendChild(label);
    form.appendChild(document.createElement("br"));
  });

  document.getElementById("quizFeedback").innerText = "";
}

async function submitQuizAnswer() {
  const selected = document.querySelector("input[name='quizOption']:checked");
  const q = quizData[currentQuiz];
  const feedback = document.getElementById("quizFeedback");

  if (!selected) {
    feedback.innerText = "⚠️ Please select an answer.";
    feedback.style.color = "orange";
    return;
  }

  try {
    const res = await fetch("/api/game/quiz/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: localStorage.getItem("playerId"),
        questionId: q.id || `quiz_${currentQuiz}`,
        topic: q.topic || "general",
        difficulty: localStorage.getItem("difficulty") || "beginner",
        selectedAnswer: selected.value,
        correctAnswer: q.answer
      }),
    });

    const data = await res.json();

    if (data.correct) {
      feedback.innerText = `✅ Correct! +${data.points}`;
      feedback.style.color = "green";
      quizScore += data.points;
    } else {
      feedback.innerText = "❌ Incorrect!";
      feedback.style.color = "red";
    }

  } catch (err) {
    feedback.innerText = "Server error!";
    feedback.style.color = "red";
  }

  setTimeout(() => {
    currentQuiz++;
    showQuiz();
  }, 1000);
}


loadQuiz();
