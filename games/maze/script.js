document.addEventListener('DOMContentLoaded', () => {
    const mazeContainer = document.getElementById('maze');
    const player = document.getElementById('player');
    const startPoint = document.getElementById('start-point');
    const endPoint = document.getElementById('end-point');
    const timeDisplay = document.getElementById('time');
    const levelDisplay = document.getElementById('level');
    const restartButton = document.getElementById('restart-button');
    const nextLevelButton = document.getElementById('next-level-button');

    const cellSize = 20; // Tamanho de cada célula em pixels

    let maze = [];
    let numRows, numCols;
    let playerPos = { x: 0, y: 0 };
    let startPos = { x: 0, y: 0 };
    let endPos = { x: 0, y: 0 };

    let startTime;
    let timerInterval;
    let gameActive = false;
    let currentLevel = 1;

    // Configurações de cores para diferentes temas
    const colorThemes = [
        { // Tema 1: Azul Ciano (Padrão)
            '--bg-color': '#282c34',
            '--border-color': '#61dafb',
            '--wall-color': '#61dafb',
            '--path-color': '#333',
            '--player-color': '#e0b0ff',
            '--start-color': '#4CAF50',
            '--start-border-color': '#388E3C',
            '--end-color': '#f44336',
            '--end-border-color': '#D32F2F',
        },
        { // Tema 2: Verde Floresta
            '--bg-color': '#224036',
            '--border-color': '#6cc091',
            '--wall-color': '#6cc091',
            '--path-color': '#1a2a22',
            '--player-color': '#d1f0c4',
            '--start-color': '#A5D6A7',
            '--start-border-color': '#66BB6A',
            '--end-color': '#FF8A65',
            '--end-border-color': '#FF5722',
        },
        { // Tema 3: Roxo Escuro
            '--bg-color': '#3a2b4f',
            '--border-color': '#9b59b6',
            '--wall-color': '#9b59b6',
            '--path-color': '#281d3a',
            '--player-color': '#f3e5f5',
            '--start-color': '#81C784',
            '--start-border-color': '#4CAF50',
            '--end-color': '#EF9A9A',
            '--end-border-color': '#E57373',
        },
        { // Tema 4: Laranja Pôr do Sol
            '--bg-color': '#4d392b',
            '--border-color': '#ffa726',
            '--wall-color': '#ffa726',
            '--path-color': '#382a1f',
            '--player-color': '#ffe0b2',
            '--start-color': '#FFD54F',
            '--start-border-color': '#FFC107',
            '--end-color': '#FF7043',
            '--end-border-color': '#F4511E',
        }
    ];

    // --- Algoritmo de Geração de Labirinto (DFS) ---
    function generateMaze(rows, cols) {
        // As dimensões devem ser ímpares para um labirinto bem formado com paredes de 1 célula
        numRows = rows % 2 === 0 ? rows + 1 : rows;
        numCols = cols % 2 === 0 ? cols + 1 : cols;

        // Inicializa todas as células como paredes
        const newMaze = Array(numRows).fill(0).map(() => Array(numCols).fill(1));

        // Define o ponto de partida aleatório para a geração (deve ser em uma célula ímpar para ser um caminho)
        let startRow = 1;
        let startCol = 1;

        const stack = [[startRow, startCol]];
        newMaze[startRow][startCol] = 0; // Marca como caminho

        while (stack.length > 0) {
            const [currentRow, currentCol] = stack[stack.length - 1]; // Pega o último da pilha

            const neighbors = [];
            // Vizinhos potenciais (2 células de distância para garantir que estamos "cavando" caminhos)
            // Cima
            if (currentRow - 2 > 0 && newMaze[currentRow - 2][currentCol] === 1) {
                neighbors.push([currentRow - 2, currentCol]);
            }
            // Baixo
            if (currentRow + 2 < numRows - 1 && newMaze[currentRow + 2][currentCol] === 1) {
                neighbors.push([currentRow + 2, currentCol]);
            }
            // Esquerda
            if (currentCol - 2 > 0 && newMaze[currentRow][currentCol - 2] === 1) {
                neighbors.push([currentRow, currentCol - 2]);
            }
            // Direita
            if (currentCol + 2 < numCols - 1 && newMaze[currentRow][currentCol + 2] === 1) {
                neighbors.push([currentRow, currentCol + 2]);
            }

            if (neighbors.length > 0) {
                // Escolhe um vizinho aleatoriamente
                const [nextRow, nextCol] = neighbors[Math.floor(Math.random() * neighbors.length)];

                // Remove a parede entre a célula atual e o vizinho
                newMaze[nextRow][nextCol] = 0;
                newMaze[currentRow + (nextRow - currentRow) / 2][currentCol + (nextCol - currentCol) / 2] = 0;

                stack.push([nextRow, nextCol]);
            } else {
                stack.pop(); // Não há vizinhos para visitar, volta na pilha
            }
        }

        // Definir pontos de início e fim
        // Garantir que os pontos sejam sempre caminhos (0)
        // O ponto inicial sempre será (1,1) ou (0,0) dependendo se incluímos bordas como paredes
        startPos = { x: 1, y: 1 };
        newMaze[startPos.y][startPos.x] = 0; // Garante que o início é um caminho

        // Encontrar um ponto final aleatório longe do início
        let foundEnd = false;
        while (!foundEnd) {
            const randY = Math.floor(Math.random() * (numRows - 2)) + 1; // Não pega bordas
            const randX = Math.floor(Math.random() * (numCols - 2)) + 1; // Não pega bordas

            if (newMaze[randY][randX] === 0 && (Math.abs(randY - startPos.y) + Math.abs(randX - startPos.x)) > (numRows + numCols) / 4) {
                // Garante que é um caminho e que está a uma distância razoável do início
                endPos = { x: randX, y: randY };
                foundEnd = true;
            }
        }
        newMaze[endPos.y][endPos.x] = 0; // Garante que o fim é um caminho

        return newMaze;
    }

    // Aplica o tema de cores ao DOM
    function applyColorTheme(theme) {
        const root = document.documentElement;
        for (const [prop, value] of Object.entries(theme)) {
            root.style.setProperty(prop, value);
        }
    }

    // Cria o labirinto no HTML
    function drawMaze() {
        mazeContainer.innerHTML = ''; // Limpa o labirinto existente
        mazeContainer.style.gridTemplateColumns = `repeat(${numCols}, ${cellSize}px)`;
        mazeContainer.style.gridTemplateRows = `repeat(${numRows}, ${cellSize}px)`;

        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                const cell = document.createElement('div');
                cell.classList.add(maze[row][col] === 1 ? 'wall' : 'path');
                mazeContainer.appendChild(cell);
            }
        }

        // Posiciona o ponto de início
        startPoint.style.left = `${startPos.x * cellSize}px`;
        startPoint.style.top = `${startPos.y * cellSize}px`;
        startPoint.style.width = `${cellSize}px`;
        startPoint.style.height = `${cellSize}px`;
        startPoint.textContent = 'Início';
        startPoint.style.fontSize = `${cellSize * 0.4}px`;
        startPoint.style.lineHeight = `${cellSize}px`;

        // Posiciona o ponto final
        endPoint.style.left = `${endPos.x * cellSize}px`;
        endPoint.style.top = `${endPos.y * cellSize}px`;
        endPoint.style.width = `${cellSize}px`;
        endPoint.style.height = `${cellSize}px`;
        endPoint.textContent = 'Fim';
        endPoint.style.fontSize = `${cellSize * 0.4}px`;
        endPoint.style.lineHeight = `${cellSize}px`;
    }

    // Atualiza a posição visual do jogador
    function updatePlayerPosition() {
        player.style.left = `${playerPos.x * cellSize}px`;
        player.style.top = `${playerPos.y * cellSize}px`;
    }

    // Inicia o contador de tempo
    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const minutes = Math.floor(elapsedTime / 60000);
            const seconds = Math.floor((elapsedTime % 60000) / 1000);
            timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    // Para o contador de tempo
    function stopTimer() {
        clearInterval(timerInterval);
    }

    // Verifica se a nova posição é válida (não é uma parede)
    function isValidMove(x, y) {
        // Verifica se está dentro dos limites do labirinto e se não é uma parede
        return x >= 0 && x < numCols && y >= 0 && y < numRows && maze[y][x] === 0;
    }

    // Lida com a movimentação do jogador
    function handleKeyDown(event) {
        if (!gameActive) return;

        let newX = playerPos.x;
        let newY = playerPos.y;

        switch (event.key) {
            case 'ArrowUp':
                newY--;
                break;
            case 'ArrowDown':
                newY++;
                break;
            case 'ArrowLeft':
                newX--;
                break;
            case 'ArrowRight':
                newX++;
                break;
            default:
                return; // Ignora outras teclas
        }

        if (isValidMove(newX, newY)) {
            playerPos.x = newX;
            playerPos.y = newY;
            updatePlayerPosition();
            checkWin();
        }
    }

    // Verifica se o jogador chegou ao final
    function checkWin() {
        if (playerPos.x === endPos.x && playerPos.y === endPos.y) {
            stopTimer();
            gameActive = false;
            alert(`Parabéns! Você completou a Fase ${currentLevel} em ${timeDisplay.textContent}!`);
            nextLevelButton.style.display = 'inline-block'; // Mostra o botão de próxima fase
        }
    }

    // Inicia uma nova fase
    function startNewLevel() {
        currentLevel++;
        levelDisplay.textContent = currentLevel;

        // Aumenta o tamanho do labirinto a cada fase (opcional, ajuste conforme desejar)
        let mazeRows = 15 + (currentLevel - 1) * 2;
        let mazeCols = 25 + (currentLevel - 1) * 2;

        // Garante que as dimensões sejam ímpares
        mazeRows = mazeRows % 2 === 0 ? mazeRows + 1 : mazeRows;
        mazeCols = mazeCols % 2 === 0 ? mazeCols + 1 : mazeCols;

        maze = generateMaze(mazeRows, mazeCols);
        drawMaze();

        // Reseta a posição do jogador para o início do novo labirinto
        playerPos = { ...startPos };
        updatePlayerPosition();

        // Ajusta o tamanho do container do jogo
        document.getElementById('game-container').style.width = `${numCols * cellSize}px`;
        document.getElementById('game-container').style.height = `${numRows * cellSize}px`;

        // Aplica um tema de cor aleatório
        const randomThemeIndex = Math.floor(Math.random() * colorThemes.length);
        applyColorTheme(colorThemes[randomThemeIndex]);

        timeDisplay.textContent = '00:00';
        gameActive = true;
        startTimer();
        nextLevelButton.style.display = 'none'; // Esconde o botão de próxima fase
    }

    // Reinicia o jogo (vai para a fase 1)
    function restartGame() {
        currentLevel = 0; // Será incrementado para 1 em startNewLevel
        startNewLevel();
    }

    // Event Listeners
    document.addEventListener('keydown', handleKeyDown);
    restartButton.addEventListener('click', restartGame);
    nextLevelButton.addEventListener('click', startNewLevel);

    // Inicialização do jogo
    initGame();

    function initGame() {
        restartGame(); // Inicia a primeira fase
    }
});