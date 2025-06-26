const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const scoreEl = document.getElementById("score");
const hud = document.getElementById("hud");
const recordesEl = document.getElementById("recordes");
const difficultySelect = document.getElementById("difficulty");

let playerX = 175;
let enemies = [];
let score = 0;
let gameOver = false;
let enemySpeed = 5;
let spawnRate = 1000;
let gameInterval;

function movePlayer(e) {
  if (e.key === "ArrowLeft" && playerX > 0) {
    playerX -= 25;
  } else if (e.key === "ArrowRight" && playerX < 350) {
    playerX += 25;
  }
  player.style.left = playerX + "px";
}

function createEnemy() {
  const enemy = document.createElement("div");
  enemy.classList.add("enemy");

  // Escolher aleatoriamente entre 10 sprites
  const index = Math.floor(Math.random() * 9);
  const nome = index === 0 ? "carro.jpg" : `carro${index}.jpg`;
  enemy.style.backgroundImage = `url("img/${nome}")`;

  enemy.style.left = Math.floor(Math.random() * 8) * 50 + "px";
  gameArea.appendChild(enemy);
  enemies.push(enemy);
}

function updateEnemies() {
  enemies.forEach((enemy, index) => {
    let y = enemy.offsetTop + enemySpeed;
    enemy.style.top = y + "px";

    if (y > 600) {
      enemy.remove();
      enemies.splice(index, 1);
      score++;
      scoreEl.textContent = "Pontuação: " + score;
    }

    if (
      y + 100 >= 500 &&
      y <= 600 &&
      Math.abs(enemy.offsetLeft - player.offsetLeft) < 50
    ) {
      endGame();
    }
  });
}

function gameLoop() {
  if (gameOver) return;
  updateEnemies();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  const diff = difficultySelect.value;
  if (diff === "easy") {
    enemySpeed = 3;
    spawnRate = 1200;
  } else if (diff === "medium") {
    enemySpeed = 5;
    spawnRate = 1000;
  } else if (diff === "hard") {
    enemySpeed = 7;
    spawnRate = 700;
  }

  gameOver = false;
  playerX = 175;
  player.style.left = playerX + "px";
  score = 0;
  scoreEl.textContent = "Pontuação: 0";
  enemies.forEach(e => e.remove());
  enemies = [];

  hud.style.display = "none";

  document.addEventListener("keydown", movePlayer);
  gameInterval = setInterval(createEnemy, spawnRate);
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  clearInterval(gameInterval);
  document.removeEventListener("keydown", movePlayer);

  setTimeout(() => {
    const nome = prompt("💥 Game Over! Digite seu nome:");
    if (nome) salvarRecorde(nome, score);
    mostrarRecordes();
    hud.style.display = "block";
  }, 100);
}

function salvarRecorde(nome, pontuacao) {
  const recordes = JSON.parse(localStorage.getItem("recordesCorrida") || "[]");
  recordes.push({ nome, pontuacao });
  recordes.sort((a, b) => b.pontuacao - a.pontuacao);
  localStorage.setItem("recordesCorrida", JSON.stringify(recordes.slice(0, 10)));
}

function mostrarRecordes() {
  const recordes = JSON.parse(localStorage.getItem("recordesCorrida") || "[]");
  recordesEl.innerHTML = "<strong>Top 10 Recordes:</strong><br>";
  recordes.forEach((r, i) => {
    recordesEl.innerHTML += `${i + 1}. ${r.nome} - ${r.pontuacao}<br>`;
  });
}

function resetScores() {
  localStorage.removeItem("recordesCorrida");
  recordesEl.innerHTML = "Recordes zerados.";
}

mostrarRecordes();
