const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score-display');
const livesDisplay = document.getElementById('lives-display');
const messageDisplay = document.getElementById('message-display');
const startButton = document.getElementById('start-button');
const resumeButton = document.getElementById('resume-button');
const nameInputContainer = document.getElementById('name-input-container');
const playerNameInput = document.getElementById('player-name-input');
const nameInputButton = document.getElementById('name-input-button');
const highScoresList = document.getElementById('high-scores-list');
const gameInfo = document.getElementById('game-info');

const CELL_SIZE = 30;
let score = 0;
let lives = 3;
let gameRunning = false;
let playerX = 0;
let playerY = 0;
let playerDirection = '';
let playerSpeed = 100;
let ghostSpeed = 300;
let currentLevel = 0;

let ghostInterval;
let playerMoveInterval;
let invulnerabilityTimeout;

let isInvulnerable = false;

const MAP_ROWS = 15;
const MAP_COLS = 15;

let maps = [];
maps.push(generateRandomMap(MAP_ROWS, MAP_COLS));

let dotsCount = 0;
const gameElements = {};

/**
 * FUNÇÃO PLACEHOLDER: Você PRECISA implementar um algoritmo de geração de labirinto robusto aqui.
 * Exemplos de algoritmos: Recursive Backtracker, Prim's Algorithm.
 * O objetivo é criar um labirinto onde todos os caminhos são conectados e os itens são acessíveis.
 */
function generateRandomMap(rows, cols) {
    let newMap = Array(rows).fill(0).map(() => Array(cols).fill(1));

    for (let r = 0; r < rows; r++) {
        newMap[r][0] = 1;
        newMap[r][cols - 1] = 1;
    }
    for (let c = 0; c < cols; c++) {
        newMap[0][c] = 1;
        newMap[rows - 1][c] = 1;
    }

    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            if (Math.random() > 0.3) {
                newMap[r][c] = 0;
            }
        }
    }

    let playerSpawn = {x: -1, y: -1};
    let ghostSpawns = [];
    let powerPelletSpawns = [];

    let openCells = [];
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            if (newMap[r][c] === 0) {
                openCells.push({ x: c, y: r });
            }
        }
    }

    for (let i = openCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [openCells[i], openCells[j]] = [openCells[j], openCells[i]];
    }

    if (openCells.length > 0) {
        playerSpawn = openCells.pop();
        newMap[playerSpawn.y][playerSpawn.x] = 3;
    }

    let numGhosts = Math.min(2 + currentLevel, Math.floor(openCells.length / 10));
    for (let i = 0; i < numGhosts && openCells.length > 0; i++) {
        const pos = openCells.pop();
        ghostSpawns.push(pos);
        newMap[pos.y][pos.x] = 4;
    }

    let numPowerPellets = Math.min(2, Math.floor(openCells.length / 20));
    for (let i = 0; i < numPowerPellets && openCells.length > 0; i++) {
        const pos = openCells.pop();
        powerPelletSpawns.push(pos);
        newMap[pos.y][pos.x] = 5;
    }

    openCells.forEach(cell => {
        newMap[cell.y][cell.x] = 2;
    });

    console.log("Generated Map for Level", currentLevel, ":", newMap);
    return newMap;
}


