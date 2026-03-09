let dragPuzzles = [];
let currentDrag = 0;
let draggedBlockId = null;
let dragScore = parseInt(localStorage.getItem("score")) || 0;
let timeLeft = 30;
let dragTimer;

async function loadCoins() {
  const userId = localStorage.getItem("playerId");
  const res = await fetch(`/api/users/${userId}`);
  const data = await res.json();
  document.getElementById("coinDisplay").innerText = data.coins;
  updateDragShopButtons(data.coins);
}

async function loadDragPuzzles() {
  await loadCoins();
  const res = await fetch("data/dragPuzzles.json");
  const all = await res.json();

  const difficulty = localStorage.getItem("difficulty") || "beginner";
  const preferredLanguage = localStorage.getItem("preferredLanguage") || "JavaScript";

  // Filter by language and difficulty
  dragPuzzles = all.filter(p => p.difficulty === difficulty && p.language === preferredLanguage);

  if (dragPuzzles.length === 0) {
    alert(`No drag puzzles for ${preferredLanguage}. Showing beginner level.`);
    dragPuzzles = all.filter(p => p.difficulty === "beginner");
  }

  showDragPuzzle();
  
}

function showDragPuzzle() {
  if (currentDrag >= dragPuzzles.length) {
    localStorage.setItem("score", dragScore);

    const name = localStorage.getItem("playerName") || "Anonymous";
    const difficulty = localStorage.getItem("difficulty") || "beginner";

    fetch("/api/leaderboard/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        score: dragScore,
        difficulty,
        puzzlesCompleted: dragPuzzles.length,
        dragMode: true
      })
    }).finally(() => {
      alert("✅ Drag puzzles done!");
      window.location.href = "achievements.html";
    });

    return;
  }

  const puzzle = dragPuzzles[currentDrag];

  document.getElementById("question").innerText = puzzle.question;
  document.getElementById("dropZone").innerHTML = "";
  document.getElementById("dragFeedback").innerText = "";

  document.getElementById("progressText").innerText =
    `Puzzle ${currentDrag + 1} of ${dragPuzzles.length}`;

  const progressPercent =
    ((currentDrag + 1) / dragPuzzles.length) * 100;

  document.getElementById("progressBar").style.width =
    progressPercent + "%";

  document.getElementById("difficultyBadge").innerText =
    localStorage.getItem("difficulty") || "Beginner";

  const blocksDiv = document.getElementById("blocks");
  blocksDiv.innerHTML = "";

  const shuffled = [...puzzle.blocks].sort(() => Math.random() - 0.5);

  shuffled.forEach((text, index) => {
    const block = document.createElement("div");
    block.className = "block";
    block.innerText = text;
    block.id = "block-" + index;
    block.draggable = true;
    block.ondragstart = drag;
    blocksDiv.appendChild(block);
  });

  startDragTimer();
}

function startDragTimer() {
  clearInterval(dragTimer);
  timeLeft = 30;

  const timerElement = document.getElementById("timer");

  dragTimer = setInterval(() => {
    timeLeft--;
    timerElement.innerText = `⏱ ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(dragTimer);
      document.getElementById("dragFeedback").innerText = "⏰ Time's up!";
      setTimeout(() => {
        currentDrag++;
        showDragPuzzle();
      }, 1000);
    }
  }, 1000);
}

async function skipDrag() {
  const userId = localStorage.getItem("playerId");

  const res = await fetch("/api/game/drag/skip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  if (!data.success) {
    alert("❌ Not enough coins");
    return;
  }

  document.getElementById("coinDisplay").innerText = data.coins;
  updateDragShopButtons(data.coins);
  clearInterval(dragTimer);
  currentDrag++;
  showDragPuzzle();
}

async function buyDragTime() {
  const userId = localStorage.getItem("playerId");

  const res = await fetch("/api/game/drag/buy-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  if (!data.success) {
    alert("❌ Not enough coins");
    return;
  }

  document.getElementById("coinDisplay").innerText = data.coins;
  updateDragShopButtons(data.coins);
  timeLeft += data.extraTime;
}


async function submitDragAnswer() {
  clearInterval(dragTimer);
  const blocks = Array.from(document.querySelectorAll("#dropZone .block"));
  const userAnswer = blocks.map(b => b.innerText.trim());
  const correctAnswer = dragPuzzles[currentDrag].answer;
  const feedback = document.getElementById("dragFeedback");

  if (userAnswer.length !== correctAnswer.length) {
    feedback.innerText = "🚫 Incomplete answer!";
    feedback.style.transform = "scale(1.1)";
    setTimeout(() => {
      feedback.style.transform = "scale(1)";
    }, 300);
    return;
  }

  try {
    const res = await fetch("/api/game/drag/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: localStorage.getItem("playerId"),
        questionId: `drag_${currentDrag}`,
        topic: dragPuzzles[currentDrag].topic || "general",
        difficulty: localStorage.getItem("difficulty") || "beginner",
        userAnswer,
        correctAnswer
      }),
    });

    const data = await res.json();

    if (data.correct) {
      feedback.innerText = `✅ Correct! +${data.points}`;
      feedback.style.color = "green";
      dragScore += data.points;
      localStorage.setItem("score", dragScore);
      document.getElementById("coinDisplay").innerText = data.coins;
      updateDragShopButtons(data.coins);
      await loadCoins();
    } else {
      feedback.innerText = "❌ Incorrect!";
      feedback.style.transform = "scale(1.1)";
      setTimeout(() => {
        feedback.style.transform = "scale(1)";
      }, 300);
    }

  } catch (err) {
    feedback.innerText = "Server error!";
    feedback.style.transform = "scale(1.1)";
    setTimeout(() => {
      feedback.style.transform = "scale(1)";
    }, 300);
  }

  setTimeout(() => {
    currentDrag++;
    showDragPuzzle();
  }, 1000);
}
function updateDragShopButtons(coins) {
  const skipBtn = document.getElementById("skipBtn");
  const timeBtn = document.getElementById("timeBtn");

  if (skipBtn) skipBtn.disabled = coins < 5;
  if (timeBtn) timeBtn.disabled = coins < 3;
}

function showHint() {
  const puzzle = dragPuzzles[currentDrag];
  const hintBox = document.getElementById("hintBox");

  if (!puzzle.hints) return;

  hintBox.innerText = "Hint: " + puzzle.hints[0];
  hintBox.style.display = "block";
}




function allowDrop(e) {
  e.preventDefault();
}

function drag(e) {
  draggedBlockId = e.target.id;
}

function drop(e) {
  e.preventDefault();
  if (draggedBlockId) {
    const block = document.getElementById(draggedBlockId);
    e.target.appendChild(block);
    draggedBlockId = null;
  }
}

function resetDropZone() {
  const dropZone = document.getElementById("dropZone");
  const blocksDiv = document.getElementById("blocks");
  dropZone.querySelectorAll(".block").forEach(block => {
    blocksDiv.appendChild(block);
  });
  document.getElementById("dragFeedback").innerText = "";
}



loadDragPuzzles(); 