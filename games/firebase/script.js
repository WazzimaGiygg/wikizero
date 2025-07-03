// script.js

// --- Definição das Cartas e Variáveis Globais ---
const suits = ['hearts', 'diamonds', 'clubs', 'spades']; // Corações, Ouros, Paus, Espadas
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const suitSymbols = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
};

const redSuits = ['hearts', 'diamonds'];
const blackSuits = ['clubs', 'spades'];

// Variáveis de estado do jogo
let gameDeck = []; // O baralho de onde as cartas são compradas
let wastePile = []; // Pilha de descarte
let foundationPiles = [[], [], [], []]; // Quatro pilhas base (ases)
let tableauPiles = [[], [], [], [], [], [], []]; // Sete pilhas do tabuleiro

// Variáveis para o Drag and Drop
let draggedCard = null; // A carta (ou grupo de cartas) que está sendo arrastada
let originalPileData = { type: null, index: -1, cardIndex: -1 }; // Dados da pilha de origem
let draggedCardsArray = []; // Array para armazenar o grupo de cartas arrastadas no tableau

// --- Funções Principais do Jogo ---

/**
 * Cria um baralho padrão de 52 cartas.
 * @returns {Array<Object>} O baralho de cartas.
 */
function createDeck() {
    let deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({
                suit: suit,
                rank: rank,
                isFaceUp: false // Todas as cartas começam viradas para baixo no baralho
            });
        }
    }
    return deck;
}

/**
 * Embaralha um array usando o algoritmo Fisher-Yates.
 * @param {Array<Object>} deck O baralho a ser embaralhado.
 * @returns {Array<Object>} O baralho embaralhado.
 */
function shuffleDeck(deck) {
    let currentIndex = deck.length, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [deck[currentIndex], deck[randomIndex]] = [deck[randomIndex], deck[currentIndex]];
    }
    return deck;
}

/**
 * Inicializa o estado do jogo: cria e embaralha o baralho, e distribui as cartas.
 */
function initializeGame() {
    gameDeck = shuffleDeck(createDeck());

    // Limpa todas as pilhas para um novo jogo
    wastePile = [];
    foundationPiles = [[], [], [], []];
    tableauPiles = [[], [], [], [], [], [], []];

    // Distribui as cartas para as pilhas do tabuleiro
    for (let i = 0; i < 7; i++) { // Colunas
        for (let j = i; j < 7; j++) { // Cartas por coluna
            const card = gameDeck.pop();
            tableauPiles[j].push(card);
            // A última carta de cada pilha do tabuleiro fica virada para cima
            if (j === i) {
                card.isFaceUp = true;
            }
        }
    }
    renderGame(); // Exibe o estado inicial no HTML
}

/**
 * Cria um elemento HTML `div` para representar uma carta.
 * @param {Object} card O objeto da carta (suit, rank, isFaceUp).
 * @returns {HTMLElement} O elemento div da carta.
 */
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.dataset.suit = card.suit;
    cardDiv.dataset.rank = card.rank;

    if (card.isFaceUp) {
        cardDiv.classList.add('face-up');
        // Define a cor do texto com base no naipe
        if (redSuits.includes(card.suit)) {
            cardDiv.style.color = 'red';
        } else {
            cardDiv.style.color = 'black';
        }
        cardDiv.innerHTML = `<div class="rank">${card.rank}</div><div class="suit-symbol">${suitSymbols[card.suit]}</div>`;
    } else {
        cardDiv.classList.add('back');
    }
    return cardDiv;
}

/**
 * Renderiza todo o estado atual do jogo no HTML.
 * Atualiza todas as pilhas e cartas visíveis.
 */
