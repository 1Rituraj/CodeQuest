let dragPuzzles = [];
let currentDrag = 0;
let draggedBlockId = null;
let dragScore = parseInt(localStorage.getItem("score")) || 0;

async function loadDragPuzzles() {
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
    }).then(() => {
      alert("✅ Drag puzzles done!");
      window.location.href = "achievements.html";
    }).catch(() => {
      alert("Drag score not saved.");
      window.location.href = "achievements.html";
    });

    return;
  }

  const puzzle = dragPuzzles[currentDrag];
  document.getElementById("question").innerText = puzzle.question;
  document.getElementById("dropZone").innerHTML = "";
  document.getElementById("dragFeedback").innerText = "";

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

async function submitDragAnswer() {
  const blocks = Array.from(document.querySelectorAll("#dropZone .block"));
  const userAnswer = blocks.map(b => b.innerText.trim());
  const correctAnswer = dragPuzzles[currentDrag].answer;
  const feedback = document.getElementById("dragFeedback");

  if (userAnswer.length !== correctAnswer.length) {
    feedback.innerText = "🚫 Incomplete answer!";
    feedback.style.color = "orange";
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
    } else {
      feedback.innerText = "❌ Incorrect!";
      feedback.style.color = "red";
    }

  } catch (err) {
    feedback.innerText = "Server error!";
    feedback.style.color = "red";
  }

  setTimeout(() => {
    currentDrag++;
    showDragPuzzle();
  }, 1000);
}


loadDragPuzzles();
