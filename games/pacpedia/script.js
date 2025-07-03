const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 20; // Tamanho de cada "quadradinho" do mapa
const MAP_WIDTH = 25; // Largura do mapa em tiles
const MAP_HEIGHT = 20; // Altura do mapa em tiles

canvas.width = MAP_WIDTH * TILE_SIZE;
canvas.height = MAP_HEIGHT * TILE_SIZE;

let gameMap = []; // Array para armazenar o mapa
let player = { x: 1, y: 1, dx: 0, dy: 0, score: 0, level: 1 }; // Adicionado level ao jogador
let ghosts = []; // Array para armazenar os fantasmas

// Cores
const WALL_COLOR = 'blue';
const PELLET_COLOR = 'white';
const PLAYER_COLOR = 'yellow';
const GHOST_COLORS = ['red', 'pink', 'cyan', 'orange'];

// --- Variáveis para o HUD e controle de jogo ---
let gameInterval; // Para controlar o loop do jogo com setInterval
let gameSpeed = 150; // Velocidade do jogo em milissegundos (menor = mais rápido)
let isGameRunning = false; // Estado do jogo
let ghostMoveCounter = 0; // Contador para controlar a velocidade do fantasma
const GHOST_MOVE_RATE = 2; // Fantasma move 1 vez a cada 2 movimentos do jogador (maior = mais lento)

// --- Novas variáveis para Recordes ---
let highScores = []; // Array para armazenar os recordes
const MAX_HIGH_SCORES = 5; // Limite de recordes a serem salvos
const HIGHSCORE_STORAGE_KEY = 'pacman_highscores'; // Chave para localStorage

// Elementos do HUD
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('scoreDisplay');
const highScoresDisplay = document.getElementById('highScoresDisplay'); // Novo elemento
const messageDisplay = document.getElementById('messageDisplay');
const startButton = document.getElementById('startButton');
const settingsButton = document.getElementById('settingsButton');

// Elementos do painel de configurações
const settingsPanel = document.getElementById('settingsPanel');
const speedRange = document.getElementById('speedRange');
const currentSpeedValue = document.getElementById('currentSpeedValue');
const closeSettingsButton = document.getElementById('closeSettingsButton');

// --- Funções de Geração e Desenho ---
function generateMap() {
    gameMap = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        gameMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                gameMap[y][x] = 1; // Paredes nas bordas
            } else if (Math.random() < 0.25) { // 25% de chance de ser uma parede interna
                gameMap[y][x] = 1; // Parede
            } else {
                gameMap[y][x] = 0; // Espaço vazio
            }
        }
    }

    // Encontra uma posição vazia para o jogador
    let playerStartX, playerStartY;
    do {
        playerStartX = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
        playerStartY = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
    } while (gameMap[playerStartY][playerStartX] === 1);
    player.x = playerStartX;
    player.y = playerStartY;
    gameMap[player.y][player.x] = 0; // Garante que a posição inicial do jogador seja vazia

    // Encontra posições vazias para os fantasmas
    ghosts = [];
    // O número de fantasmas pode aumentar com o nível!
    const numGhosts = Math.min(5, 2 + Math.floor(player.level / 2)); // 2 fantasmas + 1 a cada 2 níveis, máx 5
    for (let i = 0; i < numGhosts; i++) {
        let ghostStartX, ghostStartY;
        do {
            ghostStartX = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
            ghostStartY = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
        } while (gameMap[ghostStartY][ghostStartX] === 1 || (ghostStartX === player.x && ghostStartY === player.y));
        ghosts.push({ x: ghostStartX, y: ghostStartY });
        gameMap[ghostStartY][ghostStartX] = 0; // Garante que a posição inicial do fantasma seja vazia
    }
    
    // Adiciona pastilhas em todos os espaços vazios iniciais
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
        for (let x = 1; x < MAP_WIDTH - 1; x++) {
            if (gameMap[y][x] === 0) { // Se for espaço vazio
                gameMap[y][x] = 2; // Pastilha
            }
        }
    }

    // Remover pastilhas inalcançáveis
    removeUnreachablePellets();
}

function removeUnreachablePellets() {
    const visited = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(false));
    const reachableCells = [];

    const queue = [{ x: player.x, y: player.y }];
    visited[player.y][player.x] = true;
    reachableCells.push({ x: player.x, y: player.y });

    while (queue.length > 0) {
        const current = queue.shift();
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dx, dy] of directions) {
            const nextX = current.x + dx;
            const nextY = current.y + dy;

            if (nextX >= 0 && nextX < MAP_WIDTH &&
                nextY >= 0 && nextY < MAP_HEIGHT &&
                gameMap[nextY][nextX] !== 1 &&
                !visited[nextY][nextX]) {
                
                visited[nextY][nextX] = true;
                reachableCells.push({ x: nextX, y: nextY });
                queue.push({ x: nextX, y: nextY });
            }
        }
    }

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (gameMap[y][x] === 2) {
                let isReachable = false;
                for (const cell of reachableCells) {
                    if (cell.x === x && cell.y === y) {
                        isReachable = true;
                        break;
                    }
                }
                if (!isReachable) {
                    gameMap[y][x] = 0;
                }
            }
        }
    }
}

function drawMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;

            if (gameMap[y][x] === 1) { // Parede
                ctx.fillStyle = WALL_COLOR;
                ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            } else if (gameMap[y][x] === 2) { // Pastilha
                ctx.fillStyle = PELLET_COLOR;
                ctx.beginPath();
                ctx.arc(tileX + TILE_SIZE / 2, tileY + TILE_SIZE / 2, TILE_SIZE / 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc(player.x * TILE_SIZE + TILE_SIZE / 2, player.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawGhosts() {
    ghosts.forEach((ghost, index) => {
        ctx.fillStyle = GHOST_COLORS[index % GHOST_COLORS.length];
        ctx.beginPath();
        ctx.arc(ghost.x * TILE_SIZE + TILE_SIZE / 2, ghost.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(ghost.x * TILE_SIZE + TILE_SIZE / 2 - TILE_SIZE / 8, ghost.y * TILE_SIZE + TILE_SIZE / 2 - TILE_SIZE / 8, TILE_SIZE / 8, 0, Math.PI * 2);
        ctx.arc(ghost.x * TILE_SIZE + TILE_SIZE / 2 + TILE_SIZE / 8, ghost.y * TILE_SIZE + TILE_SIZE / 2 - TILE_SIZE / 8, TILE_SIZE / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(ghost.x * TILE_SIZE + TILE_SIZE / 2 - TILE_SIZE / 8, ghost.y * TILE_SIZE + TILE_SIZE / 2 - TILE_SIZE / 8, TILE_SIZE / 16, 0, Math.PI * 2);
        ctx.arc(ghost.x * TILE_SIZE + TILE_SIZE / 2 + TILE_SIZE / 8, ghost.y * TILE_SIZE + TILE_SIZE / 2 - TILE_SIZE / 8, TILE_SIZE / 16, 0, Math.PI * 2);
        ctx.fill();
    });
}

// --- Funções de Movimentação e Colisão ---
function movePlayer() {
    const newPlayerX = player.x + player.dx;
    const newPlayerY = player.y + player.dy;

    if (newPlayerX >= 0 && newPlayerX < MAP_WIDTH &&
        newPlayerY >= 0 && newPlayerY < MAP_HEIGHT &&
        gameMap[newPlayerY][newPlayerX] !== 1) { // Se não for parede
        
        player.x = newPlayerX;
        player.y = newPlayerY;

        // Coleta pastilha
        if (gameMap[player.y][player.x] === 2) {
            player.score++;
            gameMap[player.y][player.x] = 0; // Remove a pastilha
            updateScoreDisplay(); // Atualiza a pontuação no HUD
        }
    }
}

function moveGhosts() {
    ghosts.forEach(ghost => {
        const possibleMoves = [];
        if (ghost.x - 1 >= 0 && gameMap[ghost.y][ghost.x - 1] !== 1) possibleMoves.push({ dx: -1, dy: 0 });
        if (ghost.x + 1 < MAP_WIDTH && gameMap[ghost.y][ghost.x + 1] !== 1) possibleMoves.push({ dx: 1, dy: 0 });
        if (ghost.y - 1 >= 0 && gameMap[ghost.y - 1][ghost.x] !== 1) possibleMoves.push({ dx: 0, dy: -1 });
        if (ghost.y + 1 < MAP_HEIGHT && gameMap[ghost.y + 1][ghost.x] !== 1) possibleMoves.push({ dx: 0, dy: 1 });

        if (possibleMoves.length > 0) {
            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            ghost.x += move.dx;
            ghost.y += move.dy;
        }

        // Colisão com o jogador
        if (player.x === ghost.x && player.y === ghost.y) {
            endGame('Game Over!');
        }
    });
}

// --- Funções de Recordes ---
function loadHighScores() {
    const storedScores = localStorage.getItem(HIGHSCORE_STORAGE_KEY);
    if (storedScores) {
        highScores = JSON.parse(storedScores);
    }
    updateHighScoresDisplay();
}

function saveHighScore(score) {
    highScores.push(score);
    highScores.sort((a, b) => b - a); // Ordena do maior para o menor
    highScores = highScores.slice(0, MAX_HIGH_SCORES); // Mantém apenas os top X
    localStorage.setItem(HIGHSCORE_STORAGE_KEY, JSON.stringify(highScores));
    updateHighScoresDisplay();
}

function updateHighScoresDisplay() {
    if (highScores.length === 0) {
        highScoresDisplay.textContent = 'Recordes: Nenhum ainda.';
    } else {
        highScoresDisplay.textContent = 'Recordes:\n' + highScores.map((score, index) => `${index + 1}. ${score} pontos`).join('\n');
    }
}


// --- Funções de Controle de Jogo e HUD ---
function updateScoreDisplay() {
    scoreDisplay.textContent = `Pontuação: ${player.score} | Nível: ${player.level}`;
}

function showHUD() {
    hud.classList.remove('hidden');
}

function hideHUD() {
    hud.classList.add('hidden');
}

function showSettings() {
    settingsPanel.classList.remove('hidden');
    hideHUD(); // Oculta o HUD enquanto as configurações estão abertas
}

function hideSettings() {
    settingsPanel.classList.add('hidden');
    showHUD(); // Mostra o HUD novamente
}

function startGame() {
    if (isGameRunning) return; // Evita iniciar o jogo múltiplas vezes
    isGameRunning = true;
    hideHUD(); // Oculta o HUD
    messageDisplay.textContent = ''; // Limpa a mensagem

    player.level = 1; // Reseta o nível para 1 ao iniciar um novo jogo
    player.score = 0; // Reseta a pontuação
    resetGame(); // Reseta o estado do jogo e gera um novo mapa
    
    // Inicia o loop do jogo com setInterval para controlar a velocidade
    clearInterval(gameInterval); // Limpa qualquer intervalo anterior
    gameInterval = setInterval(gameLoop, gameSpeed);
}

function endGame(message) {
    isGameRunning = false;
    clearInterval(gameInterval); // Para o loop do jogo
    saveHighScore(player.score); // Salva a pontuação atual como recorde
    messageDisplay.textContent = message + ` Sua pontuação final: ${player.score}`;
    showHUD(); // Mostra o HUD com a mensagem de fim de jogo
}

function nextLevel() {
    player.level++;
    player.dx = 0;
    player.dy = 0; // Reseta a direção do jogador para que ele não continue movendo
    messageDisplay.textContent = `Nível ${player.level}! Preparar...`;
    showHUD();
    setTimeout(() => {
        hideHUD();
        resetGame(); // Gera novo mapa para o próximo nível
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }, 2000); // 2 segundos de pausa para o jogador se preparar
}

function gameLoop() {
    if (!isGameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    movePlayer();
    
    // Controla a velocidade do fantasma em relação ao jogador
    ghostMoveCounter++;
    // Aumenta a frequência de movimento dos fantasmas com o nível
    const currentGhostMoveRate = Math.max(1, GHOST_MOVE_RATE - Math.floor((player.level - 1) / 2)); 
    if (ghostMoveCounter % currentGhostMoveRate === 0) {
        moveGhosts();
        ghostMoveCounter = 0;
    }

    drawMap();
    drawPlayer();
    drawGhosts();

    // Verifica se todas as pastilhas foram coletadas
    let remainingPellets = 0;
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (gameMap[y][x] === 2) {
                remainingPellets++;
            }
        }
    }
    if (remainingPellets === 0) {
        // Fase completa! Avance para o próximo nível
        nextLevel();
    }
}

function resetGame() {
    player.dx = 0;
    player.dy = 0; // Zera a direção do jogador
    generateMap(); // Gera um novo mapa aleatório
    updateScoreDisplay(); // Atualiza a pontuação e o nível no HUD
}


// --- Event Listeners ---
document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;

    // Impede que o jogador mude de direção se já estiver numa direção e tentar mover na mesma
    // Permite mudar de direção mesmo estando em movimento
    switch (e.key) {
        case 'ArrowUp':
            player.dx = 0; player.dy = -1;
            break;
        case 'ArrowDown':
            player.dx = 0; player.dy = 1;
            break;
        case 'ArrowLeft':
            player.dx = -1; player.dy = 0;
            break;
        case 'ArrowRight':
            player.dx = 1; player.dy = 0;
            break;
    }
});

startButton.addEventListener('click', startGame);
settingsButton.addEventListener('click', showSettings);
closeSettingsButton.addEventListener('click', hideSettings);

speedRange.addEventListener('input', (e) => {
    gameSpeed = parseInt(e.target.value);
    currentSpeedValue.textContent = gameSpeed;
    if (isGameRunning) {
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
});

// --- Inicialização ---
loadHighScores(); // Carrega os recordes ao iniciar o jogo
resetGame(); // Prepara o mapa e o jogador inicialmente para o nível 1
drawMap();
drawPlayer();
drawGhosts();
updateScoreDisplay(); // Exibe a pontuação e nível iniciais
showHUD(); // Mostra o HUD no início