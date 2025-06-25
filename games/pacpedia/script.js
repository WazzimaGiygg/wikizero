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
let isDeveloperInvulnerable = false; // Novo estado para invulnerabilidade do desenvolvedor

let ghostInterval;
let playerMoveInterval;
let invulnerabilityTimeout;

let isInvulnerable = false;

const developerButton = document.getElementById('developer-button');
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

// --- NOVA FUNÇÃO: Alterna a invulnerabilidade do desenvolvedor ---
function toggleDeveloperInvulnerability() {
    isDeveloperInvulnerable = !isDeveloperInvulnerable; // Inverte o estado

    if (isDeveloperInvulnerable) {
        // Ativação da invulnerabilidade do desenvolvedor
        isInvulnerable = true; // Define o estado geral de invulnerabilidade
        gameElements.player.style.outline = '4px dashed red'; // Borda visual para invencibilidade
        gameElements.player.style.backgroundColor = 'purple'; // Cor diferente para desenvolvedor
        developerButton.textContent = 'Desenvolvedor: Invencível (Ativado)';
        messageDisplay.textContent = 'Modo Desenvolvedor: Invencibilidade ATIVADA!';

        // Garanta que os fantasmas não fiquem assustados por esta invulnerabilidade
        gameElements.ghosts.forEach(ghost => {
            ghost.element.classList.remove('scared');
            ghost.speedMultiplier = 1;
        });

        // Limpa qualquer invulnerabilidade temporária de power pellet que possa estar ativa
        if (invulnerabilityTimeout) {
            clearTimeout(invulnerabilityTimeout);
            invulnerabilityTimeout = null;
        }

    } else {
        // Desativação da invulnerabilidade do desenvolvedor
        isInvulnerable = false; // Desativa o estado geral de invulnerabilidade
        gameElements.player.style.outline = 'none'; // Remove a borda
        gameElements.player.style.backgroundColor = '#ff0'; // Retorna à cor normal do player
        developerButton.textContent = 'Desenvolvedor: Invencível';
        messageDisplay.textContent = 'Modo Desenvolvedor: Invencibilidade DESATIVADA!';
    }
}
// --- FIM NOVA FUNÇÃO: Alterna a invulnerabilidade do desenvolvedor ---

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
            if (isInvulnerable) { // Verifica a invulnerabilidade geral (dev ou power pellet)
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
                    if (isInvulnerable && !isDeveloperInvulnerable) { // Apenas se não for dev mode
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

        if (currentLevel < maps.length - 1) {
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
    // Não desativar a invulnerabilidade de desenvolvedor aqui se ela estiver ativa
    if (!isDeveloperInvulnerable) {
        deactivateInvulnerability();
    }


    playerMoveInterval = setInterval(movePlayer, playerSpeed);
    ghostInterval = setInterval(moveGhosts, ghostSpeed);
}
// --- FIM da modificação startGame ---

// (Mantenha as funções movePlayer, moveGhosts, endGame, keyboard controls, high score logic)

// --- Adicione o Event Listener para o botão Desenvolvedor ---
developerButton.addEventListener('click', toggleDeveloperInvulnerability);
// --- Fim do Event Listener do botão Desenvolvedor ---

// --- Inicialização (mantenha como está) ---
initializeGame(currentLevel);
displayHighScores();
startButton.addEventListener('click', startGame);
// --- Fim da Inicialização ---