function renderGame() {
    // Renderiza o baralho de compras
    const deckContainer = document.getElementById('deck');
    deckContainer.innerHTML = '';
    deckContainer.classList.remove('empty'); // Remove classe de vazio por segurança

    if (gameDeck.length > 0) {
        // Apenas uma carta para representar o baralho virado para baixo
        const cardBackDiv = document.createElement('div');
        cardBackDiv.classList.add('card', 'back');
        deckContainer.appendChild(cardBackDiv);
    } else {
        deckContainer.classList.add('empty'); // Adiciona uma classe para indicar que está vazio
    }

    // Renderiza a pilha de descarte
    const wastePileEl = document.getElementById('waste-pile');
    wastePileEl.innerHTML = '';
    // Adicionar listeners para dropar na pilha de descarte (se necessário no futuro)
    wastePileEl.addEventListener('dragover', allowDrop);
    wastePileEl.addEventListener('drop', drop);
    wastePileEl.addEventListener('dragleave', dragLeave);
    wastePileEl.addEventListener('dragenter', dragEnter);

    if (wastePile.length > 0) {
        const topWasteCard = wastePile[wastePile.length - 1]; // Pega a carta do topo
        const cardEl = createCardElement(topWasteCard);
        // A carta do topo da pilha de descarte é arrastável
        cardEl.classList.add('draggable-card');
        cardEl.setAttribute('draggable', 'true');
        cardEl.addEventListener('dragstart', dragStart);
        cardEl.dataset.pileType = 'waste';
        cardEl.dataset.pileIndex = 0; // A pilha de descarte é conceitualmente uma única pilha
        cardEl.dataset.cardIndex = wastePile.length - 1; // Índice da carta no topo
        wastePileEl.appendChild(cardEl);
    }

    // Renderiza as pilhas do tabuleiro
    tableauPiles.forEach((pile, index) => {
        const tableauEl = document.getElementById(`tableau-${index + 1}`);
        tableauEl.innerHTML = ''; // Limpa a pilha antes de renderizar
        // Adiciona listeners para dropar nas pilhas do tableau
        tableauEl.addEventListener('dragover', allowDrop);
        tableauEl.addEventListener('drop', drop);
        tableauEl.addEventListener('dragleave', dragLeave);
        tableauEl.addEventListener('dragenter', dragEnter);

        pile.forEach((card, cardIndex) => {
            const cardEl = createCardElement(card);
            cardEl.dataset.pileType = 'tableau';
            cardEl.dataset.pileIndex = index;
            cardEl.dataset.cardIndex = cardIndex;

            // Adiciona uma pequena margem para empilhar as cartas visualmente
            if (cardIndex > 0) {
                cardEl.style.marginTop = '-85px'; // Ajuste este valor para o empilhamento
            }

            // Torna as cartas viradas para cima no tableau arrastáveis
            if (card.isFaceUp) {
                cardEl.classList.add('draggable-card');
                cardEl.setAttribute('draggable', 'true');
                cardEl.addEventListener('dragstart', dragStart);
            }
            tableauEl.appendChild(cardEl);
        });
    });

    // Renderiza as pilhas base (foundation)
    foundationPiles.forEach((pile, index) => {
        const foundationEl = document.getElementById(`foundation-${index + 1}`);
        foundationEl.innerHTML = '';
        // Adiciona listeners para dropar nas pilhas da fundação
        foundationEl.addEventListener('dragover', allowDrop);
        foundationEl.addEventListener('drop', drop);
        foundationEl.addEventListener('dragleave', dragLeave);
        foundationEl.addEventListener('dragenter', dragEnter);

        if (pile.length > 0) {
            const topCard = pile[pile.length - 1];
            const cardEl = createCardElement(topCard);
            cardEl.dataset.pileType = 'foundation';
            cardEl.dataset.pileIndex = index;
            cardEl.dataset.cardIndex = pile.length - 1; // Último índice
            // Cartas da fundação geralmente não são arrastáveis para fora no Paciência clássico
            // Mas poderíamos adicionar: cardEl.setAttribute('draggable', 'true'); cardEl.addEventListener('dragstart', dragStart);
            foundationEl.appendChild(cardEl);
        }
    });
}

// --- Funções de Manipulação de Drag and Drop ---

/**
 * Inicia o processo de arrasto de uma carta ou grupo de cartas.
 * @param {Event} event O evento dragstart.
 */
function dragStart(event) {
    const cardElement = event.target;
    cardElement.classList.add('dragging'); // Feedback visual

    const pileType = cardElement.dataset.pileType;
    const pileIndex = parseInt(cardElement.dataset.pileIndex);
    const cardIndex = parseInt(cardElement.dataset.cardIndex);

    // Resetar variáveis de arrasto
    draggedCard = null;
    originalPileData = { type: null, index: -1, cardIndex: -1 };
    draggedCardsArray = [];

    originalPileData.type = pileType;
    originalPileData.index = pileIndex;
    originalPileData.cardIndex = cardIndex;

    let sourcePileArray;

    if (pileType === 'tableau') {
        sourcePileArray = tableauPiles[pileIndex];
        draggedCardsArray = sourcePileArray.slice(cardIndex);
    } else if (pileType === 'waste') {
        sourcePileArray = wastePile;
        draggedCard = wastePile[cardIndex];
        draggedCardsArray = [draggedCard]; // Da waste, sempre uma única carta
    }

    // Passa os dados da carta/pilha através do dataTransfer
    event.dataTransfer.setData('text/plain', JSON.stringify(originalPileData));
    event.dataTransfer.effectAllowed = 'move';
}

