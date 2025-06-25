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
let isFrenzyModeActive = false;
let frenzyTimeout = null; // Para controlar o tempo do modo frenesi
// Removido: let isDeveloperInvulnerable = false; // Novo estado para invulnerabilidade do desenvolvedor

let ghostInterval;
let playerMoveInterval;
let invulnerabilityTimeout;

let isInvulnerable = false;

// Removido: const developerButton = document.getElementById('developer-button');
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

    // Ensure borders are walls
    for (let r = 0; r < rows; r++) {
        newMap[r][0] = 1;
        newMap[r][cols - 1] = 1;
    }
    for (let c = 0; c < cols; c++) {
        newMap[0][c] = 1;
        newMap[rows - 1][c] = 1;
    }

    // Create random paths
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            if (Math.random() > 0.3) {
                newMap[r][c] = 0; // 0 for path
            }
        }
    }

    let playerSpawn = {x: -1, y: -1};
    let ghostSpawns = [];
    let powerPelletSpawns = [];

    // Collect all open cells (paths)
    let openCells = [];
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            if (newMap[r][c] === 0) {
                openCells.push({ x: c, y: r });
            }
        }
    }

    // Shuffle open cells for random placement
    for (let i = openCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [openCells[i], openCells[j]] = [openCells[j], openCells[i]];
    }

    // Place player, ghosts, and power pellets
    if (openCells.length > 0) {
        playerSpawn = openCells.pop();
        newMap[playerSpawn.y][playerSpawn.x] = 3; // 3 for player spawn
    }

    let numGhosts = Math.min(2 + currentLevel, Math.floor(openCells.length / 10)); // More ghosts with levels
    for (let i = 0; i < numGhosts && openCells.length > 0; i++) {
        const pos = openCells.pop();
        ghostSpawns.push(pos);
        newMap[pos.y][pos.x] = 4; // 4 for ghost spawn
    }

    let numPowerPellets = Math.min(2, Math.floor(openCells.length / 20)); // Max 2 power pellets
    for (let i = 0; i < numPowerPellets && openCells.length > 0; i++) {
        const pos = openCells.pop();
        powerPelletSpawns.push(pos);
        newMap[pos.y][pos.x] = 5; // 5 for power pellet
    }

    // Fill remaining open cells with dots
    openCells.forEach(cell => {
        newMap[cell.y][cell.x] = 2; // 2 for dot
    });

    console.log("Generated Map for Level", currentLevel, ":", newMap);
    return newMap;
}