function initializeGame(mapIndex) {
    gameContainer.innerHTML = '';
    const currentMapData = maps[mapIndex];
    gameContainer.style.gridTemplateColumns = `repeat(${currentMapData[0].length}, ${CELL_SIZE}px)`;
    gameContainer.style.gridTemplateRows = `repeat(${currentMapData.length}, ${CELL_SIZE}px)`;

    gameInfo.style.width = `${currentMapData[0].length * CELL_SIZE + 20}px`;

    dotsCount = 0;
    gameElements.dots = [];
    gameElements.powerPellets = [];
    gameElements.ghosts = [];
    gameElements.ghostElements = [];

    const wallColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    const pathColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    const gameBorderColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;

    document.documentElement.style.setProperty('--wall-color', wallColor);
    document.documentElement.style.setProperty('--path-color', pathColor);
    document.documentElement.style.setProperty('--game-border-color', gameBorderColor);


    let tempMap = currentMapData.map(row => [...row]);

    let initialGhostPositions = [];
    for (let r = 0; r < tempMap.length; r++) {
        for (let c = 0; c < tempMap[r].length; c++) {
            const cellValue = tempMap[r][c];
            if (cellValue === 3) {
                playerX = c;
                playerY = r;
                tempMap[r][c] = 0;
            } else if (cellValue === 4) {
                initialGhostPositions.push({ x: c, y: r });
                tempMap[r][c] = 0;
            }
        }
    }

    for (let r = 0; r < tempMap.length; r++) {
        for (let c = 0; c < tempMap[r].length; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            if (tempMap[r][c] === 1) {
                cell.classList.add('wall');
            } else {
                cell.classList.add('path');
                if (currentMapData[r][c] === 2) {
                    const dot = document.createElement('div');
                    dot.classList.add('dot');
                    dot.style.left = `${c * CELL_SIZE + (CELL_SIZE / 2 - 4)}px`;
                    dot.style.top = `${r * CELL_SIZE + (CELL_SIZE / 2 - 4)}px`;
                    gameContainer.appendChild(dot);
                    gameElements.dots.push({ element: dot, x: c, y: r });
                    dotsCount++;
                } else if (currentMapData[r][c] === 5) {
                    const pellet = document.createElement('div');
                    pellet.classList.add('power-pellet');
                    pellet.style.left = `${c * CELL_SIZE + (CELL_SIZE / 2 - 7.5)}px`;
                    pellet.style.top = `${r * CELL_SIZE + (CELL_SIZE / 2 - 7.5)}px`;
                    gameContainer.appendChild(pellet);
                    gameElements.powerPellets.push({ element: pellet, x: c, y: r });
                }
            }
            gameContainer.appendChild(cell);
        }
    }

// --- Nova Lógica para ajustar dotsCount com base em pontos isolados ---
    const isolatedPoints = detectIsolatedPoints(currentMapData);
    if (isolatedPoints.length > 0) {
        console.warn(`Nível ${mapIndex + 1} possui ${isolatedPoints.length} pontos isolados. Reduzindo dotsCount.`);
        dotsCount -= isolatedPoints.length; // Reduz a contagem total de dots pelos isolados

        // Opcional: Se quiser remover visualmente os pontos isolados
        isolatedPoints.forEach(isolated => {
            if (isolated.type === 'dot') {
                const dotElement = gameElements.dots.find(d => d.x === isolated.x && d.y === isolated.y)?.element;
                if (dotElement) {
                    dotElement.style.display = 'none'; // Esconde o dot isolado
                }
            } else if (isolated.type === 'power-pellet') {
                const pelletElement = gameElements.powerPellets.find(p => p.x === isolated.x && p.y === isolated.y)?.element;
                if (pelletElement) {
                    pelletElement.style.display = 'none'; // Esconde o power-pellet isolado
                }
            }
        });
    }
    // --- Fim da Nova Lógica ---
    
    const player = document.createElement('div');
    player.classList.add('player');
    gameContainer.appendChild(player);
    gameElements.player = player;

    gameElements.ghosts = [];
    gameElements.ghostElements.forEach(g => g.remove());
    gameElements.ghostElements = [];

    const numGhostsForLevel = Math.min(initialGhostPositions.length, 1 + Math.floor(currentLevel / 2));
    for (let i = 0; i < numGhostsForLevel; i++) {
        const ghostPos = initialGhostPositions[i % initialGhostPositions.length];
        const ghostElement = document.createElement('div');
        ghostElement.classList.add('ghost');
        gameContainer.appendChild(ghostElement);
        gameElements.ghosts.push({
            element: ghostElement,
            x: ghostPos.x,
            y: ghostPos.y,
            initialX: ghostPos.x,
            initialY: ghostPos.y,
            isEaten: false
        });
        gameElements.ghostElements.push(ghostElement);
    }

    updatePlayerPosition();
    updateGhostPositions();
    updateLivesDisplay();
}