/**
 * Permite que um elemento seja um alvo de drop.
 * @param {Event} event O evento dragover.
 */
function allowDrop(event) {
    event.preventDefault(); // Impede o comportamento padrão do navegador (ex: abrir imagem)
    if (event.target.classList.contains('pile') || event.target.closest('.pile')) {
        const targetPileEl = event.target.classList.contains('pile') ? event.target : event.target.closest('.pile');
        targetPileEl.classList.add('drag-over'); // Feedback visual
    }
}

/**
 * Adiciona feedback visual quando o mouse entra em um alvo de drop.
 * @param {Event} event O evento dragenter.
 */
function dragEnter(event) {
    event.preventDefault();
    if (event.target.classList.contains('pile') || event.target.closest('.pile')) {
        const targetPileEl = event.target.classList.contains('pile') ? event.target : event.target.closest('.pile');
        targetPileEl.classList.add('drag-over');
    }
}

/**
 * Remove feedback visual quando o mouse sai de um alvo de drop.
 * @param {Event} event O evento dragleave.
 */
function dragLeave(event) {
    if (event.target.classList.contains('pile') || event.target.closest('.pile')) {
        const targetPileEl = event.target.classList.contains('pile') ? event.target : event.target.closest('.pile');
        targetPileEl.classList.remove('drag-over');
    }
}

/**
 * Lida com o evento de soltar a carta. Valida o movimento e atualiza o estado do jogo.
 * @param {Event} event O evento drop.
 */
// ... (código anterior da função drop) ...

function drop(event) {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData('text/plain'));

    const sourcePileType = data.type;
    const sourcePileIndex = data.pileIndex;
    const sourceCardIndex = data.cardIndex;

    const targetElement = event.target.closest('.pile');
    if (!targetElement) {
        cleanupDrag();
        return; // Não soltou em uma pilha válida
    }

    const targetPileType = targetElement.id.includes('tableau') ? 'tableau' :
                           targetElement.id.includes('foundation') ? 'foundation' :
                           targetElement.id.includes('waste') ? 'waste' : null;

    let targetPileIndex = -1;
    if (targetPileType === 'tableau') {
        targetPileIndex = parseInt(targetElement.id.replace('tableau-', '')) - 1;
    } else if (targetPileType === 'foundation') {
        targetPileIndex = parseInt(targetElement.id.replace('foundation-', '')) - 1;
    } else if (targetPileType === 'waste') {
        targetPileIndex = 0; // A pilha de descarte é única
    }

    let isValidMove = false;
    let cardsToMove = [];
    let sourcePileArray = []; // Inicializa com um array vazio para evitar undefined

    // Determina as cartas a serem movidas e a pilha de origem
    if (sourcePileType === 'tableau') {
        if (tableauPiles[sourcePileIndex]) { // Adiciona verificação de existência da pilha
            sourcePileArray = tableauPiles[sourcePileIndex];
            // Certifique-se de que sourceCardIndex não é maior que o tamanho da pilha
            if (sourceCardIndex >= 0 && sourceCardIndex < sourcePileArray.length) {
                cardsToMove = sourcePileArray.slice(sourceCardIndex);
            }
        }
    } else if (sourcePileType === 'waste') {
        sourcePileArray = wastePile;
        if (sourceCardIndex >= 0 && sourceCardIndex < sourcePileArray.length) {
            cardsToMove = [wastePile[sourceCardIndex]]; // Da waste, sempre uma única carta
        }
    } else {
        // Caso a origem não seja reconhecida, limpa e sai
        cleanupDrag();
        return;
    }


    if (cardsToMove.length === 0) {
        cleanupDrag();
        return; // Nenhuma carta para mover ou origem inválida
    }

    const topCardToMove = cardsToMove[0];

    // ... (restante da sua lógica de validação de movimento e execução) ...
}
    // --- Lógica de Validação de Movimento ---
    if (targetPileType === 'tableau') {
        const targetPileArray = tableauPiles[targetPileIndex];
        if (targetPileArray.length === 0) {
            // Regra: Só pode mover um Rei para uma pilha vazia do tabuleiro
            if (topCardToMove.rank === 'K') {
                isValidMove = true;
            }
        } else {
            const topCardInTargetPile = targetPileArray[targetPileArray.length - 1];
            // Regra: Alternar cores e rank decrescente
            const topCardToMoveColor = redSuits.includes(topCardToMove.suit) ? 'red' : 'black';
            const topCardInTargetPileColor = redSuits.includes(topCardInTargetPile.suit) ? 'red' : 'black';

            const rankIndexToMove = ranks.indexOf(topCardToMove.rank);
            const rankIndexInTarget = ranks.indexOf(topCardInTargetPile.rank);

            if (topCardToMoveColor !== topCardInTargetPileColor &&
                rankIndexToMove === rankIndexInTarget - 1) {
                isValidMove = true;
            }
        }
    } else if (targetPileType === 'foundation') {
        // Regra: Apenas uma carta pode ser movida para a fundação por vez
        if (cardsToMove.length === 1) {
            const targetFoundationPile = foundationPiles[targetPileIndex];
            if (targetFoundationPile.length === 0) {
                // Regra: Só pode começar uma fundação com um Ás
                if (topCardToMove.rank === 'A') {
                    isValidMove = true;
                }
            } else {
                const topCardInFoundation = targetFoundationPile[targetFoundationPile.length - 1];
                // Regra: Mesmo naipe e rank crescente
                const rankIndexToMove = ranks.indexOf(topCardToMove.rank);
                const rankIndexInFoundation = ranks.indexOf(topCardInFoundation.rank);

                if (topCardToMove.suit === topCardInFoundation.suit &&
                    rankIndexToMove === rankIndexInFoundation + 1) {
                    isValidMove = true;
                }
            }
        }
    }

    if (isValidMove) {
        // Realiza o movimento: remove da origem e adiciona ao destino
        sourcePileArray.splice(sourceCardIndex, cardsToMove.length);

        if (targetPileType === 'tableau') {
            tableauPiles[targetPileIndex].push(...cardsToMove);
            // Se a pilha de origem era do tableau e a carta abaixo virou, vira ela
            if (sourcePileType === 'tableau' && sourcePileArray.length > 0) {
                const lastCardInSource = sourcePileArray[sourcePileArray.length - 1];
                if (!lastCardInSource.isFaceUp) {
                    lastCardInSource.isFaceUp = true;
                }
            }
        } else if (targetPileType === 'foundation') {
            foundationPiles[targetPileIndex].push(...cardsToMove);
            // Se a pilha de origem era do tableau e a carta abaixo virou, vira ela
            if (sourcePileType === 'tableau' && sourcePileArray.length > 0) {
                const lastCardInSource = sourcePileArray[sourcePileArray.length - 1];
                if (!lastCardInSource.isFaceUp) {
                    lastCardInSource.isFaceUp = true;
                }
            }
        }
    }

    cleanupDrag(); // Limpa o estado do arrasto
    renderGame(); // Atualiza a interface do jogo
    checkWinCondition(); // Verifica se o jogo terminou