// --- NOVA FUNÇÃO: detectIsolatedPoints ---
function detectIsolatedPoints(map) {
    const rows = map.length;
    const cols = map[0].length;
    const visited = Array(rows).fill(0).map(() => Array(cols).fill(false));
    const queue = [];
    const isolated = [];

    let playerStart = { r: -1, c: -1 };

    // Find player's starting position (3)
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (map[r][c] === 3) {
                playerStart = { r, c };
                break;
            }
        }
        if (playerStart.r !== -1) break;
    }

    // If no player start, all items are isolated (or map is invalid)
    if (playerStart.r === -1) {
        console.warn("Player spawn not found in map. All dots/pellets will be considered isolated.");
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (map[r][c] === 2) {
                    isolated.push({ x: c, y: r, type: 'dot' });
                } else if (map[r][c] === 5) {
                    isolated.push({ x: c, y: r, type: 'power-pellet' });
                }
            }
        }
        return isolated;
    }

    // BFS setup
    queue.push(playerStart);
    visited[playerStart.r][playerStart.c] = true;

    const dr = [-1, 1, 0, 0]; // row changes for up, down, left, right
    const dc = [0, 0, -1, 1]; // column changes for up, down, left, right

    let reachableCells = new Set();
    reachableCells.add(`${playerStart.c},${playerStart.r}`);

    while (queue.length > 0) {
        const { r, c } = queue.shift();

        for (let i = 0; i < 4; i++) {
            const nr = r + dr[i];
            const nc = c + dc[i];

            // Check bounds
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                // Check if not a wall (1) and not visited
                if (map[nr][nc] !== 1 && !visited[nr][nc]) {
                    visited[nr][nc] = true;
                    queue.push({ r: nr, c: nc });
                    reachableCells.add(`${nc},${nr}`);
                }
            }
        }
    }

    // Identify isolated dots and power pellets
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cellValue = map[r][c];
            const cellCoord = `${c},${r}`;
            if ((cellValue === 2 || cellValue === 5) && !reachableCells.has(cellCoord)) {
                if (cellValue === 2) {
                    isolated.push({ x: c, y: r, type: 'dot' });
                } else { // cellValue === 5
                    isolated.push({ x: c, y: r, type: 'power-pellet' });
                }
            }
        }
    }
    return isolated;
}
// --- FIM NOVA FUNÇÃO: detectIsolatedPoints ---

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


    let tempMap = currentMapData.map(row => [...row]); // Create a mutable copy

    let initialGhostPositions = [];
    for (let r = 0; r < tempMap.length; r++) {
        for (let c = 0; c < tempMap[r].length; c++) {
            const cellValue = tempMap[r][c];
            if (cellValue === 3) {
                playerX = c;
                playerY = r;
                tempMap[r][c] = 0; // Change player spawn cell to path for rendering
            } else if (cellValue === 4) {
                initialGhostPositions.push({ x: c, y: r });
                tempMap[r][c] = 0; // Change ghost spawn cell to path for rendering
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
                if (currentMapData[r][c] === 2) { // Use currentMapData to place dots based on initial generation
                    const dot = document.createElement('div');
                    dot.classList.add('dot');
                    dot.style.left = `${c * CELL_SIZE + (CELL_SIZE / 2 - 4)}px`;
                    dot.style.top = `${r * CELL_SIZE + (CELL_SIZE / 2 - 4)}px`;
                    gameContainer.appendChild(dot);
                    gameElements.dots.push({ element: dot, x: c, y: r });
                    dotsCount++;
                } else if (currentMapData[r][c] === 5) { // Use currentMapData for power pellets
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
    const isolatedPoints = detectIsolatedPoints(currentMapData); // Use the original map data
    if (isolatedPoints.length > 0) {
        console.warn(`Nível ${mapIndex + 1} possui ${isolatedPoints.length} pontos isolados. Reduzindo dotsCount.`);
        // Ensure dotsCount is only reduced if the item was truly a dot or power-pellet
        isolatedPoints.forEach(isolated => {
            if (isolated.type === 'dot') {
                dotsCount--;
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
    // Remove existing ghost elements before re-creating for new level
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

// --- Modifique a função activateInvulnerability ---
function activateInvulnerability() {
    // Esta função é para power pellets.
    isInvulnerable = true;
    gameElements.player.style.backgroundColor = '#00f'; // Player turns blue
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
// --- Fim da modificação activateInvulnerability ---

// --- Modifique a função deactivateInvulnerability ---
function deactivateInvulnerability() {
    // Esta função é para power pellets.
    isInvulnerable = false;
    gameElements.player.style.backgroundColor = '#ff0'; // Player returns to yellow
    gameElements.ghosts.forEach(ghost => {
        ghost.element.classList.remove('scared');
        ghost.speedMultiplier = 1;
    });
    gameElements.ghostElements.forEach(g => g.style.animation = '');
}
// --- Fim da modificação deactivateInvulnerability ---

// Removida: Função toggleDeveloperInvulnerability
// Removida: Event Listener para o botão Desenvolvedor

function checkCollisions() {
    // Verifica colisões com dots
    gameElements.dots.forEach((dot, index) => {
        if (dot.element.style.display !== 'none' && dot.x === playerX && dot.y === playerY) {
            dot.element.style.display = 'none';
            score++;
            // Se o modo frenesi estiver ativo, adicione o bônus
            if (isFrenzyModeActive) {
                score = Math.round(score * 1.01); // 1% de bônus, arredondado
                messageDisplay.textContent = `Frenesi! Ponto +1% bônus! Pontos: ${score}`;
            }
            dotsCount--;
            scoreDisplay.textContent = `Pontos: ${score}`;

            // Se o modo frenesi estiver ativo e todos os dots forem coletados, limpa o timeout
            if (isFrenzyModeActive && dotsCount === 0) {
                clearTimeout(frenzyTimeout);
                frenzyTimeout = null;
                isFrenzyModeActive = false;
            }

            // Ativa o modo frenesi se houver exatamente 5 dots restantes e não estiver ativo
            if (dotsCount === 5 && !isFrenzyModeActive) {
                isFrenzyModeActive = true;
                messageDisplay.textContent = 'MODO FRENESI ATIVADO! Colete os últimos 5 pontos em 5 segundos!';
                frenzyTimeout = setTimeout(() => {
                    if (dotsCount > 0) { // Se ainda houver dots, o tempo acabou
                        messageDisplay.textContent = 'Tempo do frenesi esgotado! Mudando de nível...';
                        // Forçar a mudança de nível
                        clearInterval(playerMoveInterval);
                        clearInterval(ghostInterval);
                        deactivateInvulnerability(); // Desativa invulnerabilidade normal
                        isFrenzyModeActive = false; // Desativa o modo frenesi
                        frenzyTimeout = null; // Limpa o timeout
                        setTimeout(() => {
                            // Gerar o próximo mapa antes de prosseguir
                            const nextLevelMap = generateRandomMap(MAP_ROWS, MAP_COLS);
                            maps.push(nextLevelMap);
                            currentLevel++;
                            startGame(); // Carrega o próximo nível
                        }, 2000);
                    }
                }, 5000); // 5 segundos para o frenesi
            }
        }
    });

    // Verifica colisões com power pellets (permanece inalterado)
    gameElements.powerPellets.forEach((pellet, index) => {
        if (pellet.element.style.display !== 'none' && pellet.x === playerX && pellet.y === playerY) {
            pellet.element.style.display = 'none';
            activateInvulnerability();
        }
    });

    // Verifica colisões com fantasmas
    gameElements.ghosts.forEach(ghost => {
        if (ghost.x === playerX && ghost.y === playerY && !ghost.isEaten) {
            if (isInvulnerable) { // Verifica a invulnerabilidade geral (agora apenas power pellet)
                // Jogador come o fantasma
                ghost.isEaten = true;
                ghost.element.style.display = 'none';
                score += 10;
                scoreDisplay.textContent = `Pontos: ${score}`;

                setTimeout(() => {
                    ghost.x = ghost.initialX;
                    ghost.y = ghost.initialY;
                    ghost.element.style.display = 'block';
                    ghost.isEaten = false;
                    // Se a invulnerabilidade de power pellet estiver ativa, o fantasma volta assustado
                    if (isInvulnerable) { // Agora apenas se for invulnerável por power-pellet
                           ghost.element.classList.add('scared');
                           ghost.speedMultiplier = 0.5;
                    } else {
                           ghost.element.classList.remove('scared');
                           ghost.speedMultiplier = 1;
                    }
                    updateGhostPositions();
                }, 3000);
            } else {
                // Jogador atingido pelo fantasma, perde uma vida
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
                    deactivateInvulnerability(); // Desativa invulnerabilidade normal (power pellet)

                    resumeButton.style.display = 'block';
                    startButton.style.display = 'none';
                    // Garante que o modo frenesi seja desativado ao perder uma vida
                    if (isFrenzyModeActive) {
                        clearTimeout(frenzyTimeout);
                        frenzyTimeout = null;
                        isFrenzyModeActive = false;
                    }
                }
            }
        }
    });

    // Verifica condição de vitória (todos os dots coletados)
    if (dotsCount === 0) {
        // Gerar o próximo mapa antes de prosseguir
        const nextLevelMap = generateRandomMap(MAP_ROWS, MAP_COLS);
        maps.push(nextLevelMap);

        if (currentLevel < maps.length - 1) { // Check if there's a next level (newly pushed)
            messageDisplay.textContent = 'Todos os pontos coletados! Preparando próximo nível...';
            clearInterval(playerMoveInterval);
            clearInterval(ghostInterval);
            deactivateInvulnerability();
            // Garante que o modo frenesi seja desativado ao vencer o nível
            if (isFrenzyModeActive) {
                clearTimeout(frenzyTimeout);
                frenzyTimeout = null;
                isFrenzyModeActive = false;
            }
            setTimeout(() => {
                currentLevel++;
                startGame(); // Carrega o próximo nível
            }, 2000); // 2 segundos de pausa
        } else {
            endGame('Parabéns! Você completou todos os níveis e coletou todos os pontos!');
        }
    }
}
// --- FIM da modificação checkCollisions ---

function movePlayer() {
    const currentMap = maps[currentLevel];
    let newPlayerX = playerX;
    let newPlayerY = playerY;

    if (playerDirection === 'up') newPlayerY--;
    else if (playerDirection === 'down') newPlayerY++;
    else if (playerDirection === 'left') newPlayerX--;
    else if (playerDirection === 'right') newPlayerX++;

    if (newPlayerY >= 0 && newPlayerY < currentMap.length &&
        newPlayerX >= 0 && newPlayerX < currentMap[0].length &&
        currentMap[newPlayerY][newPlayerX] !== 1) { // Check if not a wall
        playerX = newPlayerX;
        playerY = newPlayerY;
        updatePlayerPosition();
        checkCollisions();
    }
}

function moveGhosts() {
    const currentMap = maps[currentLevel];
    gameElements.ghosts.forEach(ghost => {
        if (ghost.isEaten) return;

        const possibleMoves = [];
        const dr = [-1, 1, 0, 0];
        const dc = [0, 0, -1, 1];

        for (let i = 0; i < 4; i++) {
            const newGhostY = ghost.y + dr[i];
            const newGhostX = ghost.x + dc[i];

            if (newGhostY >= 0 && newGhostY < currentMap.length &&
                newGhostX >= 0 && newGhostX < currentMap[0].length &&
                currentMap[newGhostY][newGhostX] !== 1) { // If not a wall
                possibleMoves.push({ x: newGhostX, y: newGhostY });
            }
        }

        if (possibleMoves.length > 0) {
            let nextMove;
            // If scared, move away from player (simple evasion)
            if (ghost.element.classList.contains('scared')) {
                let furthestDistance = -1;
                let bestMove = null;

                for (const move of possibleMoves) {
                    const dist = Math.abs(playerX - move.x) + Math.abs(playerY - move.y);
                    if (dist > furthestDistance) {
                        furthestDistance = dist;
                        bestMove = move;
                    }
                }
                nextMove = bestMove;
            } else {
                // Chase behavior (simple A* or just move closer)
                let closestDistance = Infinity;
                let bestMove = null;

                for (const move of possibleMoves) {
                    const dist = Math.abs(playerX - move.x) + Math.abs(playerY - move.y);
                    if (dist < closestDistance) {
                        closestDistance = dist;
                        bestMove = move;
                    }
                }
                nextMove = bestMove;
            }
            
            if (nextMove) {
                ghost.x = nextMove.x;
                ghost.y = nextMove.y;
            }
        }
    });
    updateGhostPositions();
    checkCollisions();
}


function endGame(message) {
    gameRunning = false;
    clearInterval(playerMoveInterval);
    clearInterval(ghostInterval);
    clearTimeout(invulnerabilityTimeout);
    clearTimeout(frenzyTimeout); // Clear frenzy timeout on game end
    frenzyTimeout = null;
    isFrenzyModeActive = false; // Deactivate frenzy mode on game end

    messageDisplay.textContent = message;
    startButton.style.display = 'block';
    resumeButton.style.display = 'none';

    // Removido: Verificação e desativação da invulnerabilidade de desenvolvedor
    
    // Check for high score
    const highScores = loadHighScores();
    const minScore = highScores.length < 5 ? -Infinity : highScores[highScores.length - 1].score; // Get the lowest score in top 5 or -Infinity if less than 5 scores

    if (score > minScore) {
        messageDisplay.textContent = `Novo Recorde! Sua pontuação: ${score}`;
        nameInputContainer.style.display = 'flex'; // Show input field
        playerNameInput.value = ''; // Clear previous name
        playerNameInput.focus();
        startButton.style.display = 'none'; // Hide start button until name is saved
    } else {
        messageDisplay.textContent += ` Sua pontuação final foi: ${score}.`;
    }
}

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    if (e.key === 'ArrowUp') playerDirection = 'up';
    else if (e.key === 'ArrowDown') playerDirection = 'down';
    else if (e.key === 'ArrowLeft') playerDirection = 'left';
    else if (e.key === 'ArrowRight') playerDirection = 'right';
});

// High Score Logic
function loadHighScores() {
    const scores = JSON.parse(localStorage.getItem('pacmanHighScores')) || [];
    return scores.sort((a, b) => b.score - a.score).slice(0, 5); // Keep top 5
}

function saveHighScores(scores) {
    const sortedScores = scores.sort((a, b) => b.score - a.score).slice(0, 5);
    localStorage.setItem('pacmanHighScores', JSON.stringify(sortedScores));
    displayHighScores();
}

function displayHighScores() {
    const scores = loadHighScores();
    highScoresList.innerHTML = '';
    if (scores.length === 0) {
        highScoresList.innerHTML = '<li>Nenhum recorde ainda.</li>';
        return;
    }
    scores.forEach((entry, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span class="player-name">${index + 1}. ${entry.name}</span> <span class="player-score">${entry.score}</span>`;
        highScoresList.appendChild(listItem);
    });
}

// --- Modifique a função startGame ---
function startGame() {
    // Resetar variáveis de jogo
    score = 0;
    lives = 3;
    currentLevel = 0; // Sempre começa do nível 0 ao iniciar um novo jogo
    maps = [generateRandomMap(MAP_ROWS, MAP_COLS)]; // Gerar o primeiro mapa

    messageDisplay.textContent = 'Use as setas do teclado para mover.';
    startButton.style.display = 'none';
    nameInputContainer.style.display = 'none';
    resumeButton.style.display = 'none'; // Esconde botão de retomar
    playerDirection = ''; // Reseta direção do jogador

    gameRunning = true;
    messageDisplay.textContent = `Nível ${currentLevel + 1}...`;

    initializeGame(currentLevel); // Inicializa com o mapa gerado

    // Limpar quaisquer intervalos existentes antes de iniciar novos
    clearInterval(playerMoveInterval);
    clearInterval(ghostInterval);
    clearTimeout(invulnerabilityTimeout); // Limpa timeout de invulnerabilidade
    // Garante que o modo frenesi seja desativado no início de um novo jogo
    if (frenzyTimeout) {
        clearTimeout(frenzyTimeout);
        frenzyTimeout = null;
    }
    isFrenzyModeActive = false;
    deactivateInvulnerability(); // Sempre desativa invulnerabilidade de power pellet ao iniciar um novo jogo


    playerMoveInterval = setInterval(movePlayer, playerSpeed);
    ghostInterval = setInterval(moveGhosts, ghostSpeed);
}
// --- FIM da modificação startGame ---

resumeButton.addEventListener('click', () => {
    gameRunning = true;
    messageDisplay.textContent = 'Jogo retomado!';
    resumeButton.style.display = 'none';
    startButton.style.display = 'none';
    playerMoveInterval = setInterval(movePlayer, playerSpeed);
    ghostInterval = setInterval(moveGhosts, ghostSpeed);
    gameElements.player.style.display = 'block';
});

nameInputButton.addEventListener('click', () => {
    let playerName = playerNameInput.value.trim();
    if (playerName === '') {
        playerName = 'Anônimo';
    }
    const newScoreEntry = { name: playerName, score: score };
    const scores = loadHighScores();
    scores.push(newScoreEntry);
    saveHighScores(scores); // Sorts and saves

    nameInputContainer.style.display = 'none'; // Hide input
    startButton.style.display = 'block'; // Show start button again
    messageDisplay.textContent = `Recorde salvo! ${playerName}: ${score} pontos.`;
});


// Removido: developerButton.addEventListener('click', toggleDeveloperInvulnerability);

// --- Inicialização ---
initializeGame(currentLevel); // Carrega o mapa inicial e posiciona o player
displayHighScores(); // Carrega e exibe os recordes
startButton.addEventListener('click', startGame); // Adiciona listener para iniciar o jogo
// --- Fim da Inicialização ---