function updatePlayerPosition() {
    if (gameElements.player) {
        gameElements.player.style.left = `${playerX * CELL_SIZE + 2}px`;
        gameElements.player.style.top = `${playerY * CELL_SIZE + 2}px`;
    }
}

function updateGhostPositions() {
    gameElements.ghosts.forEach(ghost => {
        ghost.element.style.left = `${ghost.x * CELL_SIZE + 2}px`;
        ghost.element.style.top = `${ghost.y * CELL_SIZE + 2}px`;
    });
}

function updateLivesDisplay() {
    livesDisplay.innerHTML = 'Vidas: ' + '❤️ '.repeat(lives);
}

function activateInvulnerability() {
    isInvulnerable = true;
    gameElements.player.style.backgroundColor = '#00f';
    gameElements.ghosts.forEach(ghost => {
        if (!ghost.isEaten) {
            ghost.element.classList.add('scared');
            ghost.speedMultiplier = 0.5;
        }
    });
    if (invulnerabilityTimeout) {
        clearTimeout(invulnerabilityTimeout);
    }

    invulnerabilityTimeout = setTimeout(() => {
        deactivateInvulnerability();
    }, 7000);
}

function deactivateInvulnerability() {
    isInvulnerable = false;
    gameElements.player.style.backgroundColor = '#ff0';
    gameElements.ghosts.forEach(ghost => {
        ghost.element.classList.remove('scared');
        ghost.speedMultiplier = 1;
    });
    gameElements.ghostElements.forEach(g => g.style.animation = '');
}

function checkCollisions() {
    gameElements.dots.forEach((dot, index) => {
        if (dot.element.style.display !== 'none' && dot.x === playerX && dot.y === playerY) {
            dot.element.style.display = 'none';
            score++;
            dotsCount--;
            scoreDisplay.textContent = `Pontos: ${score}`;
        }
    });
    gameElements.powerPellets.forEach((pellet, index) => {
        if (pellet.element.style.display !== 'none' && pellet.x === playerX && pellet.y === playerY) {
            pellet.element.style.display = 'none';
            activateInvulnerability();
        }
    });
    gameElements.ghosts.forEach(ghost => {
        if (ghost.x === playerX && ghost.y === playerY && !ghost.isEaten) {
            if (isInvulnerable) {
                ghost.isEaten = true;
                ghost.element.style.display = 'none';
                score += 10;
                scoreDisplay.textContent = `Pontos: ${score}`;

                setTimeout(() => {
                    ghost.x = ghost.initialX;
                    ghost.y = ghost.initialY;
                    ghost.element.style.display = 'block';
                    ghost.isEaten = false;
                    ghost.element.classList.remove('scared');
                    ghost.speedMultiplier = 1;
                    updateGhostPositions();
                }, 3000);
            } else {
                lives--;
                updateLivesDisplay();
                if (lives <= 0) {
                    endGame('Você foi pego pelos fantasmas e perdeu todas as vidas! Fim de jogo.');
                } else {
                    messageDisplay.textContent = 'Você perdeu uma vida! Clique em "Voltar a Jogar" para continuar.';
                    clearInterval(playerMoveInterval);
                    clearInterval(ghostInterval);
                    clearTimeout(invulnerabilityTimeout);
                    gameRunning = false;

                    gameElements.player.style.display = 'none';
                    const currentMapData = maps[currentLevel];
                    for (let r = 0; r < currentMapData.length; r++) {
                        for (let c = 0; c < currentMapData[r].length; c++) {
                            if (currentMapData[r][c] === 3) {
                                playerX = c;
                                playerY = r;
                                break;
                            }
                        }
                    }
                    updatePlayerPosition();

                    gameElements.ghosts.forEach(ghost => {
                        ghost.x = ghost.initialX;
                        ghost.y = ghost.initialY;
                        ghost.element.style.display = 'block';
                        ghost.isEaten = false;
                        ghost.element.classList.remove('scared');
                        ghost.speedMultiplier = 1;
                    });
                    updateGhostPositions();
                    deactivateInvulnerability();

                    resumeButton.style.display = 'block';
                    startButton.style.display = 'none';
                }
            }
        }
    });
    if (dotsCount === 0) {
        const nextLevelMap = generateRandomMap(MAP_ROWS, MAP_COLS);
        maps.push(nextLevelMap);

        if (currentLevel < maps.length - 1) {
            messageDisplay.textContent = 'Todos os pontos coletados! Preparando próximo nível...';
            clearInterval(playerMoveInterval);
            clearInterval(ghostInterval);
            deactivateInvulnerability();
            setTimeout(() => {
                currentLevel++;
                startGame();
            }, 2000);
        } else {
            endGame('Parabéns! Você completou todos os níveis e coletou todos os pontos!');
        }
    }
}

