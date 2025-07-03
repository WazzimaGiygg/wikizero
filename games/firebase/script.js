const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const TILE_SIZE = 64;
const MAP_ROWS = 10;
const MAP_COLS = 10;
const ENEMY_SPEED = 1.2;

let map = [];
let enemies = [];
let score = 0;
let highScore = parseInt(localStorage.getItem("highscore")) || 0;
let phase = 1;
let gameStarted = false;

document.getElementById("recordeValor").textContent = highScore;

const player = {
  x: 0,
  y: 0,
  angle: 0,
  speed: 3,
  size: 10
};

let keys = {};
let bullets = [];

document.getElementById("startBtn").addEventListener("click", () => {
  document.getElementById("menu").style.display = "none";
  gameStarted = true;
  canvas.requestPointerLock();
  startNewPhase();
});

canvas.addEventListener("click", () => {
  if (gameStarted) {
    canvas.requestPointerLock();
  }
});

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement === canvas) {
    player.angle += e.movementX * 0.002;
  }
});

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

document.addEventListener("mousedown", (e) => {
  if (e.button === 0 && gameStarted) shoot();
});

function placeEnemies(layout, count = 3) {
  let list = [];
  while (list.length < count) {
    const row = Math.floor(Math.random() * MAP_ROWS);
    const col = Math.floor(Math.random() * MAP_COLS);
    if (layout[row][col] === 0) {
      const e = {
        x: col * TILE_SIZE + TILE_SIZE / 2,
        y: row * TILE_SIZE + TILE_SIZE / 2,
        alive: true
      };
      list.push(e);
    }
  }
  return list;
}

// Gerador de mapa com spawn garantido
function generateSafeMap() {
  let layout;
  let spawn;

  while (true) {
    layout = Array.from({ length: MAP_ROWS }, () =>
      Array.from({ length: MAP_COLS }, () => (Math.random() < 0.25 ? 1 : 0))
    );

    // Borda de parede
    for (let i = 0; i < MAP_ROWS; i++) {
      layout[i][0] = layout[i][MAP_COLS - 1] = 1;
    }
    for (let j = 0; j < MAP_COLS; j++) {
      layout[0][j] = layout[MAP_ROWS - 1][j] = 1;
    }

    // Spawn seguro
    for (let row = 1; row < MAP_ROWS - 1; row++) {
      for (let col = 1; col < MAP_COLS - 1; col++) {
        if (
          layout[row][col] === 0 &&
          layout[row + 1][col] === 0 &&
          layout[row][col + 1] === 0
        ) {
          spawn = { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
          return { layout, spawn };
        }
      }
    }
  }
}

function startNewPhase() {
  const result = generateSafeMap();
  map = result.layout;

  // Spawn player
  player.x = result.spawn.x;
  player.y = result.spawn.y;
  player.angle = 0;
  bullets = [];

  // Células acessíveis do spawn do player
  const spawnRow = Math.floor(player.y / TILE_SIZE);
  const spawnCol = Math.floor(player.x / TILE_SIZE);
  const accessibleCells = getAccessibleCells(map, spawnRow, spawnCol);

  // Gerar inimigos só em células acessíveis
  enemies = [];
  while (enemies.length < 3 + Math.floor(phase / 2)) {
    const idx = Math.floor(Math.random() * accessibleCells.length);
    const cell = accessibleCells[idx];
    const x = cell.c * TILE_SIZE + TILE_SIZE / 2;
    const y = cell.r * TILE_SIZE + TILE_SIZE / 2;

    // Evitar spawn sobre o player e inimigos já colocados
    if (
      Math.hypot(player.x - x, player.y - y) > TILE_SIZE * 1.5 &&
      !enemies.some(e => Math.hypot(e.x - x, e.y - y) < TILE_SIZE)
    ) {
      enemies.push({ x, y, alive: true });
    }
  }
}


function resetGame() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highscore", highScore);
  }
  alert(`Você foi pego!\nPontuação: ${score}\nRecorde: ${highScore}`);
  score = 0;
  phase = 1;
  document.getElementById("recordeValor").textContent = highScore;
  document.getElementById("menu").style.display = "flex";
  gameStarted = false;
}

