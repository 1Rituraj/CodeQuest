let questionStartTime = Date.now();
let hintsUsed = 0;

let countdown;
let timeLeft = 30;

let currentPuzzle = null;
let currentIndex = 0;
let puzzles = [];

let score = parseInt(localStorage.getItem("score")) || 0;

async function loadCoins() {
  const userId = localStorage.getItem("playerId");
  if (!userId) return;

  try {
    const res = await fetch(`/api/users/${userId}`);
    const data = await res.json();

    document.getElementById("coinDisplay").innerText = data.coins ?? 0;
    updateShopButtons(data.coins ?? 0);
  } catch (err) {
    console.log("Failed to load coins");
  }
}


function updateShopButtons(coins) {
  const skipBtn = document.getElementById("skipBtn");
  const timeBtn = document.getElementById("timeBtn");

  if (skipBtn) skipBtn.disabled = coins < 5;
  if (timeBtn) timeBtn.disabled = coins < 3;
}



async function loadPuzzles() {

  loadCoins();

  try {

    const difficulty = localStorage.getItem("difficulty") || "beginner";
    const preferredLanguage = localStorage.getItem("preferredLanguage") || "JavaScript";

    let res = await fetch("/api/ai/generate-puzzle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        difficulty,
        language: preferredLanguage,
        topic: localStorage.getItem("selectedTopic"),
        userId: localStorage.getItem("playerId"),
        count: 15   // 🔹 ask AI for 15 puzzles
      })
    });

    if (!res.ok) throw new Error("AI generation failed");

    const question = await res.json();

    currentPuzzle = question;
    currentIndex = 0;

    showPuzzle();

  } catch (err) {

    console.log(err);
    alert("Failed to generate puzzles");

  }
}

 async function showPuzzle() {
  window.answerSubmitted = false;
  hintsUsed = 0;

  const puzzle = currentPuzzle;


  document.getElementById("hint").style.display = "none";
  document.getElementById("feedback").innerText = "";
  document.getElementById("feedback").className = "";

  document.getElementById("progress").innerText = `Puzzle ${currentIndex + 1}`;
  document.getElementById("question").innerText = puzzle.question;

  const form = document.getElementById("optionsForm");
  form.innerHTML = "";
  if (!puzzle.options || puzzle.options.length === 0) {
    form.innerHTML = "<p style='color: yellow;'>⚠️ No options available for this puzzle.</p>";
    return;
  }

  puzzle.options.forEach((option, index) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="radio" name="option" value="${option}" ${index === 0 ? 'checked' : ''}>
      ${option}
    `;
    form.appendChild(label);
    form.appendChild(document.createElement("br"));
  });

  clearInterval(countdown);
  timeLeft = 30;
  updateTimer(timeLeft);

  countdown = setInterval(() => {
    timeLeft--;
    updateTimer(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(countdown);
      showPuzzleFeedback("⏰ Time's up!", false);
      submitTimeoutAnswer();
      setTimeout(nextPuzzle, 1000);
    }
  }, 1000);

  const nextBtn = document.querySelector("button[onclick='nextPuzzle()']");
  nextBtn.innerText = "➡️ Next Puzzle";
  nextBtn.disabled = true;

}



function updateTimer(secondsLeft) {
  const el = document.getElementById("timer");
  el.innerText = `⏱ Time left: ${secondsLeft}s`;
  el.classList.toggle("warning", secondsLeft <= 10);
}

function showHint() {
  const puzzle = currentPuzzle;

  // if hints not defined
  if (!puzzle.hints) {
    document.getElementById("hint").innerText = "No hints available";
    document.getElementById("hint").style.display = "block";
    return;
  }

  // choose hint based on how many times user clicked
  const hintIndex = Math.min(hintsUsed, puzzle.hints.length - 1);

  document.getElementById("hint").innerText = "Hint: " + puzzle.hints[hintIndex];
  document.getElementById("hint").style.display = "block";

  hintsUsed++;
}

function showToast(message, color = "#333") {
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.innerText = message;
  toast.style.background = color;
  toast.style.color = "white";
  toast.style.padding = "10px 16px";
  toast.style.marginTop = "10px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.4s ease";

  container.appendChild(toast);

  setTimeout(() => toast.style.opacity = "1", 50);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}


async function submitAnswer() {

  //to prevent second click 

  if (window.answerSubmitted) return;
  window.answerSubmitted = true;
  clearInterval(countdown);

  const selected = document.querySelector("input[name='option']:checked");
  if (!selected) {
    showPuzzleFeedback("⚠️ Please select an answer.", false);
    return;
  }

  
  
  const puzzle = currentPuzzle;
  console.log("ANS:" , puzzle.answer);
  const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

  try {
    const res = await fetch("/api/game/puzzle/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: localStorage.getItem("playerId"),
        questionId: puzzle._id || `puzzle_${currentIndex}`,
        questionIndex: currentIndex,
        topic: puzzle.topic || "general",
        language: localStorage.getItem("preferredLanguage"),
        difficulty: localStorage.getItem("difficulty") || "beginner",
        question: puzzle.question, 
        selectedAnswer: selected.value,
        correctAnswer: puzzle.answer,
        timeTaken,
        hintsUsed 

      }),
    });

    const data = await res.json();

    if (data.correct) {
      score += data.points;
      localStorage.setItem("score", score);
      showPuzzleFeedback(`✅ Correct! +${data.points} points +${data.coins} coins`, true);
      document.getElementById("coinDisplay").innerText = data.coins;
      // enable/disable shop buttons based on new coins
      updateShopButtons(data.coins);
      showToast(`+${data.coins} coins earned!`, "#16a34a");
      if (data.points >= 15)
      showToast("⚡ Fast answer bonus!", "#2563eb");
    } else {
      showPuzzleFeedback(
        `❌ Incorrect! Correct answer: ${puzzle.answer}`,
        false
      );

      if (data.explanation) {

        const explanationBox = document.getElementById("feedback");

        explanationBox.innerHTML += `
        <div style="
        margin-top:12px;
        padding:12px;
        background:#1e293b;
        border-radius:8px;
        color:white;
        font-size:14px;
        ">
        💡 <b>Explanation</b><br>
        ${data.explanation}
        </div>
        `;

      }
    }

  } catch (err) {
    showPuzzleFeedback("Server error. Try again.", false);
  }

  disableOptions();
  // setTimeout(nextPuzzle, 1000);
  const nextBtn = document.querySelector("button[onclick='nextPuzzle()']");
  nextBtn.innerText = "➡️ Next Question";
  nextBtn.disabled = false;
}

async function submitTimeoutAnswer() {

  const puzzle = currentPuzzle;

  try {

    await fetch("/api/game/puzzle/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: localStorage.getItem("playerId"),
        questionId: puzzle._id || `puzzle_${currentIndex}`,
        questionIndex: currentIndex,
        topic: puzzle.topic || "general",
        language: localStorage.getItem("preferredLanguage"),
        difficulty: localStorage.getItem("difficulty") || "beginner",
        selectedAnswer: "",
        correctAnswer: puzzle.answer,
        timeTaken: 30,
        hintsUsed
      })
    });

  } catch (err) {

    console.log("Timeout answer failed");

  }

}

async function skipQuestion() {
  const userId = localStorage.getItem("playerId");

  try {
    const res = await fetch("/api/game/puzzle/skip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();

    if (!data.success) {
      alert("❌ Not enough coins!");
      return;
    }

    // update coin display
    document.getElementById("coinDisplay").innerText = data.coins;
    // enable/disable shop buttons based on new coins
    updateShopButtons(data.coins);
    showToast("⏭️ Question skipped", "#f59e0b");

    nextPuzzle();

  } catch (err) {
    alert("Server error");
  }
}

async function buyExtraTime() {
  const userId = localStorage.getItem("playerId");

  try {
    const res = await fetch("/api/game/puzzle/buy-time", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();

    if (!data.success) {
      alert("❌ Not enough coins!");
      return;
    }

    document.getElementById("coinDisplay").innerText = data.coins;
    // enable/disable shop buttons based on new coins
    updateShopButtons(data.coins);
    timeLeft += data.extraTime;
    showToast("⏱️ +15 seconds added!", "#0ea5e9");


  } catch (err) {
    alert("Server error");
  }
}



function disableOptions() {
  document.querySelectorAll("input[name='option']").forEach(el => el.disabled = true);
}

function showPuzzleFeedback(message, isCorrect) {
  const fb = document.getElementById("feedback");
  fb.innerText = message;
  fb.className = isCorrect ? "correct" : "wrong";
  fb.scrollIntoView({ behavior: "smooth" });
}

async function nextPuzzle() {

  clearInterval(countdown);

  try {

    const difficulty = localStorage.getItem("difficulty");
    const language = localStorage.getItem("preferredLanguage");
    const topic = localStorage.getItem("selectedTopic");
    const userId = localStorage.getItem("playerId");

    const res = await fetch("/api/ai/generate-puzzle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        difficulty,
        language,
        topic,
        userId
      })
    });

    const data = await res.json();

    if (data.sessionComplete) {

      localStorage.setItem("sessionStats", JSON.stringify(data.stats));

      window.location.href = "session-summary.html";

      return;
    }

    currentPuzzle = data;
    currentIndex++;

    showPuzzle();

  } catch (err) {

    alert("Failed to load next puzzle");

  }

}
async function initGame() {
  const replayId = localStorage.getItem("replayQuestionId");

  if (replayId) {
    const res = await fetch(`/api/questions/${replayId}`);
    currentPuzzle = await res.json();
    localStorage.removeItem("replayQuestionId");
    showPuzzle();
  } else {
    loadPuzzles();
  }
}

initGame();