function movePlayer() {
    let newPlayerX = playerX;
    let newPlayerY = playerY;

    switch (playerDirection) {
        case 'up': newPlayerY--; break;
        case 'down': newPlayerY++; break;
        case 'left': newPlayerX--; break;
        case 'right': newPlayerX++; break;
        case 'stop': return;
    }

    const currentMapData = maps[currentLevel];
    if (newPlayerY >= 0 && newPlayerY < currentMapData.length &&
        newPlayerX >= 0 && newPlayerX < currentMapData[0].length &&
        currentMapData[newPlayerY][newPlayerX] !== 1) {
        playerX = newPlayerX;
        playerY = newPlayerY;
        updatePlayerPosition();
        checkCollisions();
    } else {
        playerDirection = 'stop';
    }
}

function moveGhosts() {
    gameElements.ghosts.forEach(ghost => {
        if (ghost.isEaten) return;

        const currentGhostSpeed = ghostSpeed * (ghost.speedMultiplier || 1);
        if (Date.now() - (ghost.lastMoveTime || 0) < currentGhostSpeed) {
            return;
        }
        ghost.lastMoveTime = Date.now();

        let possibleMoves = [];
        const currentMapData = maps[currentLevel];

        if (ghost.y > 0 && currentMapData[ghost.y - 1][ghost.x] !== 1) possibleMoves.push({ x: ghost.x, y: ghost.y - 1 });
        if (ghost.y < currentMapData.length - 1 && currentMapData[ghost.y + 1][ghost.x] !== 1) possibleMoves.push({ x: ghost.x, y: ghost.y + 1 });
        if (ghost.x > 0 && currentMapData[ghost.y][ghost.x - 1] !== 1) possibleMoves.push({ x: ghost.x - 1, y: ghost.y });
        if (ghost.x < currentMapData[0].length - 1 && currentMapData[ghost.y][ghost.x + 1] !== 1) possibleMoves.push({ x: ghost.x + 1, y: ghost.y });

        if (possibleMoves.length > 0) {
            let chosenMove = null;
            if (isInvulnerable) {
                let furthestDistance = -1;
                for (const move of possibleMoves) {
                    const dist = Math.abs(playerX - move.x) + Math.abs(playerY - move.y);
                    if (dist > furthestDistance) {
                        furthestDistance = dist;
                        chosenMove = move;
                    }
                }
            } else {
                let closestDistance = Infinity;
                for (const move of possibleMoves) {
                    const dist = Math.abs(playerX - move.x) + Math.abs(playerY - move.y);
                    if (dist < closestDistance) {
                        closestDistance = dist;
                        chosenMove = move;
                    }
                }
            }

            if (chosenMove) {
                ghost.x = chosenMove.x;
                ghost.y = chosenMove.y;
            } else {
                 chosenMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                 ghost.x = chosenMove.x;
                 ghost.y = chosenMove.y;
            }
        }
    });
    updateGhostPositions();
    checkCollisions();
}

