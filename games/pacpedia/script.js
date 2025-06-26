// script.js para Pacpédia contra os moderadores Wiki

let score = 0;
let lives = 3;
let playerPosition = { x: 1, y: 1 };
let ghostPositions = [];
let dots = [];
let gameInterval;
let difficulty = 'medium';
let ghostCount = 2;
let speed = 200;

const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score-display');
const livesDisplay = document.getElementById('lives-display');
const messageDisplay = document.getElementById('message-display');
const highScoresList = document.getElementById('high-scores-list');
const nameInputContainer = document.getElementById('name-input-container');
const playerNameInput = document.getElementById('player-name-input');
const nameInputButton = document.getElementById('name-input-button');

const map = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,1],
    [1,0,1,0,1,0,1,1,0,1],
    [1,0,1,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,1,1,1,1],
];

function drawMap() {
    gameContainer.innerHTML = '';
    gameContainer.style.gridTemplateColumns = `repeat(${map[0].length}, 30px)`;
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (map[y][x] === 1) cell.classList.add('wall');
            else {
                cell.classList.add('path');
                dots.push({ x, y });
            }
            gameContainer.appendChild(cell);
        }
    }
}

function spawnPlayerAndGhosts() {
    playerPosition = { x: 1, y: 1 };
    placePlayer();

    ghostPositions = [];
    for (let i = 0; i < ghostCount; i++) {
        let gx, gy;
        do {
            gx = Math.floor(Math.random() * map[0].length);
            gy = Math.floor(Math.random() * map.length);
        } while ((gx === playerPosition.x && gy === playerPosition.y) || map[gy][gx] === 1);

        const ghost = document.createElement('div');
        ghost.classList.add('ghost');
        ghost.style.left = gx * 30 + 'px';
        ghost.style.top = gy * 30 + 'px';
        ghost.dataset.index = i;
        gameContainer.appendChild(ghost);
        ghostPositions.push({ x: gx, y: gy });
    }
}

function placePlayer() {
    let player = document.querySelector('.player');
    if (!player) {
        player = document.createElement('div');
        player.classList.add('player');
        gameContainer.appendChild(player);
    }
    player.style.left = playerPosition.x * 30 + 'px';
    player.style.top = playerPosition.y * 30 + 'px';
}

function handleMovement(e) {
    let dx = 0, dy = 0;
    if (e.key === 'ArrowUp') dy = -1;
    else if (e.key === 'ArrowDown') dy = 1;
    else if (e.key === 'ArrowLeft') dx = -1;
    else if (e.key === 'ArrowRight') dx = 1;

    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;
    if (map[newY] && map[newY][newX] === 0) {
        playerPosition = { x: newX, y: newY };
        placePlayer();
        collectDot(newX, newY);
        checkCollision();
    }
}

document.addEventListener('keydown', handleMovement);

function collectDot(x, y) {
    const index = dots.findIndex(dot => dot.x === x && dot.y === y);
    if (index !== -1) {
        dots.splice(index, 1);
        score += 10;
        updateScore();
    }
}

function checkCollision() {
    for (const ghost of ghostPositions) {
        if (ghost.x === playerPosition.x && ghost.y === playerPosition.y) {
            loseLife();
        }
    }
}

function loseLife() {
    lives--;
    updateLives();
    if (lives <= 0) {
        endGame();
    } else {
        playerPosition = { x: 1, y: 1 };
        placePlayer();
    }
}

function updateScore() {
    scoreDisplay.textContent = 'Pontos: ' + score;
}

function updateLives() {
    livesDisplay.textContent = 'Vidas: ' + '❤️ '.repeat(lives);
}

function endGame() {
    messageDisplay.textContent = 'Fim de jogo!';
    nameInputContainer.style.display = 'flex';
    clearInterval(gameInterval);
}

function saveHighScore(name, score) {
    let scores = JSON.parse(localStorage.getItem('pacpedia-scores')) || [];
    scores.push({ name, score });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10);
    localStorage.setItem('pacpedia-scores', JSON.stringify(scores));
    renderHighScores();
}

function renderHighScores() {
    highScoresList.innerHTML = '';
    const scores = JSON.parse(localStorage.getItem('pacpedia-scores')) || [];
    for (const entry of scores) {
        const li = document.createElement('li');
        li.innerHTML = `<span class="player-name">${entry.name}</span><span class="player-score">${entry.score}</span>`;
        highScoresList.appendChild(li);
    }
}

function resetHighScores() {
    localStorage.removeItem('pacpedia-scores');
    renderHighScores();
}

function startGame() {
    score = 0;
    lives = 3;
    dots = [];
    updateScore();
    updateLives();
    messageDisplay.textContent = 'Jogo iniciado!';
    nameInputContainer.style.display = 'none';
    difficulty = document.getElementById('difficulty-select')?.value || 'medium';

    if (difficulty === 'easy') {
        ghostCount = 1; speed = 250;
    } else if (difficulty === 'medium') {
        ghostCount = 2; speed = 200;
    } else {
        ghostCount = 4; speed = 150;
    }

    drawMap();
    spawnPlayerAndGhosts();
    placePlayer();
    renderHighScores();
}

nameInputButton.addEventListener('click', () => {
    const name = playerNameInput.value.trim() || 'Anônimo';
    saveHighScore(name, score);
    nameInputContainer.style.display = 'none';
});
