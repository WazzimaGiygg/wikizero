const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const scoreEl = document.getElementById("score");

let playerX = 175;
let enemies = [];
let score = 0;
let gameOver = false;

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
  enemy.style.left = Math.floor(Math.random() * 8) * 50 + "px";
  gameArea.appendChild(enemy);
  enemies.push(enemy);
}

function updateEnemies() {
  enemies.forEach((enemy, index) => {
    let y = enemy.offsetTop + 5;
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

function endGame() {
  gameOver = true;
  alert("💥 Game Over! Sua pontuação: " + score);
  window.location.reload();
}

document.addEventListener("keydown", movePlayer);
setInterval(createEnemy, 1000);
requestAnimationFrame(gameLoop);