function startGame() {
    if (gameRunning && currentLevel === 0 && lives === 3) {
    } else if (gameRunning && currentLevel > 0) {
    } else {
        score = 0;
        lives = 3;
        currentLevel = 0;
        maps = [generateRandomMap(MAP_ROWS, MAP_COLS)];
        messageDisplay.textContent = 'Use as setas do teclado para mover.';
        startButton.style.display = 'none';
        nameInputContainer.style.display = 'none';
        resumeButton.style.display = 'none';
        playerDirection = '';
        deactivateInvulnerability();
    }

    gameRunning = true;
    startButton.style.display = 'none';
    messageDisplay.textContent = `Nível ${currentLevel + 1}...`;

    initializeGame(currentLevel);
    clearInterval(playerMoveInterval);
    clearInterval(ghostInterval);
    clearTimeout(invulnerabilityTimeout);

    playerMoveInterval = setInterval(movePlayer, playerSpeed);
    ghostInterval = setInterval(moveGhosts, ghostSpeed);
}

function endGame(message) {
    gameRunning = false;
    clearInterval(playerMoveInterval);
    clearInterval(ghostInterval);
    clearTimeout(invulnerabilityTimeout);
    deactivateInvulnerability();

    messageDisplay.textContent = message;
    startButton.textContent = 'Jogar Novamente';
    startButton.style.display = 'block';
    playerDirection = 'stop';
    resumeButton.style.display = 'none';

    checkHighScore(score);
}

document.addEventListener('keydown', (event) => {
    if (!gameRunning) return;

    switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            playerDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            playerDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            playerDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            playerDirection = 'right';
            break;
        case ' ':
            playerDirection = 'stop';
            break;
    }
    movePlayer();
});

const HIGH_SCORES_KEY = 'pacmanHighScores';
function loadHighScores() {
    const scores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY) || '[]');
    return scores.sort((a, b) => b.score - a.score);
}

function saveHighScores(scores) {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
    displayHighScores();
}

function displayHighScores() {
    const scores = loadHighScores();
    highScoresList.innerHTML = '';
    if (scores.length === 0) {
        highScoresList.innerHTML = '<li>Nenhum recorde ainda.</li>';
        return;
    }
    scores.slice(0, 10).forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="player-name">${index + 1}. ${entry.name || 'Anônimo'}</span> <span class="player-score">${entry.score}</span>`;
        highScoresList.appendChild(li);
    });
}

function checkHighScore(finalScore) {
    const scores = loadHighScores();
    const minScore = scores.length < 10 ? 0 : scores[scores.length - 1].score;
    if (finalScore > minScore) {
        messageDisplay.textContent = `Novo Recorde! Sua pontuação: ${finalScore}`;
        nameInputContainer.style.display = 'flex';
        playerNameInput.value = '';
        playerNameInput.focus();
        startButton.style.display = 'none';
        resumeButton.style.display = 'none';
    } else {
        messageDisplay.textContent += ` Sua pontuação final foi: ${finalScore}.`;
    }
}

nameInputButton.addEventListener('click', () => {
    let playerName = playerNameInput.value.trim();
    if (playerName === '') {
        playerName = 'Anônimo';
    }
    const newScoreEntry = { name: playerName, score: score };
    const scores = loadHighScores();
    scores.push(newScoreEntry);
    saveHighScores(scores);

    nameInputContainer.style.display = 'none';
    startButton.style.display = 'block';
    messageDisplay.textContent = `Recorde salvo! ${playerName}: ${score} pontos.`;
});

resumeButton.addEventListener('click', () => {
    gameElements.player.style.display = 'block';
    playerDirection = '';
    messageDisplay.textContent = 'Use as setas do teclado para mover.';
    playerMoveInterval = setInterval(movePlayer, playerSpeed);
    ghostInterval = setInterval(moveGhosts, ghostSpeed);
    deactivateInvulnerability();
    resumeButton.style.display = 'none';
    gameRunning = true;
});


initializeGame(currentLevel);
displayHighScores();
startButton.addEventListener('click', startGame);