function isWall(x, y) {
  let col = Math.floor(x / TILE_SIZE);
  let row = Math.floor(y / TILE_SIZE);
  return map[row]?.[col] === 1;
}

function updatePlayer() {
  let dx = 0, dy = 0;
  if (keys["w"]) { dx += Math.cos(player.angle); dy += Math.sin(player.angle); }
  if (keys["s"]) { dx -= Math.cos(player.angle); dy -= Math.sin(player.angle); }
  if (keys["a"]) { dx += Math.sin(player.angle); dy -= Math.cos(player.angle); }
  if (keys["d"]) { dx -= Math.sin(player.angle); dy += Math.cos(player.angle); }

  let newX = player.x + dx * player.speed;
  let newY = player.y + dy * player.speed;
  if (!isWall(newX, player.y)) player.x = newX;
  if (!isWall(player.x, newY)) player.y = newY;
}

function shoot() {
  const rayX = Math.cos(player.angle);
  const rayY = Math.sin(player.angle);
  let x = player.x, y = player.y;

  for (let i = 0; i < 1000; i++) {
    x += rayX; y += rayY;
    if (isWall(x, y)) break;

    for (let e of enemies) {
      if (e.alive && Math.hypot(e.x - x, e.y - y) < 12) {
        e.alive = false;
        break;
      }
    }
  }

  bullets.push({ startX: player.x, startY: player.y, endX: x, endY: y, time: 10 });
}

function updateEnemies() {
  if (!gameStarted) return;
  for (let e of enemies) {
    if (!e.alive) continue;
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 20) {
      gameStarted = false;
      return resetGame();
    }

    const moveX = (dx / dist) * ENEMY_SPEED;
    const moveY = (dy / dist) * ENEMY_SPEED;
    if (!isWall(e.x + moveX, e.y)) e.x += moveX;
    if (!isWall(e.x, e.y + moveY)) e.y += moveY;
  }
}

function checkVictory() {
  if (enemies.every(e => !e.alive)) {
    score += 10;
    phase++;
    startNewPhase();
  }
}

function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.fillText(`Fase: ${phase}`, 20, 30);
  ctx.fillText(`Pontos: ${score}`, 20, 60);
  ctx.fillText(`Recorde: ${highScore}`, 20, 90);
}

function drawAll() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  map.forEach((row, r) => row.forEach((t, c) => {
    ctx.fillStyle = t === 1 ? "#4444aa" : "#222";
    ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }));
  for (let b of bullets) {
    ctx.strokeStyle = "#f00";
    ctx.beginPath(); ctx.moveTo(b.startX, b.startY);
    ctx.lineTo(b.endX, b.endY);
    ctx.stroke(); b.time--;
  }
  bullets = bullets.filter(b => b.time > 0);
  for (let e of enemies) {
    if (e.alive) {
      ctx.fillStyle = "#f0f";
      ctx.beginPath(); ctx.arc(e.x, e.y, 12, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.fillStyle = "#0f0";
  ctx.beginPath(); ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#0f0";
  ctx.beginPath(); ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.angle) * 30, player.y + Math.sin(player.angle) * 30);
  ctx.stroke();

  // Mira no centro da tela
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  drawHUD();
}

function gameLoop() {
  if (gameStarted) {
    updatePlayer();
    updateEnemies();
    checkVictory();
    drawAll();
  }
  requestAnimationFrame(gameLoop);
}

function getAccessibleCells(layout, startRow, startCol) {
  const visited = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(false));
  const queue = [{ r: startRow, c: startCol }];
  visited[startRow][startCol] = true;
  const accessible = [];

  while (queue.length > 0) {
    const { r, c } = queue.shift();
    accessible.push({ r, c });

    const neighbors = [
      { r: r - 1, c },
      { r: r + 1, c },
      { r, c: c - 1 },
      { r, c: c + 1 }
    ];

    for (const n of neighbors) {
      if (
        n.r >= 0 && n.r < MAP_ROWS &&
        n.c >= 0 && n.c < MAP_COLS &&
        !visited[n.r][n.c] &&
        layout[n.r][n.c] === 0
      ) {
        visited[n.r][n.c] = true;
        queue.push(n);
      }
    }
  }

  return accessible;
}


gameLoop();