/**
 * Garante que a classe 'dragging' e 'drag-over' sejam removidas após o arrasto.
 */
function cleanupDrag() {
    const draggingCard = document.querySelector('.card.dragging');
    if (draggingCard) {
        draggingCard.classList.remove('dragging');
    }
    document.querySelectorAll('.pile.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });
    draggedCard = null;
    originalPileData = { type: null, index: -1, cardIndex: -1 };
    draggedCardsArray = [];
}

/**
 * Verifica se o jogador venceu o jogo.
 */
function checkWinCondition() {
    const allCardsInFoundation = foundationPiles.every(pile => pile.length === 13);
    if (allCardsInFoundation) {
        // Um pequeno atraso para a renderização final antes do alerta
        setTimeout(() => {
            alert('Parabéns! Você venceu o jogo de Paciência!');
            // Poderíamos adicionar opções como "Jogar Novamente" aqui
        }, 100);
    }
}

// --- Event Listeners ---

// Adicionar ouvinte de evento para o clique no baralho de compras
document.getElementById('deck').addEventListener('click', () => {
    if (gameDeck.length > 0) {
        const card = gameDeck.pop();
        card.isFaceUp = true; // A carta virada do baralho de compras sempre fica para cima
        wastePile.push(card);
    } else {
        // Se o baralho de compras estiver vazio, recicla a pilha de descarte
        if (wastePile.length > 0) { // Só recicla se houver cartas no descarte
            // Inverte a ordem das cartas ao reciclar para simular a virada do baralho
            while (wastePile.length > 0) {
                const card = wastePile.pop();
                card.isFaceUp = false; // Vira as cartas para baixo novamente
                gameDeck.push(card);
            }
            // Opcional: Para Paciência com baralho infinito, não reembaralharia. Para 1 ou 3 passagens, sim.
            // gameDeck = shuffleDeck(gameDeck); // Descomente se quiser reembaralhar o deck reciclado
        }
    }
    renderGame(); // Renderiza o jogo após a ação
});

// Iniciar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', initializeGame);